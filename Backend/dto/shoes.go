package dto

type CreateShoeRequest struct {
	ShoeName  string  `json:"shoe_name" binding:"required,min=2,max=150"`
	ShoeType  string  `json:"shoe_type" binding:"required"`
	ShoeBrand string  `json:"shoe_brand" binding:"required"`
	ShoeDes   string  `json:"shoe_des"`
	Qty       int     `json:"qty" binding:"required,gte=0"`
	Price     float64 `json:"price" binding:"required"`
	SupID     uint    `json:"sup_id" binding:"required"`
}

type ShoeResponse struct {
	ID        uint              `json:"shoe_id"`
	ShoeName  string            `json:"shoe_name"`
	ShoeType  string            `json:"shoe_type"`
	ShoeBrand string            `json:"shoe_brand"`
	ShoeDes   string            `json:"shoe_des"`
	Qty       int               `json:"qty"`
	Supplier  *SupplierResponse `json:"supplier,omitempty"`
}
type LowStockResponse struct {
	ShoeID    uint   `json:"shoe_id"`
	ShoeName  string `json:"shoe_name"`
	ShoeBrand string `json:"shoe_brand"`
	Qty       int    `json:"qty"`
}
