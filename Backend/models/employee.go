package models

import (
	"time"

	"gorm.io/gorm"
)

type Employee struct {
	ID         uint      `gorm:"primaryKey;autoIncrement;column:emp_id" json:"emp_id"`
	EmpName    string    `gorm:"type:varchar(150);not null" json:"emp_name"`
	EmpPhone   string    `gorm:"type:varchar(20);uniqueIndex;not null" json:"emp_phone"`
	EmpEmail   string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"emp_email"`
	EmpAddress string    `gorm:"type:varchar(255);not null" json:"emp_address"`
	EmpShift   string    `gorm:"type:varchar(50);not null" json:"emp_shift"`
	HireDate   time.Time `gorm:"type:date;not null" json:"hire_date"`
	JobTitle   string    `gorm:"type:varchar(100);not null" json:"job_title"`

	// Has Many Relationship
	Orders []Order `gorm:"foreignKey:EmpID" json:"orders,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
