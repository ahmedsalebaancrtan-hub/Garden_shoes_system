package handlers

import (
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	PaymentSvc *services.PaymentService
}

func RegisterPaymentHandler() *PaymentHandler {
	svc := services.NewPaymentService(infra.DB)
	return &PaymentHandler{PaymentSvc: svc}
}

func (h *PaymentHandler) ProcessPayment(c *gin.Context) {
	var body dto.ProcessPaymentRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"is_success": false, "error": err.Error()})
		return
	}

	status, err := h.PaymentSvc.ProcessDebtPayment(&body)
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Lacag bixinta deynta si guul leh ayaa loo kaydiyey"})
}
