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

// CREATE CUSTOMER
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
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay kaydinta macmiilka")
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

// LIST ALL CUSTOMERS
func (svc *CustomerService) ListAllCustomers() (int, []dto.CustomerResponse, error) {
	customers, err := svc.Repo.GetAllCustomers()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("waa ku guuldareystay soo jiidashada macaamiisha")
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

// UPDATE CUSTOMER (Halkan waa la saxay magacyada tiirarka)
func (svc *CustomerService) UpdateCustomer(id uint, data *dto.CreateCustomerRequest) (int, error) {
	// Waxaa loo beddelay svc.Repo halkii ay ka ahayd svc.CustomerRepo
	customer, err := svc.Repo.GetCustomerByID(id)
	if err != nil {
		return http.StatusNotFound, errors.New("macmiilkan lagama helin nidaamka")
	}

	// Waxaa loo waafajiyey magacyadii saxda ahaa ee moodalkaaga iyo DTO-gaaga
	customer.CusName = data.CusName
	customer.CusAddress = data.CusAddress
	customer.CusCity = data.CusCity
	customer.CusPhone = data.CusPhone
	customer.CusAge = data.CusAge

	if err := svc.Repo.UpdateCustomer(customer); err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay casriyeynta macmiilka")
	}
	return http.StatusOK, nil
}

// DELETE CUSTOMER
func (svc *CustomerService) DeleteCustomer(id uint) (int, error) {
	// Waxaa loo beddelay svc.Repo
	if err := svc.Repo.DeleteCustomer(id); err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay tirtirista macmiilka")
	}
	return http.StatusOK, nil
}
