package services

import (
	"errors"
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
)

type SupplierService struct {
	Repo *repository.SupplierRepo
}

func NewSupplierService(repo *repository.SupplierRepo) *SupplierService {
	return &SupplierService{Repo: repo}
}

// CREATE SUPPLIER
func (svc *SupplierService) CreateSupplier(data *dto.CreateSupplierRequest) (int, *dto.SupplierResponse, error) {
	supplier := models.Supplier{
		SupName:    data.SupName,
		SupAddress: data.SupAddress,
		Contact:    data.Contact,
	}

	if err := svc.Repo.CreateSupplier(&supplier); err != nil {
		return http.StatusInternalServerError, nil, errors.New("failed to save supplier information")
	}

	response := &dto.SupplierResponse{
		ID:         supplier.ID,
		SupName:    supplier.SupName,
		SupAddress: supplier.SupAddress,
		Contact:    supplier.Contact,
	}

	return http.StatusCreated, response, nil
}

// LIST ALL SUPPLIERS
func (svc *SupplierService) ListAllSuppliers() (int, []dto.SupplierResponse, error) {
	suppliers, err := svc.Repo.GetAllSuppliers()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("failed to fetch suppliers")
	}

	var responseList []dto.SupplierResponse
	for _, s := range suppliers {
		responseList = append(responseList, dto.SupplierResponse{
			ID:         s.ID,
			SupName:    s.SupName,
			SupAddress: s.SupAddress,
			Contact:    s.Contact,
		})
	}

	return http.StatusOK, responseList, nil
}

// UPDATE SUPPLIER (Halkan waxaa loo beddelay svc.Repo)
func (svc *SupplierService) UpdateSupplier(id uint, data *dto.CreateSupplierRequest) (int, error) {
	supplier, err := svc.Repo.GetSupplierByID(id)
	if err != nil {
		return http.StatusNotFound, errors.New("alaab-keenahan lagama helin nidaamka")
	}

	supplier.SupName = data.SupName
	supplier.SupAddress = data.SupAddress
	supplier.Contact = data.Contact

	if err := svc.Repo.UpdateSupplier(&supplier); err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay casriyeynta alaab-keenaha")
	}
	return http.StatusOK, nil
}

// DELETE SUPPLIER (Halkan waxaa loo beddelay svc.Repo)
func (svc *SupplierService) DeleteSupplier(id uint) (int, error) {
	if err := svc.Repo.DeleteSupplier(id); err != nil {
		return http.StatusInternalServerError, errors.New("waa ku guuldareystay tirtirista alaab-keenaha")
	}
	return http.StatusOK, nil
}
