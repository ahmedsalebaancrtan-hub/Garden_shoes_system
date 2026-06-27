package dto

type CreateEmployeeRequest struct {
	EmpName    string  `json:"emp_name" binding:"required,min=3,max=150"`
	EmpPhone   string  `json:"emp_phone" binding:"required,min=7,max=20"`
	EmpEmail   string  `json:"emp_email" binding:"required,email"`
	EmpAddress string  `json:"emp_address" binding:"required"`
	EmpShift   string  `json:"emp_shift" binding:"required"`                      // Subax ama Galab
	HireDate   string  `json:"hire_date" binding:"required" example:"2026-06-17"` // Waxay u soo dhacaysaa string ahaan marka hore
	JobTitle   string  `json:"job_title" binding:"required"`
	BaseSalary float64 `json:"base_salary" binding:"gte=0"`
}

type EmployeeResponse struct {
	ID         uint    `json:"emp_id"`
	EmpName    string  `json:"emp_name"`
	EmpPhone   string  `json:"emp_phone"`
	EmpEmail   string  `json:"emp_email"`
	EmpAddress string  `json:"emp_address"`
	EmpShift   string  `json:"emp_shift"`
	HireDate   string  `json:"hire_date"`
	JobTitle   string  `json:"job_title"`
	BaseSalary float64 `json:"base_salary"`
}
