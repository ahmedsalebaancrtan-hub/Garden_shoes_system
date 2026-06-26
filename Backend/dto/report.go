package dto

type DashboardSummaryResponse struct {
	TotalSales     float64            `json:"total_sales"`
	TotalOrders    int64              `json:"total_orders"`
	TotalItemsSold int64              `json:"total_items_sold"`
	SalesByMethod  map[string]float64 `json:"sales_by_method"`
}
type OrderReceiptResponse struct {
	OrderID       uint    `json:"order_id"`
	CustomerName  string  `json:"customer_name"`
	ShoeName      string  `json:"shoe_name"`
	Qty           int     `json:"qty"`
	TotalPrice    float64 `json:"total_price"`
	AmountPaid    float64 `json:"amount_paid"`
	RemainingDebt float64 `json:"remaining_debt"`
	Status        string  `json:"status"` // PAID, DEBT, PARTIAL
	Date          string  `json:"date"`
}

// Warbixinta bisha ee macmiil gaar ah
type CustomerMonthlyStatement struct {
	CustomerName string                 `json:"customer_name"`
	Month        string                 `json:"month"`
	TotalBought  float64                `json:"total_bought"` // Wadarta wixii uu gatay bishaas
	TotalPaid    float64                `json:"total_paid"`   // Wadarta wixii uu bixiyey bishaas
	CurrentDebt  float64                `json:"current_debt"` // Deynta guud ee ku hartay bishaas
	History      []OrderReceiptResponse `json:"history"`      // Dhammaan iibkii dhexmaray bishaas
}

type SingleInvoiceResponse struct {
	OrderID         uint    `json:"order_id"`
	CustomerName    string  `json:"customer_name"`
	CustomerPhone   string  `json:"customer_phone"`
	ShoeName        string  `json:"shoe_name"`
	ShoeBrand       string  `json:"shoe_brand"`
	Qty             int     `json:"qty"`
	UnitPrice       float64 `json:"unit_price"`
	Discount        float64 `json:"discount"`         // Dhimista (discount)
	TotalPrice      float64 `json:"total_price"`
	TotalAmountPaid float64 `json:"total_amount_paid"`
	RemainingDebt   float64 `json:"remaining_debt"`
	Status          string  `json:"status"` // PAID, DEBT, PARTIAL
	CashierName     string  `json:"cashier_name"`
	InvoiceDate     string  `json:"invoice_date"`
}
