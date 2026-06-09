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
