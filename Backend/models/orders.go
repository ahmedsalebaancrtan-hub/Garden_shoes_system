package models

import (
	"time"

	"gorm.io/gorm"
)

type Order struct {
	ID         uint      `gorm:"primaryKey;autoIncrement;column:o_id" json:"o_id"`
	CusID      uint      `gorm:"not null;column:cus_id" json:"cus_id"`
	ShoeID     uint      `gorm:"not null;column:shoe_id" json:"shoe_id"`
	EmpID      uint      `gorm:"not null;column:emp_id" json:"emp_id"`
	Qty        int       `gorm:"type:int;not null" json:"qty"`
	TotalPrice float64   `json:"total_price"` // Qiimaha guud (e.g., $111.00)
	Status     string    `json:"status"`      // PAID, DEBT, PARTIAL
	OrderDate  time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"order_date"`

	// Relations
	Customer Customer `gorm:"foreignKey:CusID;references:ID" json:"customer,omitempty"`
	Shoe     Shoe     `gorm:"foreignKey:ShoeID;references:ID" json:"shoe,omitempty"`
	Employee Employee `gorm:"foreignKey:EmpID;references:ID" json:"employee,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
