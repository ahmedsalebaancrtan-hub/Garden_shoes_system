package services

import (
	"errors"
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
)

type CustomerService struct {
	Repo *repository.CustomerRepo
}

func NewCustomerService(repo *repository.CustomerRepo) *CustomerService {
	return &CustomerService{Repo: repo}
}

func (svc *CustomerService) CreateCustomer(data *dto.CreateCustomerRequest) (int, *dto.CustomerResponse, error) {
	// Hubi in nambarka taleefanka uu hore u jiray iyo in kale
	_, err := svc.Repo.GetCustomerByPhone(data.CusPhone)
	if err == nil {
		return http.StatusConflict, nil, errors.New("macmiil nambarkaan wata ayaa hore u diwaangashan")
	}

	customer := models.Customer{
		CusName:    data.CusName,
		CusAddress: data.CusAddress,
		CusCity:    data.CusCity,
		CusPhone:   data.CusPhone,
		CusAge:     data.CusAge,
	}

	if err := svc.Repo.CreateCustomer(&customer); err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareysatay kaydinta macmiilka")
	}

	response := &dto.CustomerResponse{
		ID:         customer.ID,
		CusName:    customer.CusName,
		CusAddress: customer.CusAddress,
		CusCity:    customer.CusCity,
		CusPhone:   customer.CusPhone,
		CusAge:     customer.CusAge,
	}

	return http.StatusCreated, response, nil
}

func (svc *CustomerService) ListAllCustomers() (int, []dto.CustomerResponse, error) {
	customers, err := svc.Repo.GetAllCustomers()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareysatay soo jiidashada macaamiisha")
	}

	var list []dto.CustomerResponse
	for _, c := range customers {
		list = append(list, dto.CustomerResponse{
			ID:         c.ID,
			CusName:    c.CusName,
			CusAddress: c.CusAddress,
			CusCity:    c.CusCity,
			CusPhone:   c.CusPhone,
			CusAge:     c.CusAge,
		})
	}

	return http.StatusOK, list, nil
}
