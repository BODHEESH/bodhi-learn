// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\swagger\academic-program.swagger.js

/**
 * @swagger
 * components:
 *   schemas:
 *     AcademicProgram:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - level
 *         - duration
 *         - totalCredits
 *         - admissionRequirements
 *         - learningOutcomes
 *         - organizationId
 *         - departmentId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the program
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Name of the academic program
 *         code:
 *           type: string
 *           pattern: ^[A-Z0-9-]{3,20}$
 *           description: Unique code for the program
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Detailed description of the program
 *         level:
 *           type: string
 *           enum: [undergraduate, postgraduate, doctorate, diploma, certificate]
 *           description: Academic level of the program
 *         duration:
 *           type: number
 *           minimum: 1
 *           maximum: 120
 *           description: Duration of the program in months
 *         totalCredits:
 *           type: number
 *           minimum: 0
 *           description: Total credits required for program completion
 *         status:
 *           type: string
 *           enum: [active, inactive, draft, archived]
 *           default: draft
 *           description: Current status of the program
 *         accreditation:
 *           type: object
 *           properties:
 *             body:
 *               type: string
 *               description: Accrediting body name
 *             accreditationId:
 *               type: string
 *               description: Accreditation identifier
 *             validFrom:
 *               type: string
 *               format: date
 *               description: Start date of accreditation
 *             validTo:
 *               type: string
 *               format: date
 *               description: End date of accreditation
 *             status:
 *               type: string
 *               enum: [pending, approved, expired]
 *               description: Status of accreditation
 *         admissionRequirements:
 *           type: object
 *           required:
 *             - minimumQualification
 *             - minimumGrade
 *           properties:
 *             minimumQualification:
 *               type: string
 *               description: Minimum qualification required
 *             minimumGrade:
 *               type: string
 *               description: Minimum grade required
 *             entranceExam:
 *               type: boolean
 *               default: false
 *               description: Whether entrance exam is required
 *             additionalRequirements:
 *               type: array
 *               items:
 *                 type: string
 *               description: List of additional requirements
 *         learningOutcomes:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - category
 *               - description
 *             properties:
 *               category:
 *                 type: string
 *                 description: Category of learning outcome
 *               description:
 *                 type: string
 *                 description: Description of learning outcome
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the department
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 * 
 *     ProgramSearchParams:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           maxLength: 100
 *           description: Search query string
 *         level:
 *           type: array
 *           items:
 *             type: string
 *             enum: [undergraduate, postgraduate, doctorate, diploma, certificate]
 *           description: Filter by program levels
 *         status:
 *           type: array
 *           items:
 *             type: string
 *             enum: [active, inactive, draft, archived]
 *           description: Filter by program status
 *         duration:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               minimum: 1
 *             max:
 *               type: number
 *               maximum: 120
 *           description: Filter by program duration range
 *         credits:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               minimum: 0
 *             max:
 *               type: number
 *           description: Filter by total credits range
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: Filter by organization
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: Filter by department
 *         createdAt:
 *           type: object
 *           properties:
 *             from:
 *               type: string
 *               format: date
 *             to:
 *               type: string
 *               format: date
 *           description: Filter by creation date range
 *         sortBy:
 *           type: string
 *           enum: [name, code, level, createdAt]
 *           default: createdAt
 *           description: Field to sort by
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *           description: Sort order
 *         page:
 *           type: number
 *           minimum: 1
 *           default: 1
 *           description: Page number
 *         limit:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           description: Items per page
 * 
 * paths:
 *   /api/v1/academic-programs:
 *     get:
 *       tags: [Academic Programs]
 *       summary: List all academic programs
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: Page number
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: Items per page
 *       responses:
 *         200:
 *           description: List of academic programs
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   programs:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicProgram'
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       total:
 *                         type: integer
 *                       page:
 *                         type: integer
 *                       limit:
 *                         type: integer
 *                       totalPages:
 *                         type: integer
 * 
 *     post:
 *       tags: [Academic Programs]
 *       summary: Create a new academic program
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicProgram'
 *       responses:
 *         201:
 *           description: Academic program created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AcademicProgram'
 * 
 *   /api/v1/academic-programs/{programId}:
 *     get:
 *       tags: [Academic Programs]
 *       summary: Get academic program by ID
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Academic program details
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AcademicProgram'
 * 
 *     put:
 *       tags: [Academic Programs]
 *       summary: Update academic program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicProgram'
 *       responses:
 *         200:
 *           description: Academic program updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AcademicProgram'
 * 
 *     delete:
 *       tags: [Academic Programs]
 *       summary: Delete academic program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         204:
 *           description: Academic program deleted successfully
 * 
 *   /api/v1/academic-programs/search:
 *     post:
 *       tags:
 *         - Academic Programs
 *       summary: Search academic programs
 *       description: Search and filter academic programs with advanced criteria
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProgramSearchParams'
 *       responses:
 *         200:
 *           description: Successfully retrieved programs
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicProgram'
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       total:
 *                         type: number
 *                       page:
 *                         type: number
 *                       limit:
 *                         type: number
 *                       pages:
 *                         type: number
 *         400:
 *           description: Invalid request parameters
 *         401:
 *           description: Unauthorized
 *         403:
 *           description: Forbidden
 *         500:
 *           description: Internal server error
 * 
 *   /api/v1/academic-programs/batch:
 *     post:
 *       tags: [Academic Programs]
 *       summary: Create multiple academic programs
 *       description: Create multiple academic programs in a single request
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - programs
 *               properties:
 *                 programs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AcademicProgram'
 *                   minItems: 1
 *                   maxItems: 100
 *       responses:
 *         201:
 *           description: Academic programs created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicProgram'
 *                   failed:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         index:
 *                           type: number
 *                         error:
 *                           type: string
 *
 *   /api/v1/academic-programs/batch-update:
 *     put:
 *       tags: [Academic Programs]
 *       summary: Update multiple academic programs
 *       description: Update multiple academic programs in a single request
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - updates
 *               properties:
 *                 updates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - id
 *                       - data
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       data:
 *                         $ref: '#/components/schemas/AcademicProgram'
 *       responses:
 *         200:
 *           description: Academic programs updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   updated:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicProgram'
 *                   failed:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         error:
 *                           type: string
 *
 *   /api/v1/academic-programs/batch-delete:
 *     post:
 *       tags: [Academic Programs]
 *       summary: Delete multiple academic programs
 *       description: Delete multiple academic programs in a single request
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - programIds
 *               properties:
 *                 programIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   minItems: 1
 *                   maxItems: 100
 *       responses:
 *         200:
 *           description: Academic programs deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   deleted:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: uuid
 *                   failed:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         error:
 *                           type: string
 *
 *   /api/v1/academic-programs/{programId}/learning-references:
 *     get:
 *       tags: [Academic Programs]
 *       summary: Get program learning references
 *       description: Retrieve all learning references associated with a program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Learning references retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     courseId:
 *                       type: string
 *                       format: uuid
 *                     curriculumId:
 *                       type: string
 *                       format: uuid
 *                     type:
 *                       type: string
 *                       enum: [course, curriculum, assessment]
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                     metadata:
 *                       type: object
 *
 *     post:
 *       tags: [Academic Programs]
 *       summary: Add learning reference to program
 *       description: Associate a learning reference with an academic program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
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
 *               required:
 *                 - courseId
 *                 - curriculumId
 *                 - type
 *               properties:
 *                 courseId:
 *                   type: string
 *                   format: uuid
 *                 curriculumId:
 *                   type: string
 *                   format: uuid
 *                 type:
 *                   type: string
 *                   enum: [course, curriculum, assessment]
 *                 status:
 *                   type: string
 *                   enum: [active, inactive]
 *                   default: active
 *                 metadata:
 *                   type: object
 *       responses:
 *         201:
 *           description: Learning reference added successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AcademicProgram'
 *
 *   /api/v1/academic-programs/{programId}/learning-references/{referenceId}:
 *     delete:
 *       tags: [Academic Programs]
 *       summary: Delete learning reference
 *       description: Remove a learning reference from an academic program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: path
 *           name: referenceId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         204:
 *           description: Learning reference deleted successfully
 *
 *   /api/v1/academic-programs/export:
 *     post:
 *       tags: [Academic Programs]
 *       summary: Export academic programs
 *       description: Export academic programs in various formats (JSON, CSV, Excel)
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - format
 *               properties:
 *                 format:
 *                   type: string
 *                   enum: [json, csv, excel]
 *                   description: Export format
 *                 programIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: Specific program IDs to export. If not provided, all programs will be exported based on filters
 *                 includeReferences:
 *                   type: boolean
 *                   default: true
 *                   description: Include learning references in export
 *                 filters:
 *                   $ref: '#/components/schemas/ProgramSearchParams'
 *       responses:
 *         200:
 *           description: Programs exported successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: string
 *                 format: binary
 *             application/vnd.ms-excel:
 *               schema:
 *                 type: string
 *                 format: binary
 *             text/csv:
 *               schema:
 *                 type: string
 *                 format: binary
 *
 *   /api/v1/academic-programs/import:
 *     post:
 *       tags: [Academic Programs]
 *       summary: Import academic programs
 *       description: Import academic programs from various formats (JSON, CSV, Excel)
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               required:
 *                 - file
 *                 - format
 *                 - organizationId
 *               properties:
 *                 file:
 *                   type: string
 *                   format: binary
 *                   description: File to import
 *                 format:
 *                   type: string
 *                   enum: [json, csv, excel]
 *                   description: Import format
 *                 updateExisting:
 *                   type: boolean
 *                   default: false
 *                   description: Update existing programs if they exist
 *                 organizationId:
 *                   type: string
 *                   format: uuid
 *                   description: Organization to import programs into
 *       responses:
 *         200:
 *           description: Programs imported successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   imported:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicProgram'
 *                   updated:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicProgram'
 *                   failed:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         row:
 *                           type: number
 *                         error:
 *                           type: string
 *
 *   /api/v1/academic-programs/{programId}/clone:
 *     post:
 *       tags: [Academic Programs]
 *       summary: Clone academic program
 *       description: Create a copy of an existing academic program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
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
 *               required:
 *                 - newName
 *                 - newCode
 *               properties:
 *                 newName:
 *                   type: string
 *                   minLength: 3
 *                   maxLength: 100
 *                   description: Name for the cloned program
 *                 newCode:
 *                   type: string
 *                   pattern: ^[A-Z0-9-]{3,20}$
 *                   description: Code for the cloned program
 *                 includeReferences:
 *                   type: boolean
 *                   default: true
 *                   description: Include learning references in clone
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, draft]
 *                   default: draft
 *                   description: Initial status for the cloned program
 *       responses:
 *         201:
 *           description: Program cloned successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/AcademicProgram'
 *
 *   /api/v1/academic-programs/{programId}/audit-logs:
 *     get:
 *       tags: [Academic Programs]
 *       summary: Get program audit logs
 *       description: Retrieve audit logs for an academic program
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: programId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: query
 *           name: startDate
 *           schema:
 *             type: string
 *             format: date
 *           description: Filter logs from this date
 *         - in: query
 *           name: endDate
 *           schema:
 *             type: string
 *             format: date
 *           description: Filter logs until this date
 *         - in: query
 *           name: action
 *           schema:
 *             type: string
 *             enum: [create, update, delete]
 *           description: Filter by action type
 *       responses:
 *         200:
 *           description: Audit logs retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     action:
 *                       type: string
 *                       enum: [create, update, delete]
 *                     changes:
 *                       type: object
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
