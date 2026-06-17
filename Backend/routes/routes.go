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
	ShoeHandler := handlers.RegisterShoeHandler()
	CustomerHandler := handlers.RegisterCustomerHandler()
	EmployeeHandler := handlers.RegisterEmployeeHandler()
	UserGroup := ApiGroup.Group("/users")
	{
		UserGroup.POST("/create", UserHandler.CreateUser)
		UserGroup.POST("/login", UserHandler.LoginUser)

	}
	SupplierGroup := ApiGroup.Group("/suppliers")
	{
		SupplierGroup.POST("/create", middleware.Authenticated(), middleware.RoleBlocker("ADMIN"), SupplierHandler.CreateSupplier)
		SupplierGroup.GET("/", middleware.Authenticated(), middleware.RoleBlocker("ADMIN"), SupplierHandler.GetSuppliers)
	}
	ShoeGroup := ApiGroup.Group("/shoes")
	{
		ShoeGroup.POST("/create", middleware.Authenticated(), middleware.RoleBlocker("STAFF", "ADMIN"), ShoeHandler.CreateShoe)
		ShoeGroup.GET("/", middleware.Authenticated(), middleware.RoleBlocker("STAFF", "ADMIN"), ShoeHandler.GetShoes)
	}
	CustomerGroup := ApiGroup.Group("/customers")
	{
		CustomerGroup.POST("/create", middleware.Authenticated(), middleware.RoleBlocker("STAFF", "ADMIN"), CustomerHandler.CreateCustomer)
		CustomerGroup.GET("/", middleware.Authenticated(), middleware.RoleBlocker("STAFF", "ADMIN"), CustomerHandler.GetCustomers)
	}
	EmployeeGroup := ApiGroup.Group("/employees")
	{
		EmployeeGroup.POST("/create", middleware.Authenticated(), middleware.RoleBlocker("ADMIN"), EmployeeHandler.CreateEmployee)
		EmployeeGroup.GET("/", middleware.Authenticated(), middleware.RoleBlocker("ADMIN"), EmployeeHandler.GetEmployees)
	}
}
