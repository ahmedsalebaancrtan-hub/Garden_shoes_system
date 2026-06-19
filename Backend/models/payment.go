package models

import "time"

type Payment struct {
	PayID         uint      `gorm:"primaryKey;autoIncrement" json:"pay_id"`
	OrderID       uint      `gorm:"not null" json:"order_id"` // Wuxuu ku xirmayaa dalabkii uu deynta ku qaatay
	CusID         uint      `gorm:"not null" json:"cus_id"`
	ShoeID        uint      `gorm:"not null" json:"shoe_id"`
	Qty           int       `gorm:"not null" json:"qty"`
	AmountPaid    float64   `gorm:"type:decimal(10,2);not null" json:"amount_paid"`
	PaymentMethod string    `gorm:"type:varchar(50);not null;default:'CASH'" json:"payment_method"` // CASH, ZAAD, EVC, iwm.
	PaymentDate   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"payment_date"`

	// Relations
	Order    Order    `gorm:"foreignKey:OrderID;references:ID" json:"order,omitempty"`
	Customer Customer `gorm:"foreignKey:CusID;references:ID" json:"customer,omitempty"`
	Shoe     Shoe     `gorm:"foreignKey:ShoeID;references:ID" json:"shoe,omitempty"`
}
