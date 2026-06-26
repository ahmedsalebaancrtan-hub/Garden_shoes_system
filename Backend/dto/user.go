package dto

import "github.com/gardenshoes/ahmed/models"

type RegisterRequest struct {
	Username string            `json:"username"`
	FullName string            `json:"fullname"`
	Phone    string            `json:"phone"`
	Email    string            `json:"email"`
	Password string            `json:"password"`
	Role     models.Role       `json:"role"`
	Status   models.UserStatus `json:"status"`
}
type CreateLogindto struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=128"`
}

type UpdateUserRequest struct {
	Username string            `json:"username"`
	FullName string            `json:"fullname"`
	Email    string            `json:"email"`
	Phone    string            `json:"phone"`
	Role     models.Role       `json:"role"`
	Status   models.UserStatus `json:"status"`
	Password string            `json:"password"`
}

type UserResponse struct {
	ID        uint              `json:"id"`
	Username  string            `json:"username"`
	FullName  string            `json:"fullname"`
	Phone     string            `json:"phone"`
	Email     string            `json:"email"`
	Role      models.Role       `json:"role"`
	Status    models.UserStatus `json:"status"`
	CreatedAt string            `json:"created_at"`
	UpdatedAt string            `json:"updated_at"`
}

type WhoAmIResponse struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

type LoginUserResponse struct {
	User         models.User `json:"User"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
}
