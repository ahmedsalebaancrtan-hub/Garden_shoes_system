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

type EmployeeHandler struct {
	EmployeeSvc *services.EmployeeService
}

func RegisterEmployeeHandler() *EmployeeHandler {
	repo := repository.RegisterEmployeeRepo(infra.DB)
	svc := services.NewEmployeeService(repo)
	return &EmployeeHandler{EmployeeSvc: svc}
}

func (h *EmployeeHandler) CreateEmployee(c *gin.Context) {
	var body dto.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Xogta la soo diray ma saxna", "error": err.Error()})
		return
	}

	status, response, err := h.EmployeeSvc.CreateEmployee(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Shaqaalaha waa la diwaangeliyey", "data": response})
}

func (h *EmployeeHandler) GetEmployees(c *gin.Context) {
	status, data, err := h.EmployeeSvc.ListAllEmployees()
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "data": data})
}

func (h *EmployeeHandler) UpdateEmployee(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var body dto.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"is_success": false, "error": err.Error()})
		return
	}

	status, err := h.EmployeeSvc.UpdateEmployee(uint(id), &body)
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "Xogta shaqaalaha si guul leh ayaa loo casriyeeyey"})
}

func (h *EmployeeHandler) DeleteEmployee(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	status, err := h.EmployeeSvc.DeleteEmployee(uint(id))
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "Shaqaalaha si guul leh ayaa nidaamka looga tirtiray"})
}
