package infra

import (
	"fmt"
	"log"

	"github.com/gardenshoes/ahmed/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDb() {
	config := Configuration

	dsn := fmt.Sprintf("host=%s user=%s password=%s port=%s dbname=%s sslmode=disable", config.DBHost, config.DBUser, config.DBPassword, config.DBPort, config.DBName)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		panic("failed to connect database")
	}

	log.Println("INFO Connect database successfully")

	// 1. Demi foreign keys inta dhalistu socoto
	db.Config.DisableForeignKeyConstraintWhenMigrating = true

	// 2. AutoMigrate oo nadiif ah
	err = db.AutoMigrate(
		&models.User{},
		&models.Employee{},
		&models.Supplier{},
		&models.Customer{},
		&models.Shoe{},
		&models.Order{},
		&models.Payment{},
		&models.Salary{},
	)
	if err != nil {
		log.Fatal("Migration failed: ", err)
	}
	DB = db

	// 3. Dib u shid nidaamkii fureyaasha badbaadada
	DB.Config.DisableForeignKeyConstraintWhenMigrating = false
	log.Println("INFO All tables migrated successfully!")
}
