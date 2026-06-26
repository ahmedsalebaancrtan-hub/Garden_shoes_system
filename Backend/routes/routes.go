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
	SalaryHandler := handlers.RegisterSalaryHandler()
	UserGroup := ApiGroup.Group("/users")
	{
		UserGroup.GET("", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.GetUsers)
		UserGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.GetUsers)
		UserGroup.POST("", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.CreateUser)
		UserGroup.POST("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.CreateUser)
		UserGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.CreateUser)
		UserGroup.POST("/login", UserHandler.LoginUser)
		UserGroup.GET("/whoami", middleware.Authenticated(), UserHandler.WhoAmI)
		UserGroup.PUT("/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.UpdateUser)
		UserGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.UpdateUser)
		UserGroup.DELETE("/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.DeleteUser)
		UserGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), UserHandler.DeleteUser)

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
		ShoeGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), ShoeHandler.GetShoes)
		ShoeGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), ShoeHandler.UpdateShoe)
		ShoeGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), ShoeHandler.DeleteShoe)
		ShoeGroup.GET("/low-stock", middleware.Authenticated(), ShoeHandler.LowStockAlert)

	}
	CustomerGroup := ApiGroup.Group("/customers")
	{
		CustomerGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), CustomerHandler.CreateCustomer)
		CustomerGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), CustomerHandler.GetCustomers)
		CustomerGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), CustomerHandler.UpdateCustomer)
		CustomerGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), CustomerHandler.DeleteCustomer)
	}
	EmployeeGroup := ApiGroup.Group("/employees")
	{
		EmployeeGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), EmployeeHandler.CreateEmployee)
		EmployeeGroup.GET("", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), EmployeeHandler.GetEmployees)
		EmployeeGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), EmployeeHandler.GetEmployees)
		EmployeeGroup.PUT("/update/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), EmployeeHandler.UpdateEmployee)
		EmployeeGroup.DELETE("/delete/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), EmployeeHandler.DeleteEmployee)
	}
	SalesProtected := ApiGroup.Group("/orders")
	{
		SalesProtected.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "CASHIER", "STAFF"), OrderHandler.CreateOrder)
		SalesProtected.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), OrderHandler.GetAllOrders)
		SalesProtected.GET("/:id", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), OrderHandler.GetOrderByID)
	}
	PaymentGroup := ApiGroup.Group("/payments")
	{
		PaymentGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), PaymentHandler.GetAllPayments)
		PaymentGroup.POST("/create", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF", "CASHIER"), PaymentHandler.ProcessPayment)
	}
	ReportGroup := ApiGroup.Group("/reports")
	{
		ReportGroup.GET("/dashboard", middleware.Authenticated(), middleware.RoleRequired("ADMIN"), ReportHandler.GetDailyDashboard)
		ReportGroup.GET("/customer-monthly", middleware.Authenticated(), ReportHandler.GetCustomerMonthlyReport)
		ReportGroup.GET("/invoice/:order_id", middleware.Authenticated(), ReportHandler.GetSingleInvoiceReport)
	}
	SalaryGroup := ApiGroup.Group("/salaries")
	{
		SalaryGroup.POST("", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SalaryHandler.CreateSalary)
		SalaryGroup.POST("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SalaryHandler.CreateSalary)
		SalaryGroup.GET("", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SalaryHandler.GetSalaries)
		SalaryGroup.GET("/", middleware.Authenticated(), middleware.RoleRequired("ADMIN", "STAFF"), SalaryHandler.GetSalaries)
	}
}
