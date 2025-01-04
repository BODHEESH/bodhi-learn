// D:\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\swagger\organization.swagger.js

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         tenantId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *         verificationStatus:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *         settings:
 *           type: object
 *         licenses:
 *           type: array
 *           items:
 *             type: object
 *         accreditations:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - tenantId
 * 
 *     Branch:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         organizationId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [MAIN, SATELLITE]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         facilities:
 *           type: object
 *         capacity:
 *           type: integer
 *         currentCapacity:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - organizationId
 * 
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         branchId:
 *           type: string
 *           format: uuid
 *         organizationId:
 *           type: string
 *           format: uuid
 *         parentDepartmentId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         headId:
 *           type: string
 *           format: uuid
 *         headName:
 *           type: string
 *         headTitle:
 *           type: string
 *         resources:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - branchId
 *         - organizationId
 * 
 * paths:
 *   /tenants/{tenantId}/organizations:
 *     post:
 *       tags:
 *         - Organizations
 *       summary: Create a new organization
 *       description: Create a new organization under a tenant
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: tenantId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       responses:
 *         201:
 *           description: Organization created successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         409:
 *           description: Organization already exists
 *         500:
 *           description: Internal server error
 * 
 *     get:
 *       tags:
 *         - Organizations
 *       summary: List organizations
 *       description: Get all organizations under a tenant with pagination
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: tenantId
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
 *           description: List of organizations
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         500:
 *           description: Internal server error
 * 
 *   /organizations/{organizationId}:
 *     get:
 *       tags:
 *         - Organizations
 *       summary: Get organization details
 *       description: Get detailed information about an organization
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
 *           name: includeRelations
 *           schema:
 *             type: boolean
 *             default: false
 *       responses:
 *         200:
 *           description: Organization details
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Organization not found
 *         500:
 *           description: Internal server error
 * 
 *     put:
 *       tags:
 *         - Organizations
 *       summary: Update organization
 *       description: Update organization details
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
 *               $ref: '#/components/schemas/Organization'
 *       responses:
 *         200:
 *           description: Organization updated successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Organization not found
 *         500:
 *           description: Internal server error
 * 
 *   /organizations/{organizationId}/verify:
 *     post:
 *       tags:
 *         - Organizations
 *       summary: Verify organization
 *       description: Verify an organization's credentials and licenses
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
 *               type: object
 *               properties:
 *                 licenses:
 *                   type: array
 *                   items:
 *                     type: object
 *                 accreditations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 verifiedBy:
 *                   type: string
 *                   format: uuid
 *       responses:
 *         200:
 *           description: Organization verified successfully
 *         400:
 *           description: Invalid input
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Organization not found
 *         409:
 *           description: Organization already verified
 *         500:
 *           description: Internal server error
 * 
 *   /organizations/{organizationId}/structure:
 *     get:
 *       tags:
 *         - Organizations
 *       summary: Get organization structure
 *       description: Get the complete hierarchical structure of an organization
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: organizationId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Organization structure retrieved successfully
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         404:
 *           description: Organization not found
 *         500:
 *           description: Internal server error
 */

module.exports = {
  // Export any additional swagger configuration if needed
};
