package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type EmployeeRepo struct {
	DB *gorm.DB
}

func RegisterEmployeeRepo(db *gorm.DB) *EmployeeRepo {
	return &EmployeeRepo{DB: db}
}

func (r *EmployeeRepo) CreateEmployee(employee *models.Employee) error {
	return r.DB.Create(employee).Error
}

func (r *EmployeeRepo) GetEmployeeByEmail(email string) (models.Employee, error) {
	var employee models.Employee
	err := r.DB.Where("emp_email = ?", email).First(&employee).Error
	return employee, err
}

func (r *EmployeeRepo) GetEmployeeByPhoneIncludingDeleted(phone string) (models.Employee, error) {
	var employee models.Employee
	err := r.DB.Unscoped().Where("emp_phone = ?", phone).First(&employee).Error
	return employee, err
}

func (r *EmployeeRepo) GetAllEmployees() ([]models.Employee, error) {
	var employees []models.Employee
	err := r.DB.Find(&employees).Error
	return employees, err
}
func (r *EmployeeRepo) UpdateEmployee(employee *models.Employee) error {
	return r.DB.Save(employee).Error
}

func (r *EmployeeRepo) DeleteEmployee(id uint) error {
	return r.DB.Delete(&models.Employee{}, id).Error
}
func (r *EmployeeRepo) GetEmployeeByID(id uint) (*models.Employee, error) {
	var employee models.Employee
	if err := r.DB.First(&employee, id).Error; err != nil {
		return nil, err
	}
	return &employee, nil
}
