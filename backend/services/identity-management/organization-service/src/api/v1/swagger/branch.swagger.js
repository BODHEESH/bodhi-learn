// D:\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\swagger\branch.swagger.js

/**
 * @swagger
 * paths:
 *   /organizations/{organizationId}/branches:
 *     post:
 *       tags:
 *         - Branches
 *       summary: Create a new branch
 *       description: Create a new branch under an organization
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: organizationId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       responses:
 *         201:
 *           description: Branch created successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         409:
 *           description: Branch already exists
 *         500:
 *           description: Internal server error
 * 
 *     get:
 *       tags:
 *         - Branches
 *       summary: List branches
 *       description: Get all branches under an organization with pagination
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: organizationId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *             default: 1
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             default: 10
 *         - in: query
 *           name: status
 *           schema:
 *             type: string
 *             enum: [ACTIVE, INACTIVE, SUSPENDED]
 *       responses:
 *         200:
 *           description: List of branches
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         500:
 *           description: Internal server error
 * 
 *   /branches/{branchId}:
 *     get:
 *       tags:
 *         - Branches
 *       summary: Get branch details
 *       description: Get detailed information about a branch
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: branchId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: query
 *           name: includeRelations
 *           schema:
 *             type: boolean
 *             default: false
 *       responses:
 *         200:
 *           description: Branch details
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Branch not found
 *         500:
 *           description: Internal server error
 * 
 *     put:
 *       tags:
 *         - Branches
 *       summary: Update branch
 *       description: Update branch details
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: branchId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       responses:
 *         200:
 *           description: Branch updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Branch not found
 *         500:
 *           description: Internal server error
 * 
 *   /branches/{branchId}/status:
 *     put:
 *       tags:
 *         - Branches
 *       summary: Update branch status
 *       description: Update the status of a branch
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: branchId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               required:
 *                 - status
 *       responses:
 *         200:
 *           description: Branch status updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Branch not found
 *         500:
 *           description: Internal server error
 * 
 *   /branches/{branchId}/facilities:
 *     put:
 *       tags:
 *         - Branches
 *       summary: Update branch facilities
 *       description: Update the facilities of a branch
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: branchId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 facilities:
 *                   type: object
 *               required:
 *                 - facilities
 *       responses:
 *         200:
 *           description: Branch facilities updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Branch not found
 *         500:
 *           description: Internal server error
 * 
 *   /branches/{branchId}/capacity:
 *     put:
 *       tags:
 *         - Branches
 *       summary: Update branch capacity
 *       description: Update the capacity of a branch
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: branchId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 capacity:
 *                   type: integer
 *                   minimum: 1
 *               required:
 *                 - capacity
 *       responses:
 *         200:
 *           description: Branch capacity updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Branch not found
 *         500:
 *           description: Internal server error
 * 
 *   /branches/{branchId}/analytics:
 *     get:
 *       tags:
 *         - Branches
 *       summary: Get branch analytics
 *       description: Get analytics data for a branch
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: branchId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Branch analytics retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   totalDepartments:
 *                     type: integer
 *                   capacityUtilization:
 *                     type: number
 *                     format: float
 *                   facilitiesCount:
 *                     type: integer
 *                   departmentDistribution:
 *                     type: object
 *                   resourceUtilization:
 *                     type: object
 *                   performanceMetrics:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Branch not found
 *         500:
 *           description: Internal server error
 */

module.exports = {
  // Export any additional swagger configuration if needed
};
