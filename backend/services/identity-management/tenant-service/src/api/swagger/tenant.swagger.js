// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\swagger\tenant.swagger.js

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         industry:
 *           type: string
 *         size:
 *           type: string
 *           enum: [SMALL, MEDIUM, LARGE, ENTERPRISE]
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - slug
 * 
 *     TenantSettings:
 *       type: object
 *       properties:
 *         settings:
 *           type: object
 *         theme:
 *           type: object
 *         preferences:
 *           type: object
 *         features:
 *           type: object
 *         integrations:
 *           type: object
 * 
 *     TenantBilling:
 *       type: object
 *       properties:
 *         plan:
 *           type: string
 *           enum: [FREE, BASIC, PRO, ENTERPRISE]
 *         billingCycle:
 *           type: string
 *           enum: [MONTHLY, YEARLY]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         nextBillingDate:
 *           type: string
 *           format: date-time
 * 
 *     TenantBackup:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         backupId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED]
 *         size:
 *           type: number
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 * 
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 * 
 * /api/v1/tenants/{tenantId}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 * 
 *   patch:
 *     summary: Update tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 * 
 *   delete:
 *     summary: Delete tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Tenant deleted successfully
 * 
 * /api/v1/tenants/{tenantId}/settings:
 *   get:
 *     summary: Get tenant settings
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantSettings'
 * 
 * /api/v1/tenants/{tenantId}/billing:
 *   get:
 *     summary: Get tenant billing
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant billing details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantBilling'
 * 
 * /api/v1/tenants/{tenantId}/analytics:
 *   get:
 *     summary: Get tenant analytics
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Time period (e.g., 30d, 1w, 6m)
 *     responses:
 *       200:
 *         description: Tenant analytics data
 * 
 * /api/v1/tenants/{tenantId}/backup:
 *   post:
 *     summary: Create tenant backup
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantBackup'
 */
