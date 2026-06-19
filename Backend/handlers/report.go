package handlers

import (
	"net/http"
	"strconv"

	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/repository"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	ReportSvc *services.ReportService
}

func RegisterReportHandler() *ReportHandler {
	repo := repository.RegisterReportRepo(infra.DB)
	svc := services.NewReportService(repo)
	return &ReportHandler{ReportSvc: svc}
}

func (h *ReportHandler) GetDailyDashboard(c *gin.Context) {
	report, err := h.ReportSvc.GetDailyReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"is_success": false,
			"message":    "Waa ku guuldareystay xisaabinta warbixinta",
			"error":      err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Warbixinta maanta si guul leh ayaa loo xisaabiyey",
		"data":       report,
	})
}
func (h *ReportHandler) GetCustomerMonthlyReport(c *gin.Context) {
	// Waxaan ka soo akhrisanaynaa URL-ka (Tusaale: ?cus_id=1&year=2026&month=6)
	var query struct {
		CusID uint `form:"cus_id" binding:"required"`
		Year  int  `form:"year" binding:"required"`
		Month int  `form:"month" binding:"required"`
	}

	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"is_success": false, "message": "Fadlan soo dhiib cus_id, year, iyo month sax ah"})
		return
	}

	statement, err := h.ReportSvc.GetCustomerMonthlyReport(query.CusID, query.Year, query.Month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"is_success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Warbixinta bisha ee macmiilka si guul leh ayaa loo soo saaray",
		"data":       statement,
	})
}

func (h *ReportHandler) GetSingleInvoiceReport(c *gin.Context) {
	// Waxaan ka soo xoraynaynaa ID-ga URL-ka (Param)
	orderIDStr := c.Param("order_id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"is_success": false, "message": "ID-ga dalabka waa inuu lambar noqdaa"})
		return
	}

	invoice, err := h.ReportSvc.GetSingleInvoice(uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"is_success": false, "message": "Dalabkaas lagama helin nidaamka"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Rasiidhka iibka si guul leh ayaa loo soo saaray",
		"data":       invoice,
	})
}
