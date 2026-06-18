package dto

type CreatePaymentRequest struct {
	CusID      uint    `json:"cus_id" binding:"required"`
	ShoeID     uint    `json:"shoe_id" binding:"required"`
	Qty        int     `json:"qty" binding:"required,gt=0"`
	AmountPaid float64 `json:"amount_paid" binding:"required,gt=0"`
}

type PaymentResponse struct {
	PaymentID   uint              `json:"pay_id"`
	Qty         int               `json:"qty"`
	AmountPaid  float64           `json:"amount_paid"`
	PaymentDate string            `json:"payment_date"`
	Customer    *CustomerResponse `json:"customer,omitempty"`
	Shoe        *ShoeResponse     `json:"shoe,omitempty"`
}
