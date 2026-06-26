package models

import "time"

type Salary struct {
	SalID         uint      `gorm:"primaryKey;autoIncrement" json:"sal_id"`
	EmployeeID    uint      `gorm:"not null" json:"employee_id"`
	Employee      Employee  `gorm:"foreignKey:EmployeeID" json:"employee"`
	BaseSalary    float64   `gorm:"type:numeric(10,2);not null" json:"base_salary"`
	Bonus         float64   `gorm:"type:numeric(10,2);default:0.00" json:"bonus"`
	Deductions    float64   `gorm:"type:numeric(10,2);default:0.00" json:"deductions"`
	NetSalary     float64   `gorm:"type:numeric(10,2);not null" json:"net_salary"`
	SalaryMonth   string    `gorm:"type:varchar(20);not null" json:"salary_month"`
	PaymentDate   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"payment_date"`
	PaymentMethod string    `gorm:"type:varchar(50);not null" json:"payment_method"`
}
