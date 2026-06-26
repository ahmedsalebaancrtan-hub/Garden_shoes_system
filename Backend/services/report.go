package services

import (
	"time"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
)

type ReportService struct {
	ReportRepo *repository.ReportRepo
}

func NewReportService(rr *repository.ReportRepo) *ReportService {
	return &ReportService{ReportRepo: rr}
}

func (svc *ReportService) GetDailyReport() (*dto.DashboardSummaryResponse, error) {
	// Waxaan xisaabinaynaa bilowga maanta (00:00:00) ilaa dhamaadka maanta (23:59:59)
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endDate := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())

	totalSales, totalOrders, totalItemsSold, err := svc.ReportRepo.GetSalesSummary(startDate, endDate)
	if err != nil {
		return nil, err
	}

	salesByMethod, err := svc.ReportRepo.GetSalesByMethod(startDate, endDate)
	if err != nil {
		return nil, err
	}

	response := &dto.DashboardSummaryResponse{
		TotalSales:     totalSales,
		TotalOrders:    totalOrders,
		TotalItemsSold: totalItemsSold,
		SalesByMethod:  salesByMethod,
	}

	return response, nil
}

func (svc *ReportService) GetCustomerMonthlyReport(cusID uint, year int, month int) (*dto.CustomerMonthlyStatement, error) {
	orders, err := svc.ReportRepo.GetCustomerMonthlyStatement(cusID, year, month)
	if err != nil {
		return nil, err
	}

	var history []dto.OrderReceiptResponse
	var totalBought float64
	var totalPaid float64
	var customerName string

	for _, o := range orders {
		customerName = o.Customer.CusName

		// Soo xisaabi inta qofku uu ka bixiyey order-kaan gaarka ah (ka raadi shaxda payments)
		var paidForThisOrder float64
		svc.ReportRepo.DB.Model(&models.Payment{}).
			Where("order_id = ?", o.ID).
			Select("COALESCE(SUM(amount_paid), 0)").Scan(&paidForThisOrder)

		// Natiijada saxda ah: total_price - discount - lacagii laga bixiyey
		remainingDebt := o.TotalPrice - o.Discount - paidForThisOrder
		totalBought += o.TotalPrice - o.Discount  // sum of discounted totals
		totalPaid += paidForThisOrder

		history = append(history, dto.OrderReceiptResponse{
			OrderID:       o.ID,
			CustomerName:  o.Customer.CusName,
			ShoeName:      o.Shoe.ShoeName,
			Qty:           o.Qty,
			TotalPrice:    o.TotalPrice - o.Discount, // discounted total
			AmountPaid:    paidForThisOrder,
			RemainingDebt: remainingDebt,
			Status:        o.Status,
			Date:          o.OrderDate.Format("2006-01-02 15:04:05"),
		})
	}

	statement := &dto.CustomerMonthlyStatement{
		CustomerName: customerName,
		Month:        time.Month(month).String(),
		TotalBought:  totalBought,
		TotalPaid:    totalPaid,
		CurrentDebt:  totalBought - totalPaid,
		History:      history,
	}

	return statement, nil
}
func (svc *ReportService) GetSingleInvoice(orderID uint) (*dto.SingleInvoiceResponse, error) {
	order, err := svc.ReportRepo.GetInvoiceData(orderID)
	if err != nil {
		return nil, err
	}

	// Xisaabi wadarta lacagta laga bixiyey dalabkan gaarka ah (Payments)
	var totalAmountPaid float64
	svc.ReportRepo.DB.Model(&models.Payment{}).
		Where("order_id = ?", order.ID).
		Select("COALESCE(SUM(amount_paid), 0)").Scan(&totalAmountPaid)

	remainingDebt := order.TotalPrice - order.Discount - totalAmountPaid

	invoice := &dto.SingleInvoiceResponse{
		OrderID:         order.ID,
		CustomerName:    order.Customer.CusName,
		CustomerPhone:   order.Customer.CusPhone,
		ShoeName:        order.Shoe.ShoeName,
		ShoeBrand:       order.Shoe.ShoeBrand,
		Qty:             order.Qty,
		UnitPrice:       order.Shoe.Price,
		Discount:        order.Discount,
		TotalPrice:      order.TotalPrice,
		TotalAmountPaid: totalAmountPaid,
		RemainingDebt:   remainingDebt,
		Status:          order.Status,
		CashierName:     order.Employee.EmpName,
		InvoiceDate:     order.OrderDate.Format("2006-01-02 15:04:05"),
	}

	return invoice, nil
}
