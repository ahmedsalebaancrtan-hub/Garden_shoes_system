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

type CustomerHandler struct {
	CustomerSvc *services.CustomerService
}

func RegisterCustomerHandler() *CustomerHandler {
	repo := repository.RegisterCustomerRepo(infra.DB)
	svc := services.NewCustomerService(repo)
	return &CustomerHandler{CustomerSvc: svc}
}

func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var body dto.CreateCustomerRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Xogta la soo diray ma saxna", "error": err.Error()})
		return
	}

	status, response, err := h.CustomerSvc.CreateCustomer(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Macmiilka waa la diwaangeliyey", "data": response})
}

func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	status, data, err := h.CustomerSvc.ListAllCustomers()
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "data": data})
}

func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var body dto.CreateCustomerRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"is_success": false, "error": err.Error()})
		return
	}

	status, err := h.CustomerSvc.UpdateCustomer(uint(id), &body)
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "Xogta macmiilka si guul leh ayaa loo casriyeeyey"})
}

func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	status, err := h.CustomerSvc.DeleteCustomer(uint(id))
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "Macmiilka si guul leh ayaa nidaamka looga tirtiray"})
}
