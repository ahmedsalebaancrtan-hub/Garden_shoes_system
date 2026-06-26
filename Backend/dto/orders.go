package dto

type CreateOrderRequest struct {
	CusID         uint    `json:"cus_id" binding:"required"`
	ShoeID        uint    `json:"shoe_id" binding:"required"`
	EmpID         uint    `json:"emp_id" binding:"required"`
	Qty           int     `json:"qty" binding:"required,gt=0"`
	Discount      float64 `json:"discount" binding:"gte=0"`     // Dhimista (discount)
	AmountPaid    float64 `json:"amount_paid" binding:"gte=0"` // Waxay noqon kartaa 0 (Deyn)
	PaymentMethod string  `json:"payment_method"`              // CASH, ZAAD, EVC
}

type OrderResponse struct {
	OrderID    uint              `json:"o_id"`
	Qty        int               `json:"qty"`
	Discount   float64           `json:"discount"`
	TotalPrice float64           `json:"total_price"`
	OrderDate  string            `json:"order_date"`
	Customer   *CustomerResponse `json:"customer,omitempty"`
	Shoe       *ShoeResponse     `json:"shoe,omitempty"`
	Employee   *EmployeeResponse `json:"employee,omitempty"`
}
