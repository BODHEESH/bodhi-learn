// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\services\academic-calendar.service.js

const { Op } = require('sequelize');
const { withTransaction } = require('../database/connection');
const AcademicCalendar = require('../models/academic-calendar.model');
const AcademicTerm = require('../models/academic-term.model');
const AcademicEvent = require('../models/academic-event.model');
const { ValidationError, NotFoundError } = require('../utils/errors/custom-error');
const logger = require('../utils/logger');

class AcademicCalendarService {
  /**
   * Create a new academic calendar
   */
  async createCalendar(calendarData, transaction = null) {
    const calendar = await withTransaction(async (t) => {
      // Check if calendar already exists for the academic year
      const existingCalendar = await AcademicCalendar.findOne({
        where: {
          organizationId: calendarData.organizationId,
          academicYear: calendarData.academicYear
        }
      });

      if (existingCalendar) {
        throw new ValidationError('Calendar already exists for this academic year');
      }

      const newCalendar = await AcademicCalendar.create(calendarData, {
        transaction: t || transaction
      });

      logger.info('Created new academic calendar', {
        calendarId: newCalendar.id,
        academicYear: newCalendar.academicYear
      });

      return newCalendar;
    });

    return calendar;
  }

  /**
   * Update an existing academic calendar
   */
  async updateCalendar(calendarId, updateData, transaction = null) {
    const calendar = await this.getCalendar(calendarId);

    const updatedCalendar = await withTransaction(async (t) => {
      await calendar.update(updateData, {
        transaction: t || transaction
      });

      logger.info('Updated academic calendar', {
        calendarId: calendar.id,
        updates: Object.keys(updateData)
      });

      return calendar;
    });

    return updatedCalendar;
  }

  /**
   * Get a single academic calendar by ID
   */
  async getCalendar(calendarId, includeRelations = true) {
    const include = includeRelations ? [
      {
        model: AcademicTerm,
        as: 'terms',
        include: [
          {
            model: AcademicEvent,
            as: 'events'
          }
        ]
      },
      {
        model: AcademicEvent,
        as: 'events'
      }
    ] : [];

    const calendar = await AcademicCalendar.findByPk(calendarId, { include });

    if (!calendar) {
      throw new NotFoundError('Academic calendar not found');
    }

    return calendar;
  }

  /**
   * List academic calendars with filtering and pagination
   */
  async listCalendars(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.academicYear) {
      where.academicYear = filters.academicYear;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { academicYear: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { rows: calendars, count } = await AcademicCalendar.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: AcademicTerm,
          as: 'terms',
          attributes: ['id', 'name', 'type', 'startDate', 'endDate']
        }
      ]
    });

    return {
      calendars,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Add a term to an academic calendar
   */
  async addTerm(calendarId, termData, transaction = null) {
    const calendar = await this.getCalendar(calendarId);

    const term = await withTransaction(async (t) => {
      const newTerm = await AcademicTerm.create({
        ...termData,
        calendarId: calendar.id
      }, {
        transaction: t || transaction
      });

      logger.info('Added term to academic calendar', {
        calendarId: calendar.id,
        termId: newTerm.id
      });

      return newTerm;
    });

    return term;
  }

  /**
   * Add an event to an academic calendar
   */
  async addEvent(calendarId, eventData, transaction = null) {
    const calendar = await this.getCalendar(calendarId);

    const event = await withTransaction(async (t) => {
      const newEvent = await AcademicEvent.create({
        ...eventData,
        calendarId: calendar.id
      }, {
        transaction: t || transaction
      });

      logger.info('Added event to academic calendar', {
        calendarId: calendar.id,
        eventId: newEvent.id
      });

      return newEvent;
    });

    return event;
  }

  /**
   * Delete an academic calendar
   */
  async deleteCalendar(calendarId, transaction = null) {
    const calendar = await this.getCalendar(calendarId);

    await withTransaction(async (t) => {
      await calendar.destroy({
        transaction: t || transaction
      });

      logger.info('Deleted academic calendar', {
        calendarId: calendar.id
      });
    });

    return true;
  }

  /**
   * Get calendar events for a date range
   */
  async getEventsInRange(calendarId, startDate, endDate) {
    const events = await AcademicEvent.findAll({
      where: {
        calendarId,
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            endDate: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      },
      order: [['startDate', 'ASC']]
    });

    return events;
  }

  /**
   * Get current academic term
   */
  async getCurrentTerm(calendarId) {
    const currentDate = new Date();

    const term = await AcademicTerm.findOne({
      where: {
        calendarId,
        startDate: {
          [Op.lte]: currentDate
        },
        endDate: {
          [Op.gte]: currentDate
        }
      }
    });

    return term;
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(calendarId) {
    const calendar = await this.getCalendar(calendarId, true);

    const stats = {
      totalTerms: await AcademicTerm.count({ where: { calendarId } }),
      totalEvents: await AcademicEvent.count({ where: { calendarId } }),
      eventsByType: await AcademicEvent.count({
        where: { calendarId },
        group: ['type']
      }),
      upcomingEvents: await AcademicEvent.count({
        where: {
          calendarId,
          startDate: {
            [Op.gt]: new Date()
          }
        }
      })
    };

    return stats;
  }
}

module.exports = new AcademicCalendarService();
