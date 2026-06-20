package main

import (
	"fmt"
	"log/slog"

	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	slog.Info("initialised enviroment varibale")
	infra.InitEnv()
	config := infra.Configuration
	slog.Info("Connect database successfully")
	infra.ConnectDb()
	slog.Info("Connect database succesfully")

	r := gin.Default()
	
	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"}
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"}
	corsConfig.AllowMethods = []string{"POST", "OPTIONS", "GET", "PUT", "DELETE"}
	r.Use(cors.New(corsConfig))

	routes.RegisterRoute(r)

	slog.Info("application is running successfully on port 6000")
	r.Run(fmt.Sprintf(":%s", config.Port))

}
