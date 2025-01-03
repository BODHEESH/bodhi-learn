// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\swagger\academic-calendar.swagger.js

/**
 * @swagger
 * components:
 *   schemas:
 *     AcademicCalendar:
 *       type: object
 *       required:
 *         - name
 *         - academicYear
 *         - startDate
 *         - endDate
 *         - organizationId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the calendar
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Name of the academic calendar
 *         academicYear:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *           description: Academic year (e.g., 2025-2026)
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the academic year
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of the academic year
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: draft
 *           description: Current status of the calendar
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: ID of the organization
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
 *     CalendarTerm:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - startDate
 *         - endDate
 *         - type
 *         - sequence
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the term
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Name of the term
 *         code:
 *           type: string
 *           pattern: ^[A-Z0-9-]{2,10}$
 *           description: Unique code for the term
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the term
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of the term
 *         type:
 *           type: string
 *           enum: [semester, trimester, quarter]
 *           description: Type of term
 *         sequence:
 *           type: number
 *           minimum: 1
 *           description: Sequence number of the term
 *         status:
 *           type: string
 *           enum: [upcoming, current, completed]
 *           default: upcoming
 *           description: Current status of the term
 *         metadata:
 *           type: object
 *           description: Additional metadata
 * 
 *     CalendarEvent:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *         - endDate
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the event
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Title of the event
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Description of the event
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date and time of the event
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date and time of the event
 *         type:
 *           type: string
 *           enum: [academic, administrative, holiday, exam, registration, other]
 *           description: Type of event
 *         termId:
 *           type: string
 *           format: uuid
 *           description: Associated term ID (optional)
 *         location:
 *           type: string
 *           maxLength: 200
 *           description: Event location
 *         isAllDay:
 *           type: boolean
 *           default: false
 *           description: Whether the event is all-day
 *         recurrence:
 *           type: object
 *           properties:
 *             frequency:
 *               type: string
 *               enum: [daily, weekly, monthly, yearly]
 *             interval:
 *               type: number
 *               minimum: 1
 *             until:
 *               type: string
 *               format: date
 *         notification:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               default: false
 *             beforeDays:
 *               type: number
 *               minimum: 0
 *             notifyRoles:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [admin, academic_admin, program_manager, instructor, student]
 *         metadata:
 *           type: object
 *           description: Additional metadata
 * 
 *     CalendarSearchParams:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           maxLength: 100
 *           description: Search query string
 *         academicYear:
 *           type: string
 *           pattern: ^\d{4}-\d{4}$
 *           description: Filter by academic year
 *         status:
 *           type: array
 *           items:
 *             type: string
 *             enum: [draft, published, archived]
 *           description: Filter by calendar status
 *         dateRange:
 *           type: object
 *           properties:
 *             from:
 *               type: string
 *               format: date
 *             to:
 *               type: string
 *               format: date
 *           description: Filter by date range
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: Filter by organization
 *         hasActiveTerms:
 *           type: boolean
 *           description: Filter calendars with active terms
 *         sortBy:
 *           type: string
 *           enum: [name, academicYear, startDate, createdAt]
 *           default: startDate
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
 * /api/v1/academic-calendars:
 *   get:
 *     tags: [Academic Calendar]
 *     summary: List all academic calendars
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of academic calendars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AcademicCalendar'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 * 
 *   post:
 *     tags: [Academic Calendar]
 *     summary: Create a new academic calendar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicCalendar'
 *     responses:
 *       201:
 *         description: Academic calendar created successfully
 * 
 *   /api/v1/academic-calendars/batch:
 *     post:
 *       tags: [Academic Calendars]
 *       summary: Create multiple academic calendars
 *       description: Create multiple academic calendars in a single request
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - calendars
 *               properties:
 *                 calendars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AcademicCalendar'
 *                   minItems: 1
 *                   maxItems: 100
 *       responses:
 *         201:
 *           description: Academic calendars created successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicCalendar'
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
 *   /api/v1/academic-calendars/batch-update:
 *     put:
 *       tags: [Academic Calendars]
 *       summary: Update multiple academic calendars
 *       description: Update multiple academic calendars in a single request
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
 *                         $ref: '#/components/schemas/AcademicCalendar'
 *       responses:
 *         200:
 *           description: Academic calendars updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   updated:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicCalendar'
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
 *   /api/v1/academic-calendars/batch-delete:
 *     post:
 *       tags: [Academic Calendars]
 *       summary: Delete multiple academic calendars
 *       description: Delete multiple academic calendars in a single request
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - calendarIds
 *               properties:
 *                 calendarIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   minItems: 1
 *                   maxItems: 100
 *       responses:
 *         200:
 *           description: Academic calendars deleted successfully
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
 *   /api/v1/academic-calendars/{calendarId}/terms:
 *     post:
 *       tags: [Academic Calendar]
 *       summary: Add a term to calendar
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarTerm'
 *       responses:
 *         201:
 *           description: Term added successfully
 * 
 *   /api/v1/academic-calendars/{calendarId}/terms/{termId}:
 *     put:
 *       tags: [Academic Calendars]
 *       summary: Update a calendar term
 *       description: Update an existing term in an academic calendar
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: path
 *           name: termId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarTerm'
 *       responses:
 *         200:
 *           description: Term updated successfully
 * 
 *     delete:
 *       tags: [Academic Calendars]
 *       summary: Delete a calendar term
 *       description: Delete a term from an academic calendar
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: path
 *           name: termId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         204:
 *           description: Term deleted successfully
 * 
 *   /api/v1/academic-calendars/{calendarId}/events:
 *     post:
 *       tags: [Academic Calendar]
 *       summary: Add an event to calendar
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarEvent'
 *       responses:
 *         201:
 *           description: Event added successfully
 * 
 *   /api/v1/academic-calendars/{calendarId}/events/{eventId}:
 *     put:
 *       tags: [Academic Calendars]
 *       summary: Update a calendar event
 *       description: Update an existing event in an academic calendar
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: path
 *           name: eventId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CalendarEvent'
 *       responses:
 *         200:
 *           description: Event updated successfully
 * 
 *     delete:
 *       tags: [Academic Calendars]
 *       summary: Delete a calendar event
 *       description: Delete an event from an academic calendar
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *         - in: path
 *           name: eventId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         204:
 *           description: Event deleted successfully
 * 
 *   /api/v1/academic-calendars/{calendarId}/sync:
 *     post:
 *       tags: [Academic Calendar]
 *       summary: Sync calendar with learning management system
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: calendarId
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Calendar synced successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                   syncedEvents:
 *                     type: integer
 *                   learningActivities:
 *                     type: integer
 * 
 *   /api/v1/academic-calendars/export:
 *     post:
 *       tags: [Academic Calendars]
 *       summary: Export academic calendars
 *       description: Export academic calendars in various formats (JSON, CSV, Excel)
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
 *                 calendarIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: Specific calendar IDs to export. If not provided, all calendars will be exported based on filters
 *                 includeTerms:
 *                   type: boolean
 *                   default: true
 *                   description: Include terms in export
 *                 includeEvents:
 *                   type: boolean
 *                   default: true
 *                   description: Include events in export
 *                 filters:
 *                   $ref: '#/components/schemas/CalendarSearchParams'
 *       responses:
 *         200:
 *           description: Calendars exported successfully
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
 *   /api/v1/academic-calendars/import:
 *     post:
 *       tags: [Academic Calendars]
 *       summary: Import academic calendars
 *       description: Import academic calendars from various formats (JSON, CSV, Excel)
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
 *                   description: Update existing calendars if they exist
 *                 organizationId:
 *                   type: string
 *                   format: uuid
 *                   description: Organization to import calendars into
 *       responses:
 *         200:
 *           description: Calendars imported successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   imported:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicCalendar'
 *                   updated:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/AcademicCalendar'
 *                   failed:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         row:
 *                           type: number
 *                         error:
 *                           type: string
 */
