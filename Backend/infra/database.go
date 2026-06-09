package infra

import (
	"fmt"

	"github.com/gardenshoes/ahmed/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func DbConnect() {
	config := Configuration
	dsn := fmt.Sprintf("host=%s user=%s password=%s port=%s dbname=%s sslmode=disable", config.DbHost, config.DbUser, config.DbPassword, config.DbPort, config.DbName)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(models.Users{}, models.Supplier{})

	DB = db

}
