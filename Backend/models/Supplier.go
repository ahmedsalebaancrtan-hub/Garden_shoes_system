package models

import (
	"time"

	"gorm.io/gorm"
)

type Supplier struct {
	ID         uint   `gorm:"primaryKey;autoIncrement;column:sup_id" json:"sup_id"`
	SupName    string `gorm:"type:varchar(150);not null" json:"sup_name"`
	SupAddress string `gorm:"type:varchar(255);not null" json:"sup_address"`
	Contact    string `gorm:"type:varchar(20);not null" json:"contact"`

	// Has Many Relationship
	Shoes []Shoe `gorm:"foreignKey:SupID" json:"shoes,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
