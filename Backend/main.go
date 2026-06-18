package main

import (
	"fmt"
	"log/slog"

	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/routes"
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
	routes.RegisterRoute(r)

	slog.Info("application is running successfully on port 6000")
	r.Run(fmt.Sprintf(":%s", config.Port))

}
