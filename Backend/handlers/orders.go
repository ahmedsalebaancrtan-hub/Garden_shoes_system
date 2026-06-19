package handlers

import (
	"net/http"
	"strconv"

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

// 1. ABUURISTA DALABKA (CREATE ORDER)
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var body dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"is_success": false,
			"message":    "Xogta dalabka ma saxna",
			"error":      err.Error(),
		})
		return
	}

	status, response, err := h.OrderSvc.CreateOrder(&body)
	if err != nil {
		c.JSON(status, gin.H{
			"is_success": false,
			"message":    err.Error(),
		})
		return
	}

	c.JSON(status, gin.H{
		"is_success": true,
		"message":    "Iibka si guul leh ayaa loo diwaangeliyey",
		"data":       response,
	})
}

// 2. SOO BANDHIGISTA DHAMMAAN DALABAADKA (GET ALL ORDERS)
func (h *OrderHandler) GetAllOrders(c *gin.Context) {
	// Waxaad toos uga soo dhalin kartaa repo ama waxaad u sameyn kartaa service saaxiibkiis ah
	orders, err := h.OrderSvc.OrderRepo.GetAllOrders()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"is_success": false,
			"message":    "Waa ku guuldareystay soo jiidista dalabaadka",
			"error":      err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Dhammaan dalabaadka si guul leh ayaa loo soo helay",
		"data":       orders,
	})
}

// 3. SOO JIIDISTA HAL DALAB (GET ORDER BY ID)
func (h *OrderHandler) GetOrderByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"is_success": false,
			"message":    "ID-ga nidaamka ma saxna",
		})
		return
	}

	order, err := h.OrderSvc.OrderRepo.GetOrderByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"is_success": false,
			"message":    "Dalabkaas laguma helin nidaamka",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Dalabka waa la soo helay",
		"data":       order,
	})
}
