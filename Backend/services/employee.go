package services

import (
	"errors"
	"net/http"
	"time"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
)

type EmployeeService struct {
	Repo *repository.EmployeeRepo
}

func NewEmployeeService(repo *repository.EmployeeRepo) *EmployeeService {
	return &EmployeeService{Repo: repo}
}

func (svc *EmployeeService) CreateEmployee(data *dto.CreateEmployeeRequest) (int, *dto.EmployeeResponse, error) {
	// Hubi in emaylku jiro
	_, err := svc.Repo.GetEmployeeByEmail(data.EmpEmail)
	if err == nil {
		return http.StatusConflict, nil, errors.New("shaqaale iimaylkaan wata ayaa mar hore la diwaangeliyey")
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
	}

	if err := svc.Repo.CreateEmployee(&employee); err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareysatay kaydinta shaqaalaha")
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
	}

	return http.StatusCreated, response, nil
}

func (svc *EmployeeService) ListAllEmployees() (int, []dto.EmployeeResponse, error) {
	employees, err := svc.Repo.GetAllEmployees()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareysatay soo jiidashada shaqaalaha")
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
		})
	}

	return http.StatusOK, list, nil
}
