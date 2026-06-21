package repository

import (
	"errors"
	"fmt"
	"time"

	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type OrderRepo struct {
	DB *gorm.DB
}

func RegisterOrderRepo(db *gorm.DB) *OrderRepo {
	return &OrderRepo{DB: db}
}

// 1. Koodhkii hore ee CreateOrder (Wuu sii joogayaa)
func (r *OrderRepo) CreateOrder(tx *gorm.DB, order *models.Order) error {
	return tx.Create(order).Error
}

// 2. KAN CUSUB: Kani wuxuu isku dhex-marayaa Hubinta Tirada Kabaha, Goynta Stock-ka, iyo Diiwangelinta Lacagta (Calculations)
func (r *OrderRepo) CreateOrderWithStockCheck(order *models.Order, amountPaid float64) (*models.Order, error) {
	// Waxaan ka dhalinaynaa Transaction cusub nidaamka guud ee r.DB
	tx := r.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// A. Hubi in kabaha la dalbaday ay stock-ka ku jiraan (FOR UPDATE wuxuu xirayaa line-kaan inta la xisaabinayo)
	var shoe models.Shoe
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&shoe, order.ShoeID).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("kabaha la dalbaday lama helin")
	}

	// B. CALCULATION: Hubi haddii tirada la rabo ay ka badan tahay waxa yaala stock-ka
	if shoe.Qty < order.Qty {
		tx.Rollback()
		return nil, fmt.Errorf("kabo ku filan ma yaallaan stock-ka. Waxaa haray kaliya: %d pair", shoe.Qty)
	}

	// C. UPDATE STOCK: Ka jiri tirada kabaha la iibsaday (Xisaab hufan)
	newQty := shoe.Qty - order.Qty
	if err := tx.Model(&shoe).Update("qty", newQty).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("ku guuldareystay in stock-ka la baddalo")
	}

	// D. CREATE ORDER: Keydi dalabka adigoo isticmaalaya "tx"
	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("ku guuldareystay abuurista dalabka")
	}

	// E. CREATE PAYMENT: Diiwanglee lacag bixinta haddii uu lacag dhiibay mar quya ah
	if amountPaid > 0 {
		payment := models.Payment{
			CusID:       order.CusID,
			ShoeID:      order.ShoeID,
			Qty:         order.Qty,
			AmountPaid:  amountPaid,
			PaymentDate: time.Now(),
		}
		if err := tx.Create(&payment).Error; err != nil {
			tx.Rollback()
			return nil, errors.New("ku guuldareystay diiwangelinta lacagta")
		}
	}

	// Haddii wax walba ay saxsan yihiin, database-ka ku dharbaax Commit
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return order, nil
}

func (r *OrderRepo) GetAllOrders() ([]models.Order, error) {
	var orders []models.Order

	// Unscoped() inside each Preload callback ensures soft-deleted related
	// records (Customer / Shoe / Employee) still appear on historical orders.
	unscopedFn := func(db *gorm.DB) *gorm.DB { return db.Unscoped() }

	if err := r.DB.
		Preload("Customer", unscopedFn).
		Preload("Shoe", unscopedFn).
		Preload("Employee", unscopedFn).
		Order("o_id desc").
		Find(&orders).Error; err != nil {
		return nil, err
	}

	return orders, nil
}

func (r *OrderRepo) GetOrderByID(id uint) (models.Order, error) {
	var order models.Order

	unscopedFn := func(db *gorm.DB) *gorm.DB { return db.Unscoped() }

	err := r.DB.
		Preload("Customer", unscopedFn).
		Preload("Shoe", unscopedFn).
		Preload("Shoe.Supplier", unscopedFn).
		Preload("Employee", unscopedFn).
		First(&order, id).Error

	return order, err
}
