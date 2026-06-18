package models

import (
	"time"

	"gorm.io/gorm"
)

type Payment struct {
	ID          uint      `gorm:"primaryKey;autoIncrement;column:pay_id" json:"pay_id"`
	CusID       uint      `gorm:"not null;column:cus_id" json:"cus_id"`
	ShoeID      uint      `gorm:"not null;column:shoe_id" json:"shoe_id"`
	Qty         int       `gorm:"type:int;not null" json:"qty"`
	AmountPaid  float64   `gorm:"type:decimal(10,2);not null" json:"amount_paid"`
	PaymentDate time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"payment_date"`

	// Relations
	Customer Customer `gorm:"foreignKey:CusID;references:ID"  json:"customer,omitempty"`
	Shoe     Shoe     `gorm:"foreignKey:ShoeID;references:ID" json:"shoe,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
