package routes

import (
	"github.com/gardenshoes/ahmed/handlers"
	"github.com/gardenshoes/ahmed/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterRoute(r *gin.Engine) {
	ApiGroup := r.Group("/api")

	UserHandler := handlers.RegisterUserHandler()
	SupplierHandler := handlers.RegisterSupplierHandler()
	UserGroup := ApiGroup.Group("/users")
	{
		UserGroup.POST("/create", UserHandler.CreateUser)
		UserGroup.POST("/login", UserHandler.LoginUser)

	}
	SupplierGroup := ApiGroup.Group("/suppliers")
	{
		SupplierGroup.POST("/create", middleware.Authenticated(), SupplierHandler.CreateSupplier)
		SupplierGroup.GET("/", middleware.Authenticated(), SupplierHandler.GetSuppliers)
	}
}
