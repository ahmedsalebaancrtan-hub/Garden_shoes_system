package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type CustomerRepo struct {
	DB *gorm.DB
}

func RegisterCustomerRepo(db *gorm.DB) *CustomerRepo {
	return &CustomerRepo{DB: db}
}

func (r *CustomerRepo) CreateCustomer(customer *models.Customer) error {
	return r.DB.Create(customer).Error
}

func (r *CustomerRepo) GetCustomerByPhone(phone string) (models.Customer, error) {
	var customer models.Customer
	err := r.DB.Where("cus_phone = ?", phone).First(&customer).Error
	return customer, err
}

func (r *CustomerRepo) GetAllCustomers() ([]models.Customer, error) {
	var customers []models.Customer
	err := r.DB.Find(&customers).Error
	return customers, err
}
