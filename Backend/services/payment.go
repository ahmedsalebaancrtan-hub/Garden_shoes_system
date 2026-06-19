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
	// 1. Hubi in dalabkii (Order-kii) deynta ahaa uu jiro
	var order models.Order
	if err := svc.DB.First(&order, data.OrderID).Error; err != nil {
		return http.StatusBadRequest, errors.New("dalabka loo rabo lacag bixinta kama jiro nidaamka")
	}

	// 2. Diiwangeli lacag bixinta deynta
	payment := models.Payment{
		OrderID:       data.OrderID,
		CusID:         data.CusID,
		ShoeID:        data.ShoeID,
		Qty:           data.Qty,
		AmountPaid:    data.AmountPaid,
		PaymentMethod: data.PaymentMethod, // CASH, ZAAD, EVC
		PaymentDate:   time.Now(),
	}

	if err := svc.DB.Create(&payment).Error; err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay kaydinta lacag bixinta")
	}

	return http.StatusCreated, nil
}
