package handlers

import (
	"net/http"

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
	// Waxay xogta ka soo dhex bixinaysaa Middleware-ka Authenticated() oo aad horey u haysatay
	userID, exists := c.Get("userID") // Hubi magaca aad ku dhex kaydisay middleware-ka (e.g., "userID" ama "user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"is_success": false, "message": "Fadlan marka hore soo login gareey"})
		return
	}

	// Maadaama c.Get uu soo celiyo interface{}, waxaan u beddelaynaa uint
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
