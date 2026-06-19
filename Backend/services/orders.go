package services

import (
	"errors"
	"net/http"
	"time"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
	"gorm.io/gorm"
)

type OrderService struct {
	OrderRepo    *repository.OrderRepo
	CustomerRepo *repository.CustomerRepo
	ShoeRepo     *repository.ShoeRepo
	EmployeeRepo *repository.EmployeeRepo
	DB           *gorm.DB
}

func NewOrderService(or *repository.OrderRepo, cr *repository.CustomerRepo, sr *repository.ShoeRepo, er *repository.EmployeeRepo, db *gorm.DB) *OrderService {
	return &OrderService{OrderRepo: or, CustomerRepo: cr, ShoeRepo: sr, EmployeeRepo: er, DB: db}
}

func (svc *OrderService) CreateOrder(data *dto.CreateOrderRequest) (int, *dto.OrderResponse, error) {

	err := svc.CustomerRepo.DB.First(&models.Customer{}, data.CusID).Error
	if err != nil {
		return http.StatusBadRequest, nil, errors.New("macmiilka la doortay kama jiro nidaamka")
	}

	err = svc.EmployeeRepo.DB.First(&models.Employee{}, data.EmpID).Error
	if err != nil {
		return http.StatusBadRequest, nil, errors.New("shaqaalaha la doortay kama jiro nidaamka")
	}

	tx := svc.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var shoe models.Shoe
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&shoe, data.ShoeID).Error; err != nil {
		tx.Rollback()
		return http.StatusBadRequest, nil, errors.New("kabaha la doortay kama jiraan dukaanka")
	}

	if shoe.Qty < data.Qty {
		tx.Rollback()
		return http.StatusBadRequest, nil, errors.New("kabo ku filan dukaanka ma yaallaan, inta taal waa yar tahay")
	}

	shoe.Qty = shoe.Qty - data.Qty
	if err := tx.Save(&shoe).Error; err != nil {
		tx.Rollback()
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay inaan cusbooneysiiyo tirada kabaha dukaanka")
	}

	totalPrice := float64(data.Qty) * shoe.Price

	order := models.Order{
		CusID:      data.CusID,
		ShoeID:     data.ShoeID,
		EmpID:      data.EmpID,
		Qty:        data.Qty,
		TotalPrice: totalPrice,
		OrderDate:  time.Now(),
	}

	if data.AmountPaid == 0 {
		order.Status = "DEBT"
	} else if data.AmountPaid >= totalPrice {
		order.Status = "PAID"
	} else {
		order.Status = "PARTIAL"
	}

	if err := svc.OrderRepo.CreateOrder(tx, &order); err != nil {
		tx.Rollback()
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay kaydinta dalabka")
	}

	if data.AmountPaid > 0 {
		payment := models.Payment{
			OrderID:       order.ID,
			CusID:         order.CusID,
			ShoeID:        order.ShoeID,
			Qty:           order.Qty,
			AmountPaid:    data.AmountPaid,
			PaymentMethod: data.PaymentMethod,
			PaymentDate:   time.Now(),
		}
		if err := tx.Create(&payment).Error; err != nil {
			tx.Rollback()
			return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay diiwangelinta lacagta")
		}
	}

	if err := tx.Commit().Error; err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay dhameystirka iibka")
	}

	fullOrder, _ := svc.OrderRepo.GetOrderByID(order.ID)

	response := &dto.OrderResponse{
		OrderID:   fullOrder.ID,
		Qty:       fullOrder.Qty,
		OrderDate: fullOrder.OrderDate.Format("2006-01-02 15:04:05"),
		Customer: &dto.CustomerResponse{
			ID:      fullOrder.Customer.ID,
			CusName: fullOrder.Customer.CusName,
		},
		Shoe: &dto.ShoeResponse{
			ID:        fullOrder.Shoe.ID,
			ShoeName:  fullOrder.Shoe.ShoeName,
			ShoeBrand: fullOrder.Shoe.ShoeBrand,
		},
		Employee: &dto.EmployeeResponse{
			ID:      fullOrder.Employee.ID,
			EmpName: fullOrder.Employee.EmpName,
		},
	}

	return http.StatusCreated, response, nil
}
