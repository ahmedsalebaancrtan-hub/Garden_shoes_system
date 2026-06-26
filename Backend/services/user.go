package services

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gardenshoes/ahmed/constants"
	dto "github.com/gardenshoes/ahmed/dto"
	dtos "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/helpers"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	Repo *repository.UserRepo
}

func NewUserService(repo *repository.UserRepo) *UserService {
	return &UserService{Repo: repo}
}

func normalizeRole(role models.Role) models.Role {
	switch role {
	case models.RoleAdmin, models.RoleStaff, models.RoleOrganizer:
		return role
	default:
		return models.RoleOrganizer
	}
}

func normalizeStatus(status models.UserStatus) models.UserStatus {
	switch status {
	case models.UserStatusInactive:
		return models.UserStatusInactive
	default:
		return models.UserStatusActive
	}
}

func normalizeName(username string, fullname string) string {
	if strings.TrimSpace(username) != "" {
		return strings.TrimSpace(username)
	}
	return strings.TrimSpace(fullname)
}

func fallbackPhone(phone string) string {
	if strings.TrimSpace(phone) != "" {
		return strings.TrimSpace(phone)
	}
	return "U" + strconv.FormatInt(time.Now().UnixNano(), 36)
}

func userResponse(user models.User) dto.UserResponse {
	status := user.Status
	if status == "" {
		status = models.UserStatusActive
	}

	return dto.UserResponse{
		ID:        user.ID,
		Username:  user.FullName,
		FullName:  user.FullName,
		Phone:     user.Phone,
		Email:     user.Email,
		Role:      user.Role,
		Status:    status,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}
}

// CREATE USER
func (svc *UserService) CreateUser(data *dtos.RegisterRequest) (int, error) {
	email := strings.ToLower(strings.TrimSpace(data.Email))
	name := normalizeName(data.Username, data.FullName)

	if len(name) < 3 {
		return http.StatusBadRequest, errors.New("username/fullname must be at least 3 characters")
	}
	if !strings.Contains(email, "@") {
		return http.StatusBadRequest, errors.New("valid email is required")
	}
	if len(data.Password) < 6 {
		return http.StatusBadRequest, errors.New("password must be at least 6 characters")
	}

	_, err := svc.Repo.GetUserByEmail(email)
	if err == nil {
		return http.StatusConflict, errors.New("user already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(data.Password), bcrypt.DefaultCost)
	if err != nil {
		return http.StatusInternalServerError, errors.New(constants.DefaultErrorMsg)
	}

	err = svc.Repo.CreateUser(models.User{
		FullName: name,
		Phone:    fallbackPhone(data.Phone),
		Email:    email,
		Role:     normalizeRole(data.Role),
		Status:   normalizeStatus(data.Status),
		Password: string(hash),
	})
	if err != nil {
		return http.StatusInternalServerError, errors.New("failed to create user")
	}

	return http.StatusCreated, nil
}

// LOGIN USER
func (svc *UserService) LoginUser(data *dtos.CreateLogindto) (dtos.LoginUserResponse, int, error) {
	email := strings.ToLower(data.Email)

	user, err := svc.Repo.GetUserByEmail(email)
	if err != nil {
		return dtos.LoginUserResponse{}, http.StatusUnauthorized, errors.New("invalid credentials")
	}
	if user.Status == models.UserStatusInactive {
		return dtos.LoginUserResponse{}, http.StatusForbidden, errors.New("user account is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data.Password)); err != nil {
		return dtos.LoginUserResponse{}, http.StatusUnauthorized, errors.New("invalid credentials")
	}
	access, _ := helpers.GenerateJwt(user.Role, user.ID, user.Email, time.Now().Add(30*time.Minute).Unix(), false)
	refresh, _ := helpers.GenerateJwt(user.Role, user.ID, user.Email, time.Now().Add(72*time.Hour).Unix(), true)

	return dtos.LoginUserResponse{
		User:         user,
		AccessToken:  access,
		RefreshToken: refresh,
	}, http.StatusOK, nil
}

func (svc *UserService) GetUsers() ([]dto.UserResponse, int, error) {
	users, err := svc.Repo.GetAllUsers()
	if err != nil {
		return nil, http.StatusInternalServerError, errors.New("failed to fetch users")
	}

	response := make([]dto.UserResponse, 0, len(users))
	for _, user := range users {
		response = append(response, userResponse(user))
	}

	return response, http.StatusOK, nil
}

func (svc *UserService) UpdateUser(id uint, data *dtos.UpdateUserRequest) (dto.UserResponse, int, error) {
	user, err := svc.Repo.GetUserByID(id)
	if err != nil {
		return dto.UserResponse{}, http.StatusNotFound, errors.New("user not found")
	}

	name := normalizeName(data.Username, data.FullName)
	if name != "" {
		user.FullName = name
	}
	if strings.TrimSpace(data.Email) != "" {
		user.Email = strings.ToLower(strings.TrimSpace(data.Email))
	}
	if strings.TrimSpace(data.Phone) != "" {
		user.Phone = strings.TrimSpace(data.Phone)
	}
	if data.Role != "" {
		user.Role = normalizeRole(data.Role)
	}
	if data.Status != "" {
		user.Status = normalizeStatus(data.Status)
	}
	if data.Password != "" {
		if len(data.Password) < 6 {
			return dto.UserResponse{}, http.StatusBadRequest, errors.New("password must be at least 6 characters")
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(data.Password), bcrypt.DefaultCost)
		if err != nil {
			return dto.UserResponse{}, http.StatusInternalServerError, errors.New(constants.DefaultErrorMsg)
		}
		user.Password = string(hash)
	}

	if err := svc.Repo.UpdateUser(&user); err != nil {
		return dto.UserResponse{}, http.StatusInternalServerError, errors.New("failed to update user")
	}

	return userResponse(user), http.StatusOK, nil
}

func (svc *UserService) DeleteUser(id uint) (int, error) {
	if _, err := svc.Repo.GetUserByID(id); err != nil {
		return http.StatusNotFound, errors.New("user not found")
	}
	if err := svc.Repo.DeleteUser(id); err != nil {
		return http.StatusInternalServerError, errors.New("failed to delete user")
	}
	return http.StatusOK, nil
}

// KANI WAA WHOAMI SERVICE-KII OO SAXAN
func (svc *UserService) GetUserInfo(userID uint) (*dto.WhoAmIResponse, error) {
	var user models.User

	// Halkaan waxaa loo beddelay svc.Repo.DB si uu u garto database-ka dhex fariista Repo-ga
	if err := svc.Repo.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("can't find user info")
	}

	// Username waxaa loo beddelay FullName maadaama uu yahay tiirka moodalkaaga ku jira
	return &dto.WhoAmIResponse{
		UserID:   user.ID,
		Username: user.FullName,
		Role:     string(user.Role),
	}, nil
}
