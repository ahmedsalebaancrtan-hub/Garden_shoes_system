package repository

import (
	"github.com/gardenshoes/ahmed/models"
	"gorm.io/gorm"
)

type UserRepo struct {
	DB *gorm.DB
}

func RegisterRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{DB: db}
}

func (r *UserRepo) CreateUser(data models.User) error {
	return r.DB.Create(&data).Error
}

func (r *UserRepo) GetUserByEmail(email string) (models.User, error) {
	var user models.User
	err := r.DB.Where("email = ?", email).First(&user).Error
	return user, err
}

func (r *UserRepo) GetAllUsers() ([]models.User, error) {
	var users []models.User
	err := r.DB.Order("created_at DESC").Find(&users).Error
	return users, err
}

func (r *UserRepo) GetUserByID(id uint) (models.User, error) {
	var user models.User
	err := r.DB.First(&user, id).Error
	return user, err
}

func (r *UserRepo) UpdateUser(user *models.User) error {
	return r.DB.Save(user).Error
}

func (r *UserRepo) DeleteUser(id uint) error {
	return r.DB.Delete(&models.User{}, id).Error
}
