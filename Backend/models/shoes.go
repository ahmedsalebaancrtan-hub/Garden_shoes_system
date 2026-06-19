package models

import (
	"time"

	"gorm.io/gorm"
)

type Shoe struct {
	ID        uint    `gorm:"primaryKey;autoIncrement;column:shoe_id" json:"shoe_id"`
	ShoeName  string  `gorm:"type:varchar(150);not null" json:"shoe_name"`
	ShoeType  string  `gorm:"type:varchar(100);not null" json:"shoe_type"`
	ShoeBrand string  `gorm:"type:varchar(100);not null" json:"shoe_brand"`
	ShoeDes   string  `gorm:"type:text" json:"shoe_des"`
	Qty       int     `gorm:"type:int;not null;default:0" json:"qty"`
	Price     float64 `json:"price" gorm:"type:decimal(10,2)"`

	// Belongs To Relationship
	SupID    uint     `gorm:"not null;column:sup_id" json:"sup_id"`
	Supplier Supplier `gorm:"foreignKey:SupID;references:ID" son:"supplier,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
