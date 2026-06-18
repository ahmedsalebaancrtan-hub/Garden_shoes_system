package models

import (
	"time"

	"gorm.io/gorm"
)

type Customer struct {
	ID         uint   `gorm:"primaryKey;autoIncrement;column:cus_id" json:"cus_id"`
	CusName    string `gorm:"type:varchar(150);not null" json:"cus_name"`
	CusAddress string `gorm:"type:varchar(255);not null" json:"cus_address"`
	CusCity    string `gorm:"type:varchar(100);not null" json:"cus_city"`
	CusPhone   string `gorm:"type:varchar(20);not null" json:"cus_phone"`
	CusAge     int    `gorm:"type:int" json:"cus_age"`

	// Has Many Relationships
	Orders   []Order   `gorm:"foreignKey:CusID" json:"orders,omitempty"`
	Payments []Payment `gorm:"foreignKey:CusID" json:"payments,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
