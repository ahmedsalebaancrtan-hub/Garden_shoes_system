package models

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin     Role = "ADMIN"
	RoleOrganizer Role = "CASHIER"
	RoleStaff     Role = "STAFF"
)

type UserStatus string

const (
	UserStatusActive   UserStatus = "ACTIVE"
	UserStatusInactive UserStatus = "INACTIVE"
)

type User struct {
	ID        uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	FullName  string         `gorm:"type:varchar(100);not null" json:"fullname"`
	Phone     string         `gorm:"type:varchar(20);uniqueIndex;not null" json:"phone"`
	Email     string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Role      Role           `json:"role"`
	Status    UserStatus     `gorm:"type:varchar(20);not null;default:ACTIVE" json:"status"`
	Password  string         `gorm:"type:varchar(255);not null" json:"-"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
