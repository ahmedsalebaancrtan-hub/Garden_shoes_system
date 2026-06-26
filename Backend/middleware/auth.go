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
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Missing Authorization header",
				"is_success": false,
			})
			return
		}

		// 2. Check Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			ApplyCORSHeaders(c)
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
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Unauthenticated",
				"is_success": false,
			})
			return
		}

		// 6. Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Invalid token claims",
				"is_success": false,
			})
			return
		}

		email := claims["sub"]
		role := claims["role"]
		var rawID interface{}
		var idExists bool

		// Check for both camelCase "userID" (from helper) and snake_case "user_id"
		if rawID, idExists = claims["userID"]; !idExists {
			rawID, idExists = claims["user_id"]
		}

		if !idExists || rawID == nil {
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "invalid user id: claim missing from token",
				"is_success": false,
			})
			return
		}

		// Dynamically handle type conversions safely depending on how JWT unmarshals it
		var userID uint
		switch v := rawID.(type) {
		case float64:
			userID = uint(v)
		case int:
			userID = uint(v)
		case int64:
			userID = uint(v)
		case uint:
			userID = v
		default:
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "invalid user id: unexpected data format type",
				"is_success": false,
			})
			return
		}

		// 🌟 CRITICAL ALIGNMENT: Save to BOTH keys to avoid any handler mismatch bugs!
		c.Set("user_id", userID) // snake_case
		c.Set("userId", userID)
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
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Missing Authorization header",
				"is_success": false,
			})
			return
		}

		// 2. Check Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			ApplyCORSHeaders(c)
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
			ApplyCORSHeaders(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"message":    "Unauthorized access",
				"is_success": false,
			})
			return
		}

		// 6. (IMPORTANT) Check expiration manually
		if claims.ExpiresAt < time.Now().Unix() {
			ApplyCORSHeaders(c)
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
