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
func (r *CustomerRepo) UpdateCustomer(customer *models.Customer) error {
	return r.DB.Save(customer).Error
}

func (r *CustomerRepo) DeleteCustomer(id uint) error {
	return r.DB.Delete(&models.Customer{}, id).Error
}
func (r *CustomerRepo) GetCustomerByID(id uint) (*models.Customer, error) {
	var customer models.Customer

	// Wuxuu raadinayaa macmiilka leh ID-ga la soo dhiibay, haddii uu waayana wuxuu soo celinayaa error
	if err := r.DB.First(&customer, id).Error; err != nil {
		return nil, err
	}

	return &customer, nil
}
