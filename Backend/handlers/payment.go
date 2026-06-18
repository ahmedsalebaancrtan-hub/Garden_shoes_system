package handlers

import (
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/repository"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	PaymentSvc *services.PaymentService
}

func RegisterPaymentHandler() *PaymentHandler {
	pr := repository.RegisterPaymentRepo(infra.DB)
	cr := repository.RegisterCustomerRepo(infra.DB)
	sr := repository.RegisterShoeRepo(infra.DB)

	svc := services.NewPaymentService(pr, cr, sr)
	return &PaymentHandler{PaymentSvc: svc}
}

func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var body dto.CreatePaymentRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Xogta lacag bixinta ma saxna", "error": err.Error()})
		return
	}

	status, response, err := h.PaymentSvc.ProcessPayment(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Lacagta si guul leh ayaa loo xareeyey", "data": response})
}
