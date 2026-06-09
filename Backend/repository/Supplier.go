package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type SupplierRepo struct {
	DB *gorm.DB
}

func RegisterSupplierRepo(db *gorm.DB) *SupplierRepo {
	return &SupplierRepo{DB: db}
}

func (r *SupplierRepo) CreateSupplier(supplier *models.Supplier) error {
	return r.DB.Create(supplier).Error
}

func (r *SupplierRepo) GetAllSuppliers() ([]models.Supplier, error) {
	var suppliers []models.Supplier
	err := r.DB.Find(&suppliers).Error
	return suppliers, err
}

func (r *SupplierRepo) GetSupplierByID(id uint) (models.Supplier, error) {
	var supplier models.Supplier
	err := r.DB.First(&supplier, id).Error
	return supplier, err
}
