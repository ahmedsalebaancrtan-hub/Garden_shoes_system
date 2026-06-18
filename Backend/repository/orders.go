package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type OrderRepo struct {
	DB *gorm.DB
}

func RegisterOrderRepo(db *gorm.DB) *OrderRepo {
	return &OrderRepo{DB: db}
}

// CreateOrder wuxuu isticmaalayaa database transaction si loo hubiyo haddii kabuhu dhamaadaan in la baajiyo dalabka
func (r *OrderRepo) CreateOrder(tx *gorm.DB, order *models.Order) error {
	return tx.Create(order).Error
}

func (r *OrderRepo) GetAllOrders() ([]models.Order, error) {
	var orders []models.Order
	err := r.DB.Preload("Customer").Preload("Shoe").Preload("Shoe.Supplier").Preload("Employee").Find(&orders).Error
	return orders, err
}

func (r *OrderRepo) GetOrderByID(id uint) (models.Order, error) {
	var order models.Order
	err := r.DB.Preload("Customer").Preload("Shoe").Preload("Shoe.Supplier").Preload("Employee").First(&order, id).Error
	return order, err
}
