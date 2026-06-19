package repository

import (
	"time"

	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type ReportRepo struct {
	DB *gorm.DB
}

func RegisterReportRepo(db *gorm.DB) *ReportRepo {
	return &ReportRepo{DB: db}
}

func (r *ReportRepo) GetSalesSummary(startDate, endDate time.Time) (float64, int64, int64, error) {
	var totalSales float64
	var totalOrders int64
	var totalItemsSold int64

	r.DB.Model(&models.Payment{}).
		Where("payment_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(amount_paid), 0)").Scan(&totalSales)

	r.DB.Model(&models.Order{}).
		Where("order_date BETWEEN ? AND ?", startDate, endDate).
		Count(&totalOrders)

	r.DB.Model(&models.Order{}).
		Where("order_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(qty), 0)").Scan(&totalItemsSold)

	return totalSales, totalOrders, totalItemsSold, nil
}

func (r *ReportRepo) GetSalesByMethod(startDate, endDate time.Time) (map[string]float64, error) {
	type Result struct {
		PaymentMethod string
		Total         float64
	}
	var results []Result

	r.DB.Model(&models.Payment{}).
		Where("payment_date BETWEEN ? AND ?", startDate, endDate).
		Select("payment_method, SUM(amount_paid) as total").
		Group("payment_method").
		Scan(&results)

	methodMap := make(map[string]float64)
	for _, res := range results {
		methodMap[res.PaymentMethod] = res.Total
	}

	return methodMap, nil
}

// GetCustomerMonthlyStatement wuxuu soo xisaabinayaa taariikhda macmiilka ee bil gaar ah
func (r *ReportRepo) GetCustomerMonthlyStatement(cusID uint, year int, month int) ([]models.Order, error) {
	var orders []models.Order

	// Waxaan soo nuxuraynaynaa dhammaan orders-ka macmiilka uu sameeyey bishaas dhexdeeda
	err := r.DB.Preload("Customer").Preload("Shoe").
		Where("cus_id = ? AND EXTRACT(YEAR FROM order_date) = ? AND EXTRACT(MONTH FROM order_date) = ?", cusID, year, month).
		Order("order_date asc").
		Find(&orders).Error

	return orders, err
}

// GetInvoiceData wuxuu soo helayaa xogta hal dalab oo loogu talagallay rasiidh
func (r *ReportRepo) GetInvoiceData(orderID uint) (*models.Order, error) {
	var order models.Order
	err := r.DB.Preload("Customer").Preload("Shoe").Preload("Employee").
		First(&order, orderID).Error
	return &order, err
}
