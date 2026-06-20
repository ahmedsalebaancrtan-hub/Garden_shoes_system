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
	ReportHandler := handlers.RegisterReportHandler()
	UserGroup := ApiGroup.Group("/users")
	{
		UserGroup.POST("/create", UserHandler.CreateUser)
		UserGroup.POST("/login", UserHandler.LoginUser)
		UserGroup.GET("/whoami", middleware.Authenticated(), UserHandler.WhoAmI)

	}
	SupplierGroup := ApiGroup.Group("/suppliers")
	{
		SupplierGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SupplierHandler.CreateSupplier)
		SupplierGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SupplierHandler.GetSuppliers)
		SupplierGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SupplierHandler.UpdateSupplier)
		SupplierGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), SupplierHandler.DeleteSupplier)
	}
	ShoeGroup := ApiGroup.Group("/shoes")
	{
		ShoeGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), ShoeHandler.CreateShoe)
		ShoeGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), ShoeHandler.GetShoes)
		ShoeGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), ShoeHandler.UpdateShoe)
		ShoeGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), ShoeHandler.DeleteShoe)
		ShoeGroup.GET("/low-stock", middleware.Authenticated(), ShoeHandler.LowStockAlert)

	}
	CustomerGroup := ApiGroup.Group("/customers")
	{
		CustomerGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), CustomerHandler.CreateCustomer)
		CustomerGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), CustomerHandler.GetCustomers)
		CustomerGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), CustomerHandler.UpdateCustomer)
		CustomerGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), CustomerHandler.DeleteCustomer)
	}
	EmployeeGroup := ApiGroup.Group("/employees")
	{
		EmployeeGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), EmployeeHandler.CreateEmployee)
		EmployeeGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), EmployeeHandler.GetEmployees)
		EmployeeGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), EmployeeHandler.UpdateEmployee)
		EmployeeGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), EmployeeHandler.DeleteEmployee)
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
	ReportGroup := ApiGroup.Group("/reports")
	{
		ReportGroup.GET("/dashboard", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), ReportHandler.GetDailyDashboard)
		ReportGroup.GET("/customer-monthly", middleware.Authenticated(), ReportHandler.GetCustomerMonthlyReport)
		ReportGroup.GET("/invoice/:order_id", middleware.Authenticated(), ReportHandler.GetSingleInvoiceReport)
	}
}
