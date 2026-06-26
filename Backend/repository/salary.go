package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type SalaryRepo struct {
	DB *gorm.DB
}

func RegisterSalaryRepo(db *gorm.DB) *SalaryRepo {
	return &SalaryRepo{DB: db}
}

func (r *SalaryRepo) CreateSalary(salary *models.Salary) error {
	return r.DB.Create(salary).Error
}

func (r *SalaryRepo) GetAllSalaries() ([]models.Salary, error) {
	var salaries []models.Salary
	err := r.DB.Preload("Employee").Find(&salaries).Error
	return salaries, err
}
