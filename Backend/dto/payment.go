package dto

type ProcessPaymentRequest struct {
	OrderID       uint    `json:"order_id" binding:"required"`
	AmountPaid    float64 `json:"amount_paid" binding:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" binding:"required"` // CASH, ZAAD, EVC
}
