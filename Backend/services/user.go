package services

import (
	"errors"
	"net/http"
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

// CREATE USER
func (svc *UserService) CreateUser(data *dtos.RegisterRequest) (int, error) {
	email := strings.ToLower(data.Email)

	_, err := svc.Repo.GetUserByEmail(email)
	if err == nil {
		return http.StatusConflict, errors.New("user already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(data.Password), bcrypt.DefaultCost)
	if err != nil {
		return http.StatusInternalServerError, errors.New(constants.DefaultErrorMsg)
	}

	err = svc.Repo.CreateUser(models.User{
		FullName: data.FullName,
		Phone:    data.Phone,
		Email:    data.Email,
		Role:     data.Role,
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
