package services

import (
	"errors"
	"net/http"
	"time"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
)

type PaymentService struct {
	PaymentRepo  *repository.PaymentRepo
	CustomerRepo *repository.CustomerRepo
	ShoeRepo     *repository.ShoeRepo
}

func NewPaymentService(pr *repository.PaymentRepo, cr *repository.CustomerRepo, sr *repository.ShoeRepo) *PaymentService {
	return &PaymentService{PaymentRepo: pr, CustomerRepo: cr, ShoeRepo: sr}
}

func (svc *PaymentService) ProcessPayment(data *dto.CreatePaymentRequest) (int, *dto.PaymentResponse, error) {
	// Hubi macmiilka
	err := svc.CustomerRepo.DB.First(&models.Customer{}, data.CusID).Error
	if err != nil {
		return http.StatusBadRequest, nil, errors.New("macmiilka lacagta bixinaya kama jiro nidaamka")
	}

	// Hubi kabaha
	err = svc.ShoeRepo.DB.First(&models.Shoe{}, data.ShoeID).Error
	if err != nil {
		return http.StatusBadRequest, nil, errors.New("kabaha lacagta laga bixinayo kama jiraan dukaanka")
	}

	payment := models.Payment{
		CusID:       data.CusID,
		ShoeID:      data.ShoeID,
		Qty:         data.Qty,
		AmountPaid:  data.AmountPaid,
		PaymentDate: time.Now(),
	}

	if err := svc.PaymentRepo.CreatePayment(&payment); err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareysatay xareynta lacag bixinta")
	}

	// Soo jiid xogta oo buuxda
	var fullPayment models.Payment
	svc.PaymentRepo.DB.Preload("Customer").Preload("Shoe").First(&fullPayment, payment.ID)

	response := &dto.PaymentResponse{
		PaymentID:   fullPayment.ID,
		Qty:         fullPayment.Qty,
		AmountPaid:  fullPayment.AmountPaid,
		PaymentDate: fullPayment.PaymentDate.Format("2006-01-02 15:04:05"),
		Customer: &dto.CustomerResponse{
			ID:      fullPayment.Customer.ID,
			CusName: fullPayment.Customer.CusName,
		},
		Shoe: &dto.ShoeResponse{
			ID:       fullPayment.Shoe.ID,
			ShoeName: fullPayment.Shoe.ShoeName,
		},
	}

	return http.StatusCreated, response, nil
}
