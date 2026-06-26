package services

import (
	"errors"
	"math"
	"net/http"
	"time"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type PaymentService struct {
	DB *gorm.DB
}

func NewPaymentService(db *gorm.DB) *PaymentService {
	return &PaymentService{DB: db}
}

// ProcessDebtPayment records a partial or full debt payment for an existing order.
//
// ACCOUNTING INVARIANTS (strict — no shorthand):
//
//  1. Fetch the order and verify it is not already fully paid.
//  2. Compute:
//       totalAmountPaidSoFar  = SUM of all previous payments for this order
//       netDue                = order.TotalPrice - order.Discount - totalAmountPaidSoFar
//  3. OVERPAYMENT GUARD:
//       If data.AmountPaid > netDue  →  reject with HTTP 400.
//       A floating-point epsilon (floatEpsilon = 0.001) absorbs IEEE-754 rounding noise.
//  4. STATUS MAPPING (exact):
//       If (netDue - data.AmountPaid) <= floatEpsilon  →  order.Status = "PAID"
//       Otherwise                                       →  order.Status = "PARTIAL"
func (svc *PaymentService) ProcessDebtPayment(data *dto.ProcessPaymentRequest) (int, error) {
	// ── Step 1: Fetch the order ────────────────────────────────────────────────
	var order models.Order
	if err := svc.DB.First(&order, data.OrderID).Error; err != nil {
		return http.StatusNotFound, errors.New("dalabka loo rabo lacag bixinta kama jiro nidaamka")
	}

	// ── Step 2: Guard — order must not already be fully paid ──────────────────
	if order.Status == "PAID" {
		return http.StatusBadRequest, errors.New("dalabkan hore ayaa loogu wada bixiyey lacagta, deyn naguma laha")
	}

	// ── Step 3: Compute total_amount_paid_so_far ──────────────────────────────
	//    Sum every payment row already recorded against this order.
	var totalAmountPaidSoFar float64
	svc.DB.Model(&models.Payment{}).
		Where("order_id = ?", order.ID).
		Select("COALESCE(SUM(amount_paid), 0)").
		Scan(&totalAmountPaidSoFar)

	// ── Step 4: Calculate the strict net amount still due ─────────────────────
	//    Formula (from requirements):
	//    netDue = order.TotalPrice - order.Discount - totalAmountPaidSoFar
	netDue := order.TotalPrice - order.Discount - totalAmountPaidSoFar

	// ── Step 5: Secondary guard — netDue must be positive ─────────────────────
	//    If the order was not marked PAID but all money has been collected
	//    (e.g. a data inconsistency), still block new payments.
	if netDue <= 0 {
		return http.StatusBadRequest, errors.New("dalabkan hore ayaa loogu wada bixiyey lacagta, deyn naguma laha")
	}

	// ── Step 6: Overpayment guard ─────────────────────────────────────────────
	//    Floating-point epsilon absorbs IEEE-754 rounding noise.
	//    Reject any amount that meaningfully exceeds what is still owed.
	const floatEpsilon float64 = 0.001
	if data.AmountPaid > netDue+floatEpsilon {
		return http.StatusBadRequest, errors.New("Cilad: Ma bixin kartid lacag ka badan deynta dhabta ah ee u sarraysa dalabkan")
	}

	// ── Step 7: Persist inside a transaction ─────────────────────────────────
	//    Both the new payment row and the order status update must succeed or
	//    both must roll back — atomicity is critical for accounting correctness.
	err := svc.DB.Transaction(func(tx *gorm.DB) error {
		// 7a. Record the new payment.
		newPayment := models.Payment{
			OrderID:       data.OrderID,
			CusID:         order.CusID,
			ShoeID:        order.ShoeID,
			Qty:           order.Qty,
			AmountPaid:    data.AmountPaid,
			PaymentMethod: data.PaymentMethod,
			PaymentDate:   time.Now(),
		}
		if err := tx.Create(&newPayment).Error; err != nil {
			return err
		}

		// 7b. Determine and apply the correct order status.
		//
		//   remainingAfterThisPayment = netDue - data.AmountPaid
		//
		//   • If remainingAfterThisPayment <= floatEpsilon  →  debt is fully settled  →  "PAID"
		//   • Otherwise                                     →  debt partially remains  →  "PARTIAL"
		remainingAfterThisPayment := netDue - data.AmountPaid

		if math.Abs(remainingAfterThisPayment) <= floatEpsilon || remainingAfterThisPayment < 0 {
			// Payment exactly covers (or, due to epsilon, practically covers) the net due.
			order.Status = "PAID"
		} else {
			// Payment is less than the net due — order remains partially unpaid.
			order.Status = "PARTIAL"
		}

		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay kaydinta lacag bixinta iyo casriyeynta deynta")
	}

	return http.StatusOK, nil
}

