package dto

import "github.com/gardenshoes/ahmed/models"

type RegisterRequest struct {
	FullName        string      `json:"fullname" binding:"required,min=3,max=100"`
	Phone           string      `json:"phone" binding:"required,min=7,max=20"`
	Email           string      `json:"email" binding:"required,email"`
	Password        string      `json:"password" binding:"required,min=6"`
	ConfirmPassword string      `json:"confirm_password" binding:"required,eqfield=Password"`
	Role            models.Role `json:"role" binding:"required,oneof=ADMIN CASHIER STAFF"`
}
type CreateLogindto struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=128"`
}

type LoginUserResponse struct {
	User         models.User `json:"User"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
}
