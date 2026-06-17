package dto

type CreateCustomerRequest struct {
	CusName    string `json:"cus_name" binding:"required,min=3,max=150"`
	CusAddress string `json:"cus_address" binding:"required,min=5,max=255"`
	CusCity    string `json:"cus_city" binding:"required"`
	CusPhone   string `json:"cus_phone" binding:"required,min=7,max=20"`
	CusAge     int    `json:"cus_age"`
}

type CustomerResponse struct {
	ID         uint   `json:"cus_id"`
	CusName    string `json:"cus_name"`
	CusAddress string `json:"cus_address"`
	CusCity    string `json:"cus_city"`
	CusPhone   string `json:"cus_phone"`
	CusAge     int    `json:"cus_age"`
}
