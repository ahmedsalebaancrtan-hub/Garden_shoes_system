package dto

type CreateOrderRequest struct {
	CusID  uint `json:"cus_id" binding:"required"`
	ShoeID uint `json:"shoe_id" binding:"required"`
	EmpID  uint `json:"emp_id" binding:"required"`
	Qty    int  `json:"qty" binding:"required,gt=0"` // Waa in iibku ka weyn yahay 0
}

type OrderResponse struct {
	OrderID   uint              `json:"o_id"`
	Qty       int               `json:"qty"`
	OrderDate string            `json:"order_date"`
	Customer  *CustomerResponse `json:"customer,omitempty"`
	Shoe      *ShoeResponse     `json:"shoe,omitempty"`
	Employee  *EmployeeResponse `json:"employee,omitempty"`
}
