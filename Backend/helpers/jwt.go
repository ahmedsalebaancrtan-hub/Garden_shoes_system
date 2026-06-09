package helpers

import (
	"time"

	"github.com/gardenshoes/ahmed/infra"
	"github.com/gardenshoes/ahmed/models"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateJwt(role models.Role, userID uint, sub string, ExpireIn int64, isrefreshToken bool) (string, error) {
	config := infra.Configuration

	var jwtsecret []byte

	if isrefreshToken {
		jwtsecret = []byte(config.Refresh_jwt_token)
	} else {
		jwtsecret = []byte(config.Access_jwt_Token)
	}
	claims := jwt.MapClaims{
		"userID":         userID,
		"sub":            sub,
		"npf":            time.Now(),
		"exp":            ExpireIn,
		"isrefreshToken": isrefreshToken,
		"role":           role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtsecret)

}
