package handlers

import (
	"net/http"
	"strconv"

	dtos "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/repository"
	"github.com/gardenshoes/ahmed/services"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	Usersvc *services.UserService
}

func RegisterUserHandler() *UserHandler {
	userRepo := repository.RegisterRepo(infra.DB)
	usersvc := services.NewUserService(userRepo)
	return &UserHandler{Usersvc: usersvc}
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var body dtos.RegisterRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid body", "error": err.Error()})
		return
	}
	status, err := h.Usersvc.CreateUser(&body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "User Created successfully"})
}

func (h *UserHandler) GetUsers(c *gin.Context) {
	users, status, err := h.Usersvc.GetUsers()
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "data": users})
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user id", "is_success": false})
		return
	}

	var body dtos.UpdateUserRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid body", "error": err.Error(), "is_success": false})
		return
	}

	user, status, err := h.Usersvc.UpdateUser(uint(id), &body)
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "User updated successfully", "data": user})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid user id", "is_success": false})
		return
	}

	status, err := h.Usersvc.DeleteUser(uint(id))
	if err != nil {
		c.JSON(status, gin.H{"message": err.Error(), "is_success": false})
		return
	}
	c.JSON(status, gin.H{"is_success": true, "message": "User deleted successfully"})
}

func (h *UserHandler) LoginUser(c *gin.Context) {
	var req dtos.CreateLogindto
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}
	response, statusCode, err := h.Usersvc.LoginUser(&req)
	if err != nil {
		c.JSON(statusCode, gin.H{"is_success": false, "message": err.Error()})
		return
	}
	c.JSON(statusCode, gin.H{"message": "Login successful", "data": response})
}
func (h *UserHandler) WhoAmI(c *gin.Context) {
	// Hubi labada magacba si aad u badbaaddo
	userID, exists := c.Get("user_id")
	if !exists {
		userID, exists = c.Get("userId")
	}

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"is_success": false, "message": "Fadlan marka hore soo login gareey"})
		return
	}

	// Nidaamka intiisa kale weey saxsan tahay...
	uid := userID.(uint)
	userInfo, err := h.Usersvc.GetUserInfo(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"is_success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_success": true,
		"data":       userInfo,
	})
}
