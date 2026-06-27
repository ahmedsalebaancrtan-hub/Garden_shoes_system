package services

import (
	"errors"
	"net/http"
	"time"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
	"gorm.io/gorm"
)

type EmployeeService struct {
	Repo *repository.EmployeeRepo
}

func NewEmployeeService(repo *repository.EmployeeRepo) *EmployeeService {
	return &EmployeeService{Repo: repo}
}

// CREATE EMPLOYEE
func (svc *EmployeeService) CreateEmployee(data *dto.CreateEmployeeRequest) (int, *dto.EmployeeResponse, error) {
	// Hubi in emaylku jiro
	_, err := svc.Repo.GetEmployeeByEmail(data.EmpEmail)
	if err == nil {
		return http.StatusConflict, nil, errors.New("shaqaale iimaylkaan wata ayaa mar hore la diwaangeliyey")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay hubinta iimaylka shaqaalaha")
	}

	_, err = svc.Repo.GetEmployeeByPhoneIncludingDeleted(data.EmpPhone)
	if err == nil {
		return http.StatusBadRequest, nil, errors.New("Lambarka taleefankan horay ayaa loo diwaangeliyey!")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay hubinta lambarka taleefanka")
	}

	// Badal qaabka taariikhda (String to time.Time)
	parsedDate, err := time.Parse("2006-01-02", data.HireDate)
	if err != nil {
		return http.StatusBadRequest, nil, errors.New("qaabka taariikhda hire_date ma saxna, isticmaal (YYYY-MM-DD)")
	}

	employee := models.Employee{
		EmpName:    data.EmpName,
		EmpPhone:   data.EmpPhone,
		EmpEmail:   data.EmpEmail,
		EmpAddress: data.EmpAddress,
		EmpShift:   data.EmpShift,
		HireDate:   parsedDate,
		JobTitle:   data.JobTitle,
		BaseSalary: data.BaseSalary,
	}

	if err := svc.Repo.CreateEmployee(&employee); err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay kaydinta shaqaalaha")
	}

	response := &dto.EmployeeResponse{
		ID:         employee.ID,
		EmpName:    employee.EmpName,
		EmpPhone:   employee.EmpPhone,
		EmpEmail:   employee.EmpEmail,
		EmpAddress: employee.EmpAddress,
		EmpShift:   employee.EmpShift,
		HireDate:   employee.HireDate.Format("2006-01-02"),
		JobTitle:   employee.JobTitle,
		BaseSalary: employee.BaseSalary,
	}

	return http.StatusCreated, response, nil
}

// LIST ALL EMPLOYEES
func (svc *EmployeeService) ListAllEmployees() (int, []dto.EmployeeResponse, error) {
	employees, err := svc.Repo.GetAllEmployees()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay soo jiidashada shaqaalaha")
	}

	var list []dto.EmployeeResponse
	for _, e := range employees {
		list = append(list, dto.EmployeeResponse{
			ID:         e.ID,
			EmpName:    e.EmpName,
			EmpPhone:   e.EmpPhone,
			EmpEmail:   e.EmpEmail,
			EmpAddress: e.EmpAddress,
			EmpShift:   e.EmpShift,
			HireDate:   e.HireDate.Format("2006-01-02"),
			JobTitle:   e.JobTitle,
			BaseSalary: e.BaseSalary,
		})
	}

	return http.StatusOK, list, nil
}

// UPDATE EMPLOYEE (Halkan waxaa loo beddelayed svc.Repo, magacyadii tiirarkana waa la saxay)
func (svc *EmployeeService) UpdateEmployee(id uint, data *dto.CreateEmployeeRequest) (int, error) {
	employee, err := svc.Repo.GetEmployeeByID(id)
	if err != nil {
		return http.StatusNotFound, errors.New("shaqaalahan lagama helin nidaamka")
	}

	// Badal qaabka taariikhda cusub
	parsedDate, err := time.Parse("2006-01-02", data.HireDate)
	if err != nil {
		return http.StatusBadRequest, errors.New("qaabka taariikhda hire_date ma saxna, isticmaal (YYYY-MM-DD)")
	}

	// Waafaji magacyada saxda ah ee moodalkaaga ku jira
	employee.EmpName = data.EmpName
	employee.EmpPhone = data.EmpPhone
	employee.EmpEmail = data.EmpEmail
	employee.EmpAddress = data.EmpAddress
	employee.EmpShift = data.EmpShift
	employee.HireDate = parsedDate
	employee.JobTitle = data.JobTitle
	employee.BaseSalary = data.BaseSalary

	if err := svc.Repo.UpdateEmployee(employee); err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay casriyeynta shaqaalaha")
	}
	return http.StatusOK, nil
}

// DELETE EMPLOYEE (Halkan waxaa loo beddelay svc.Repo)
func (svc *EmployeeService) DeleteEmployee(id uint) (int, error) {
	if err := svc.Repo.DeleteEmployee(id); err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay tirtirista shaqaalaha")
	}
	return http.StatusOK, nil
}
