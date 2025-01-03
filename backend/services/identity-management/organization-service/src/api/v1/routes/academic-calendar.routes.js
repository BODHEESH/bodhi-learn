// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\routes\academic-calendar.routes.js

const express = require('express');
const router = express.Router();
const academicCalendarController = require('../controllers/academic-calendar.controller');
const { validateSchema } = require('../middleware/validate-schema');
const { academicCalendarSchema } = require('../../../utils/validation-schemas/academic-calendar.schema');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all calendars with filtering and pagination
router.get(
  '/',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor']),
  academicCalendarController.listCalendars
);

// Advanced search calendars
router.post(
  '/search',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor']),
  validateSchema(academicCalendarSchema.search),
  academicCalendarController.searchCalendars
);

// Create a new calendar
router.post(
  '/',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.create),
  academicCalendarController.createCalendar
);

// Batch create calendars
router.post(
  '/batch',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.batchCreate),
  academicCalendarController.batchCreateCalendars
);

// Get calendar by ID
router.get(
  '/:calendarId',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor', 'student']),
  academicCalendarController.getCalendar
);

// Update calendar
router.put(
  '/:calendarId',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.update),
  academicCalendarController.updateCalendar
);

// Delete calendar
router.delete(
  '/:calendarId',
  authorize(['admin', 'academic_admin']),
  academicCalendarController.deleteCalendar
);

// Add term to calendar
router.post(
  '/:calendarId/terms',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.addTerm),
  academicCalendarController.addTerm
);

// Update term
router.put(
  '/:calendarId/terms/:termId',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.updateTerm),
  academicCalendarController.updateTerm
);

// Delete term
router.delete(
  '/:calendarId/terms/:termId',
  authorize(['admin', 'academic_admin']),
  academicCalendarController.deleteTerm
);

// Add event to calendar
router.post(
  '/:calendarId/events',
  authorize(['admin', 'academic_admin', 'program_manager']),
  validateSchema(academicCalendarSchema.addEvent),
  academicCalendarController.addEvent
);

// Update event
router.put(
  '/:calendarId/events/:eventId',
  authorize(['admin', 'academic_admin', 'program_manager']),
  validateSchema(academicCalendarSchema.updateEvent),
  academicCalendarController.updateEvent
);

// Delete event
router.delete(
  '/:calendarId/events/:eventId',
  authorize(['admin', 'academic_admin', 'program_manager']),
  academicCalendarController.deleteEvent
);

// Get calendar events for date range
router.get(
  '/:calendarId/events',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor', 'student']),
  academicCalendarController.getEventsInRange
);

// Get recurring events
router.get(
  '/:calendarId/recurring-events',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor', 'student']),
  academicCalendarController.getRecurringEvents
);

// Get current term
router.get(
  '/:calendarId/current-term',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor', 'student']),
  academicCalendarController.getCurrentTerm
);

// Get upcoming terms
router.get(
  '/:calendarId/upcoming-terms',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor', 'student']),
  academicCalendarController.getUpcomingTerms
);

// Get calendar statistics
router.get(
  '/:calendarId/stats',
  authorize(['admin', 'academic_admin', 'program_manager']),
  academicCalendarController.getCalendarStats
);

// Sync calendar with learning management system
router.post(
  '/:calendarId/sync',
  authorize(['admin', 'academic_admin']),
  academicCalendarController.syncWithLMS
);

// Export calendar
router.post(
  '/:calendarId/export',
  authorize(['admin', 'academic_admin', 'program_manager']),
  validateSchema(academicCalendarSchema.export),
  academicCalendarController.exportCalendar
);

// Import calendar
router.post(
  '/import',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.import),
  academicCalendarController.importCalendar
);

// Clone calendar
router.post(
  '/:calendarId/clone',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicCalendarSchema.clone),
  academicCalendarController.cloneCalendar
);

// Get calendar conflicts
router.get(
  '/:calendarId/conflicts',
  authorize(['admin', 'academic_admin', 'program_manager']),
  academicCalendarController.getCalendarConflicts
);

// Get calendar audit logs
router.get(
  '/:calendarId/audit-logs',
  authorize(['admin', 'academic_admin']),
  academicCalendarController.getCalendarAuditLogs
);

module.exports = router;
