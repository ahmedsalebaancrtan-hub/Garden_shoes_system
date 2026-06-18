package services

import (
	"errors"
	"net/http"

	dto "github.com/gardenshoes/ahmed/dto"
	"github.com/gardenshoes/ahmed/models"
	"github.com/gardenshoes/ahmed/repository"
	"gorm.io/gorm"
)

type ShoeService struct {
	ShoeRepo     *repository.ShoeRepo
	SupplierRepo *repository.SupplierRepo
}

func NewShoeService(shoeRepo *repository.ShoeRepo, supRepo *repository.SupplierRepo) *ShoeService {
	return &ShoeService{ShoeRepo: shoeRepo, SupplierRepo: supRepo}
}

func (svc *ShoeService) CreateShoe(data *dto.CreateShoeRequest) (int, *dto.ShoeResponse, error) {
	// 1. Verify the supplier exists first
	_, err := svc.SupplierRepo.GetSupplierByID(data.SupID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusBadRequest, nil, errors.New("invalid supplier ID; supplier does not exist")
		}
		return http.StatusInternalServerError, nil, errors.New("failed validating supplier link")
	}

	// 2. Map input properties downstream
	shoe := models.Shoe{
		ShoeName:  data.ShoeName,
		ShoeType:  data.ShoeType,
		ShoeBrand: data.ShoeBrand,
		ShoeDes:   data.ShoeDes,
		Qty:       data.Qty,
		SupID:     data.SupID,
	}

	if err := svc.ShoeRepo.CreateShoe(&shoe); err != nil {
		return http.StatusInternalServerError, nil, err
	}

	// 3. Re-query or fetch structured entity data to construct Response payload
	savedShoe, _ := svc.ShoeRepo.GetShoeByID(shoe.ID)

	response := &dto.ShoeResponse{
		ID:        savedShoe.ID,
		ShoeName:  savedShoe.ShoeName,
		ShoeType:  savedShoe.ShoeType,
		ShoeBrand: savedShoe.ShoeBrand,
		ShoeDes:   savedShoe.ShoeDes,
		Qty:       savedShoe.Qty,
		Supplier: &dto.SupplierResponse{
			ID:         savedShoe.Supplier.ID,
			SupName:    savedShoe.Supplier.SupName,
			SupAddress: savedShoe.Supplier.SupAddress,
			Contact:    savedShoe.Supplier.Contact,
		},
	}

	return http.StatusCreated, response, nil
}

func (svc *ShoeService) ListAllShoes() (int, []dto.ShoeResponse, error) {
	shoes, err := svc.ShoeRepo.GetAllShoes()
	if err != nil {
		return http.StatusInternalServerError, nil, errors.New("failed fetching shoes records")
	}

	var list []dto.ShoeResponse
	for _, s := range shoes {
		list = append(list, dto.ShoeResponse{
			ID:        s.ID,
			ShoeName:  s.ShoeName,
			ShoeType:  s.ShoeType,
			ShoeBrand: s.ShoeBrand,
			ShoeDes:   s.ShoeDes,
			Qty:       s.Qty,
			Supplier: &dto.SupplierResponse{
				ID:         s.Supplier.ID,
				SupName:    s.Supplier.SupName,
				SupAddress: s.Supplier.SupAddress,
				Contact:    s.Supplier.Contact,
			},
		})
	}

	return http.StatusOK, list, nil
}
