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
	PaymentSvc  *services.PaymentService
	PaymentRepo *repository.PaymentRepo
}

func RegisterPaymentHandler() *PaymentHandler {
	svc := services.NewPaymentService(infra.DB)
	repo := repository.RegisterPaymentRepo(infra.DB)
	return &PaymentHandler{PaymentSvc: svc, PaymentRepo: repo}
}

func (h *PaymentHandler) GetAllPayments(c *gin.Context) {
	payments, err := h.PaymentRepo.GetAllPayments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"is_success": false,
			"message":    "Waa ku guuldareystay soo jiidista lacag-bixinta",
			"error":      err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Dhammaan lacag-bixinta si guul leh ayaa loo soo helay",
		"data":       payments,
	})
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

