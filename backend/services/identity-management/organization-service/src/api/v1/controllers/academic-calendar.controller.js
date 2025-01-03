// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\controllers\academic-calendar.controller.js

const academicCalendarService = require('../../../services/academic-calendar.service');
const learningManagementService = require('../../../integrations/learning-management.service');
const { asyncHandler } = require('../middleware/error-handler');
const logger = require('../../../utils/logger');

class AcademicCalendarController {
  /**
   * List all calendars with filtering and pagination
   */
  listCalendars = asyncHandler(async (req, res) => {
    const { page, limit, ...filters } = req.query;
    const result = await academicCalendarService.listCalendars(filters, { page, limit });
    res.json(result);
  });

  /**
   * Create a new calendar
   */
  createCalendar = asyncHandler(async (req, res) => {
    const calendar = await academicCalendarService.createCalendar(req.body);
    logger.audit('Calendar created', {
      userId: req.user.id,
      calendarId: calendar.id
    });
    res.status(201).json(calendar);
  });

  /**
   * Get calendar by ID
   */
  getCalendar = asyncHandler(async (req, res) => {
    const calendar = await academicCalendarService.getCalendar(req.params.calendarId);
    res.json(calendar);
  });

  /**
   * Update calendar
   */
  updateCalendar = asyncHandler(async (req, res) => {
    const calendar = await academicCalendarService.updateCalendar(
      req.params.calendarId,
      req.body
    );
    logger.audit('Calendar updated', {
      userId: req.user.id,
      calendarId: calendar.id,
      updates: Object.keys(req.body)
    });
    res.json(calendar);
  });

  /**
   * Delete calendar
   */
  deleteCalendar = asyncHandler(async (req, res) => {
    await academicCalendarService.deleteCalendar(req.params.calendarId);
    logger.audit('Calendar deleted', {
      userId: req.user.id,
      calendarId: req.params.calendarId
    });
    res.status(204).end();
  });

  /**
   * Add term to calendar
   */
  addTerm = asyncHandler(async (req, res) => {
    const term = await academicCalendarService.addTerm(
      req.params.calendarId,
      req.body
    );
    logger.audit('Term added to calendar', {
      userId: req.user.id,
      calendarId: req.params.calendarId,
      termId: term.id
    });
    res.status(201).json(term);
  });

  /**
   * Add event to calendar
   */
  addEvent = asyncHandler(async (req, res) => {
    const event = await academicCalendarService.addEvent(
      req.params.calendarId,
      req.body
    );
    logger.audit('Event added to calendar', {
      userId: req.user.id,
      calendarId: req.params.calendarId,
      eventId: event.id
    });
    res.status(201).json(event);
  });

  /**
   * Get calendar events for date range
   */
  getEventsInRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const events = await academicCalendarService.getEventsInRange(
      req.params.calendarId,
      startDate,
      endDate
    );
    res.json(events);
  });

  /**
   * Get current term
   */
  getCurrentTerm = asyncHandler(async (req, res) => {
    const term = await academicCalendarService.getCurrentTerm(req.params.calendarId);
    res.json(term);
  });

  /**
   * Get calendar statistics
   */
  getCalendarStats = asyncHandler(async (req, res) => {
    const stats = await academicCalendarService.getCalendarStats(req.params.calendarId);
    res.json(stats);
  });

  /**
   * Sync calendar with learning management system
   */
  syncWithLMS = asyncHandler(async (req, res) => {
    // Get calendar events
    const calendar = await academicCalendarService.getCalendar(req.params.calendarId);
    
    // Get learning activities from LMS
    const learningActivities = await learningManagementService.getLearningActivities(
      calendar.startDate,
      calendar.endDate,
      { calendarId: calendar.id }
    );

    // Sync events with LMS
    const syncResult = await learningManagementService.syncCalendarEvents(
      req.params.calendarId,
      calendar.events
    );

    logger.audit('Calendar synced with LMS', {
      userId: req.user.id,
      calendarId: req.params.calendarId,
      syncedEvents: syncResult.syncedCount
    });

    res.json({
      message: 'Calendar synced successfully',
      syncedEvents: syncResult.syncedCount,
      learningActivities: learningActivities.length
    });
  });
}

module.exports = new AcademicCalendarController();
