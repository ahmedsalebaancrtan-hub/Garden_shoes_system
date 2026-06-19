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

type ShoeHandler struct {
	ShoeSvc *services.ShoeService
}

func RegisterShoeHandler() *ShoeHandler {
	shoeRepo := repository.RegisterShoeRepo(infra.DB)
	supRepo := repository.RegisterSupplierRepo(infra.DB)

	// Injecting both repositories to support relation verification checks
	svc := services.NewShoeService(shoeRepo, supRepo)
	return &ShoeHandler{ShoeSvc: svc}
}

func (h *ShoeHandler) CreateShoe(c *gin.Context) {
	var body dto.CreateShoeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid shoe payload parameters", "error": err.Error()})
		return
	}

	status, response, err := h.ShoeSvc.CreateShoe(&body)
	if err != nil {
		// Halkan ayaan wax ka baddalnay si aan u aragno error-ka dhabta ah ee ka dhashay kaydinta!
		c.JSON(status, gin.H{
			"is_success": false,
			"message":    err.Error(), // Kani waa fariintii Service-ka (e.g., "failed saving shoe inventory item")
		})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Shoe added to store inventory catalog successfully", "data": response})
}

func (h *ShoeHandler) GetShoes(c *gin.Context) {
	status, data, err := h.ShoeSvc.ListAllShoes()
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "data": data})
}
func (h *ShoeHandler) LowStockAlert(c *gin.Context) {
	// Wuxuu si toos ah u wacayaa ShoeSvc oo aan hadda ku darnay koodhka
	results, err := h.ShoeSvc.GetLowStockShoes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"is_success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"message":    "Alaabta dukaanka ku sii dhammaanaysa si guul leh ayaa loo soo saaray",
		"data":       results,
	})
}

func (h *ShoeHandler) UpdateShoe(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var body dto.CreateShoeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"is_success": false, "error": err.Error()})
		return
	}

	status, err := h.ShoeSvc.UpdateShoe(uint(id), &body)
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Xogta kabaha si guul leh ayaa loo casriyeeyey"})
}

func (h *ShoeHandler) DeleteShoe(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	status, err := h.ShoeSvc.DeleteShoe(uint(id))
	if err != nil {
		c.JSON(status, gin.H{"is_success": false, "message": err.Error()})
		return
	}

	c.JSON(status, gin.H{"is_success": true, "message": "Kabaha si guul leh ayaa nidaamka looga tirtiray"})
}
