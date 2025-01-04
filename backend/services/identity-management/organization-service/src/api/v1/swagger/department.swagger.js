// D:\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\swagger\department.swagger.js

/**
 * @swagger
 * paths:
 *   /branches/{branchId}/departments:
 *     post:
 *       tags:
 *         - Departments
 *       summary: Create a new department
 *       description: Create a new department under a branch
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
 *               $ref: '#/components/schemas/Department'
 *       responses:
 *         201:
 *           description: Department created successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         409:
 *           description: Department already exists
 *         500:
 *           description: Internal server error
 * 
 *     get:
 *       tags:
 *         - Departments
 *       summary: List departments
 *       description: Get all departments under a branch with pagination
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
 *             enum: [ACTIVE, INACTIVE]
 *       responses:
 *         200:
 *           description: List of departments
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         500:
 *           description: Internal server error
 * 
 *   /departments/{departmentId}:
 *     get:
 *       tags:
 *         - Departments
 *       summary: Get department details
 *       description: Get detailed information about a department
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
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
 *           description: Department details
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department not found
 *         500:
 *           description: Internal server error
 * 
 *     put:
 *       tags:
 *         - Departments
 *       summary: Update department
 *       description: Update department details
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       responses:
 *         200:
 *           description: Department updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department not found
 *         500:
 *           description: Internal server error
 * 
 *   /departments/{departmentId}/head:
 *     put:
 *       tags:
 *         - Departments
 *       summary: Update department head
 *       description: Update the head of a department
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
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
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 title:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date
 *               required:
 *                 - userId
 *                 - name
 *                 - title
 *       responses:
 *         200:
 *           description: Department head updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department not found
 *         500:
 *           description: Internal server error
 * 
 *   /departments/{departmentId}/resources:
 *     put:
 *       tags:
 *         - Departments
 *       summary: Update department resources
 *       description: Update the resources of a department
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
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
 *                 resources:
 *                   type: object
 *               required:
 *                 - resources
 *       responses:
 *         200:
 *           description: Department resources updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department not found
 *         500:
 *           description: Internal server error
 * 
 *   /departments/{departmentId}/hierarchy:
 *     get:
 *       tags:
 *         - Departments
 *       summary: Get department hierarchy
 *       description: Get the hierarchical structure of a department
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Department hierarchy retrieved successfully
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department not found
 *         500:
 *           description: Internal server error
 * 
 *   /departments/{departmentId}/move:
 *     post:
 *       tags:
 *         - Departments
 *       summary: Move department
 *       description: Move a department to a different branch
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
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
 *                 targetBranchId:
 *                   type: string
 *                   format: uuid
 *               required:
 *                 - targetBranchId
 *       responses:
 *         200:
 *           description: Department moved successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department or target branch not found
 *         409:
 *           description: Cannot move department to different organization
 *         500:
 *           description: Internal server error
 * 
 *   /departments/{departmentId}/analytics:
 *     get:
 *       tags:
 *         - Departments
 *       summary: Get department analytics
 *       description: Get analytics data for a department
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: departmentId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Department analytics retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   totalEmployees:
 *                     type: integer
 *                   childDepartments:
 *                     type: integer
 *                   resourceUtilization:
 *                     type: object
 *                   performanceMetrics:
 *                     type: object
 *                   budgetAnalysis:
 *                     type: object
 *                   projectMetrics:
 *                     type: object
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Department not found
 *         500:
 *           description: Internal server error
 */

module.exports = {
  // Export any additional swagger configuration if needed
};
