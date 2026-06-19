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
	OrderHandler := handlers.RegisterOrderHandler()
	PaymentHandler := handlers.RegisterPaymentHandler()
	UserGroup := ApiGroup.Group("/users")
	{
		UserGroup.POST("/create", UserHandler.CreateUser)
		UserGroup.POST("/login", UserHandler.LoginUser)

	}
	SupplierGroup := ApiGroup.Group("/suppliers")
	{
		SupplierGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SupplierHandler.CreateSupplier)
		SupplierGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SupplierHandler.GetSuppliers)
	}
	ShoeGroup := ApiGroup.Group("/shoes")
	{
		ShoeGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), ShoeHandler.CreateShoe)
		ShoeGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), ShoeHandler.GetShoes)
	}
	CustomerGroup := ApiGroup.Group("/customers")
	{
		CustomerGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), CustomerHandler.CreateCustomer)
		CustomerGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), CustomerHandler.GetCustomers)
	}
	EmployeeGroup := ApiGroup.Group("/employees")
	{
		EmployeeGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), EmployeeHandler.CreateEmployee)
		EmployeeGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), EmployeeHandler.GetEmployees)
	}
	SalesProtected := ApiGroup.Group("/orders")
	{
		SalesProtected.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "CASHIER"), OrderHandler.CreateOrder)
		SalesProtected.GET("/", middleware.Authenticated(), middleware.RoleRequired("STAFF", "ADMIN"), OrderHandler.GetAllOrders)
		SalesProtected.GET("/:id", middleware.Authenticated(), middleware.RoleRequired("STAFF", "ADMIN"), OrderHandler.GetOrderByID)
	}
	PaymentGroup := ApiGroup.Group("/payments")
	{
		PaymentGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("STAFF", "ADMIN"), PaymentHandler.ProcessPayment)
	}
}
