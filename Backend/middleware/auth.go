package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gardenshoes/ahmed/infra"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

type Claims struct {
	Sub    string `json:"sub"`
	Role   string `json:"role"`
	UserID uint
	jwt.StandardClaims
}

// Middleware-ka Access Token
func Authenticated() gin.HandlerFunc {
	return func(c *gin.Context) {

		authHeader := c.GetHeader("Authorization")

		// 1. Check header exists
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Missing Authorization header",
				"is_success": false,
			})
			return
		}

		// 2. Check Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Invalid Authentication header format",
				"is_success": false,
			})
			return
		}

		// 3. Extract token
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		secret := []byte(infra.Configuration.Access_jwt_Token)

		// 4. Parse token
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return secret, nil
		})

		// 5. Validate token
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Unauthenticated",
				"is_success": false,
			})
			return
		}

		// 6. Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Invalid token claims",
				"is_success": false,
			})
			return
		}

		email := claims["sub"]
		role := claims["role"]

		userIDFloat, ok := claims["userID"].(float64)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "invalid user id",
				"is_success": false,
			})
			return
		}

		userID := uint(userIDFloat)

		c.Set("user_id", userID)
		c.Set("email", email)
		c.Set("role", role)

		// 8. Log user
		slog.Info("Logged in User", "email", email)

		// 9. Continue
		c.Next()
	}
}
func RefreshAuthenticated() gin.HandlerFunc {
	return func(c *gin.Context) {

		authHeader := c.GetHeader("Authorization")

		// 1. Check header
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Missing Authorization header",
				"is_success": false,
			})
			return
		}

		// 2. Check Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Invalid Authorization header format",
				"is_success": false,
			})
			return
		}

		// 3. Extract token
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims := &Claims{}

		// 4. Parse token
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {

			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}

			return []byte(infra.Configuration.Refresh_jwt_token), nil
		})

		// 5. Validate token
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Unauthorized access",
				"is_success": false,
			})
			return
		}

		// 6. (IMPORTANT) Check expiration manually
		if claims.ExpiresAt < time.Now().Unix() {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Refresh token expired",
				"is_success": false,
			})
			return
		}

		// 7. Set context
		c.Set("user_email", claims.Sub)

		c.Next()
	}
}
