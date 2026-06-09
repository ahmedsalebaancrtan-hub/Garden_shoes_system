package dto

type CreateSupplierRequest struct {
	SupName    string `json:"sup_name" binding:"required,min=3,max=150"`
	SupAddress string `json:"sup_address" binding:"required,min=5,max=255"`
	Contact    string `json:"contact" binding:"required,min=5,max=50"`
}

type SupplierResponse struct {
	ID         uint   `json:"sup_id"`
	SupName    string `json:"sup_name"`
	SupAddress string `json:"sup_address"`
	Contact    string `json:"contact"`
}
