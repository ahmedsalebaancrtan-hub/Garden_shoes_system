package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type PaymentRepo struct {
	DB *gorm.DB
}

func RegisterPaymentRepo(db *gorm.DB) *PaymentRepo {
	return &PaymentRepo{DB: db}
}

func (r *PaymentRepo) CreatePayment(payment *models.Payment) error {
	return r.DB.Create(payment).Error
}

func (r *PaymentRepo) GetAllPayments() ([]models.Payment, error) {
	var payments []models.Payment
	err := r.DB.Preload("Customer").Preload("Shoe").Find(&payments).Error
	return payments, err
}
