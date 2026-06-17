package models

import (
	"time"

	"gorm.io/gorm"
)

type Shoe struct {
	ID        uint           `gorm:"primaryKey;autoIncrement;column:shoe_id" json:"shoe_id"`
	ShoeName  string         `gorm:"type:varchar(150);not null" json:"shoe_name"`
	ShoeType  string         `gorm:"type:varchar(100);not null" json:"shoe_type"` // e.g., Boots, Sneakers
	ShoeBrand string         `gorm:"type:varchar(100);not null" json:"shoe_brand"`
	ShoeDes   string         `gorm:"type:text" json:"shoe_des"`
	Qty       int            `gorm:"type:int;not null;default:0" json:"qty"`
	SupID     uint           `gorm:"not null;column:sup_id" json:"sup_id"` // Foreign Key column
	Supplier  Supplier       `gorm:"foreignKey:SupID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"supplier,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
