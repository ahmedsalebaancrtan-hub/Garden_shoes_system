package services

import (
	"errors"
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

func (svc *PaymentService) ProcessDebtPayment(data *dto.ProcessPaymentRequest) (int, error) {
	// 1. Hubi in dalabkii (Order-kii) uu jiro
	var order models.Order
	if err := svc.DB.First(&order, data.OrderID).Error; err != nil {
		return http.StatusNotFound, errors.New("dalabka loo rabo lacag bixinta kama jiro nidaamka")
	}

	// 2. Xisaabi inta lacag ah ee horey looga bixiyey dalabkan (Sum of all previous payments)
	var totalPaidBefore float64
	svc.DB.Model(&models.Payment{}).
		Where("order_id = ?", order.ID).
		Select("COALESCE(SUM(amount_paid), 0)").
		Scan(&totalPaidBefore)

	// 3. Xisaabi deynta hadda rasmiga u dhiman dalabka
	remainingDebt := order.TotalPrice - totalPaidBefore

	// 4. Hubi haddii mar hore lagu wada bixiyey lacagta
	if order.Status == "PAID" || remainingDebt <= 0 {
		return http.StatusBadRequest, errors.New("dalabkan hore ayaa loogu wada bixiyey lacagta, deyn naguma laha")
	}

	// 5. Hubi in lacagta la keenay aysan ka badnayn deynta hartay
	if data.AmountPaid > remainingDebt {
		return http.StatusBadRequest, errors.New("lacagta aad keentay waxay ka badantahay deynta lagu leeyahay macmiilka")
	}

	// 6. Adeegso Transaction si labada isbeddel hal mara u badbaadaan
	err := svc.DB.Transaction(func(tx *gorm.DB) error {
		// Diiwangeli lacag bixinta deynta (Payment-ka cusub)
		payment := models.Payment{
			OrderID:       data.OrderID,
			CusID:         order.CusID,
			ShoeID:        order.ShoeID,
			Qty:           order.Qty,
			AmountPaid:    data.AmountPaid,
			PaymentMethod: data.PaymentMethod,
			PaymentDate:   time.Now(),
		}

		if err := tx.Create(&payment).Error; err != nil {
			return err
		}

		// Haddii lacagta la bixiyey hadda ay daboolayso deyntii hartay gabi ahaanba, beddel status-ka order-ka
		if (remainingDebt - data.AmountPaid) == 0 {
			order.Status = "PAID"
			if err := tx.Save(&order).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay kaydinta lacag bixinta iyo casriyeynta deynta")
	}

	return http.StatusOK, nil
}
