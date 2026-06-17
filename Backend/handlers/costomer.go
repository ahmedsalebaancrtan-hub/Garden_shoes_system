package handlers

import (
	"net/http"

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
