package handlers

import (
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/repository"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	OrderSvc *services.OrderService
}

func RegisterOrderHandler() *OrderHandler {
	or := repository.RegisterOrderRepo(infra.DB)
	cr := repository.RegisterCustomerRepo(infra.DB)
	sr := repository.RegisterShoeRepo(infra.DB)
	er := repository.RegisterEmployeeRepo(infra.DB)

	svc := services.NewOrderService(or, cr, sr, er, infra.DB)
	return &OrderHandler{OrderSvc: svc}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var body dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Xogta dalabka ma saxna", "error": err.Error()})
		return
	}

	status, response, err := h.OrderSvc.CreateOrder(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Iibka si guul leh ayaa loo diwaangeliyey", "data": response})
}
