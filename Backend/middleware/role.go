package middleware

import (
	"net/http"

	"github.com/gardenshoes/ahmed/models"
	"github.com/gin-gonic/gin"
)

// RoleBlocker wuxuu xannibayaa qof kasta oo aan lahayn doorka la oggol yahay
func RoleBlocker(allowedRoles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Halkan waxaan ka soo qaadaynaa Role-ka qofka.
		// Caadiyan waxaa laga soo saaraa JWT Token-ka marka qofku Login-dhameystiro.
		// Tijaabo ahaan, waxaan hadda ka soo akhrinaynaa Header-ka la yiraahdo "X-User-Role"
		userRole := c.GetHeader("X-User-Role")

		if userRole == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"is_success": false,
				"message":    "Fadlan marka hore iska soo aqoonso nidaamka (Missing Authentication)",
			})
			c.Abort() // Halkan ku jooji inuu route-ka gudaha u galo
			return
		}

		// Hubi in role-ka qofku wato uu ku jiro kuwa la oggol yahay
		isAllowed := false
		for _, role := range allowedRoles {
			if string(role) == userRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{
				"is_success": false,
				"message":    "Ma haysatid oggolaansho aad ku booqato qaybtaan!",
			})
			c.Abort() // Jooji codsiga
			return
		}

		c.Next() // Haddi uu oggol yahay, u gudbi handler-ka saxda ah
	}
}
