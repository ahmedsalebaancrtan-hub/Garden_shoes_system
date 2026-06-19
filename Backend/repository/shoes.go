package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type ShoeRepo struct {
	DB *gorm.DB
}

func RegisterShoeRepo(db *gorm.DB) *ShoeRepo {
	return &ShoeRepo{DB: db}
}

func (r *ShoeRepo) CreateShoe(shoe *models.Shoe) error {
	return r.DB.Create(shoe).Error
}

func (r *ShoeRepo) GetAllShoes() ([]models.Shoe, error) {
	var shoes []models.Shoe
	// Preload automatically populates the nested Supplier model information
	err := r.DB.Preload("Supplier").Find(&shoes).Error
	return shoes, err
}

func (r *ShoeRepo) GetShoeByID(id uint) (models.Shoe, error) {
	var shoe models.Shoe
	err := r.DB.Preload("Supplier").First(&shoe, id).Error
	return shoe, err
}
func (r *ShoeRepo) UpdateShoe(shoe *models.Shoe) error {
	return r.DB.Save(shoe).Error
}

func (r *ShoeRepo) DeleteShoe(id uint) error {
	return r.DB.Delete(&models.Shoe{}, id).Error
}
