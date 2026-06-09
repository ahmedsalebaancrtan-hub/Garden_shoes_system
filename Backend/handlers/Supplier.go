package handlers

import (
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/repository"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type SupplierHandler struct {
	SupplierSvc *services.SupplierService
}

func RegisterSupplierHandler() *SupplierHandler {
	repo := repository.RegisterSupplierRepo(infra.DB)
	svc := services.NewSupplierService(repo)
	return &SupplierHandler{SupplierSvc: svc}
}

func (h *SupplierHandler) CreateSupplier(c *gin.Context) {
	var body dto.CreateSupplierRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid data format", "error": err.Error()})
		return
	}

	status, response, err := h.SupplierSvc.CreateSupplier(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Supplier added successfully", "data": response})
}

func (h *SupplierHandler) GetSuppliers(c *gin.Context) {
	status, data, err := h.SupplierSvc.ListAllSuppliers()
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "data": data})
}
