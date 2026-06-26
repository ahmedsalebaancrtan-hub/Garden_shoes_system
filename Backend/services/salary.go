package services

import (
	"errors"
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
)

type SalaryService struct {
	Repo *repository.SalaryRepo
}

func NewSalaryService(repo *repository.SalaryRepo) *SalaryService {
	return &SalaryService{Repo: repo}
}

func (svc *SalaryService) CreateSalary(data *dto.CreateSalaryRequest) (int, *models.Salary, error) {
	netSalary := data.BaseSalary + data.Bonus - data.Deductions

	salary := models.Salary{
		EmployeeID:    data.EmployeeID,
		BaseSalary:    data.BaseSalary,
		Bonus:         data.Bonus,
		Deductions:    data.Deductions,
		NetSalary:     netSalary,
		SalaryMonth:   data.SalaryMonth,
		PaymentMethod: data.PaymentMethod,
	}

	if err := svc.Repo.CreateSalary(&salary); err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay kaydinta mushaarka")
	}

	return http.StatusCreated, &salary, nil
}

func (svc *SalaryService) ListAllSalaries() (int, []models.Salary, error) {
	salaries, err := svc.Repo.GetAllSalaries()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay soo jiidashada mushaaraadka")
	}

	return http.StatusOK, salaries, nil
}
