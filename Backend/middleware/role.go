package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RoleRequired wuxuu u oggolaadaa kaliya user-ada leh roles-ka la rabo
func RoleRequired(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ka soo saar role-ka user-ka ee uu middleware-ka Authenticated() dhex dhigay Context-ka
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"is_success": false,
				"message":    "Ma haysatid oggolaansho aad ku booqato qaybtaan!",
			})
			c.Abort()
			return
		}

		// 2. Hubi in role-ka user-ka uu ku jiro liiska la oggolaaday (Allowed Roles)
		isAllowed := false
		for _, role := range allowedRoles {
			if role == userRole.(string) {
				isAllowed = true
				break
			}
		}

		// 3. Haddii nambarka role-kiisa la waayo, albaabka ka xir
		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{
				"is_success": false,
				"message":    "Ma haysatid oggolaansho aad ku booqato qaybtaan!",
			})
			c.Abort()
			return
		}

		// Haddii uu leeyahay role-ka saxda ah, u oggolaaw inuu gudbo
		c.Next()
	}
}
