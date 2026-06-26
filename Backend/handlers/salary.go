package handlers

import (
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/repository"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type SalaryHandler struct {
	SalarySvc *services.SalaryService
}

func RegisterSalaryHandler() *SalaryHandler {
	repo := repository.RegisterSalaryRepo(infra.DB)
	svc := services.NewSalaryService(repo)
	return &SalaryHandler{SalarySvc: svc}
}

func (h *SalaryHandler) CreateSalary(c *gin.Context) {
	var body dto.CreateSalaryRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Xogta la soo diray ma saxna", "error": err.Error()})
		return
	}

	status, response, err := h.SalarySvc.CreateSalary(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Mushaarka waa la bixiyey", "data": response})
}

func (h *SalaryHandler) GetSalaries(c *gin.Context) {
	status, data, err := h.SalarySvc.ListAllSalaries()
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "data": data})
}
