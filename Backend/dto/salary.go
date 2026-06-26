package dto

type CreateSalaryRequest struct {
	EmployeeID    uint    `json:"employee_id" binding:"required"`
	BaseSalary    float64 `json:"base_salary" binding:"required"`
	Bonus         float64 `json:"bonus"`
	Deductions    float64 `json:"deductions"`
	SalaryMonth   string  `json:"salary_month" binding:"required"`
	PaymentMethod string  `json:"payment_method" binding:"required"`
}
