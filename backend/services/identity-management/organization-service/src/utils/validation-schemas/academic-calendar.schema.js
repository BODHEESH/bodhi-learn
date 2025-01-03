// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\validation-schemas\academic-calendar.schema.js

const Joi = require('joi');

const academicCalendarSchema = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(100),
    academicYear: Joi.string().required().pattern(/^\d{4}-\d{4}$/),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    organizationId: Joi.string().guid({ version: 'uuidv4' }).required(),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    metadata: Joi.object().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    status: Joi.string().valid('draft', 'published', 'archived'),
    metadata: Joi.object()
  }).min(1),

  search: Joi.object({
    query: Joi.string().optional().max(100),
    academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    status: Joi.array().items(
      Joi.string().valid('draft', 'published', 'archived')
    ).optional(),
    dateRange: Joi.object({
      from: Joi.date().iso(),
      to: Joi.date().iso().greater(Joi.ref('from'))
    }).optional(),
    organizationId: Joi.string().guid({ version: 'uuidv4' }).optional(),
    hasActiveTerms: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'academicYear', 'startDate', 'createdAt').default('startDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10)
  }),

  batchCreate: Joi.object({
    calendars: Joi.array().items(academicCalendarSchema.create).min(1).max(50).required()
  }),

  addTerm: Joi.object({
    name: Joi.string().required().min(3).max(100),
    code: Joi.string().required().pattern(/^[A-Z0-9-]{2,10}$/),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    type: Joi.string().valid('semester', 'trimester', 'quarter').required(),
    sequence: Joi.number().min(1).required(),
    status: Joi.string().valid('upcoming', 'current', 'completed').default('upcoming'),
    metadata: Joi.object().optional()
  }),

  updateTerm: Joi.object({
    name: Joi.string().min(3).max(100),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    status: Joi.string().valid('upcoming', 'current', 'completed'),
    metadata: Joi.object()
  }).min(1),

  addEvent: Joi.object({
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().optional().max(1000),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    type: Joi.string().valid(
      'academic',
      'administrative',
      'holiday',
      'exam',
      'registration',
      'other'
    ).required(),
    termId: Joi.string().guid({ version: 'uuidv4' }).optional(),
    location: Joi.string().optional().max(200),
    isAllDay: Joi.boolean().default(false),
    recurrence: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
      interval: Joi.number().min(1),
      until: Joi.date().iso().greater(Joi.ref('../../startDate'))
    }).optional(),
    notification: Joi.object({
      enabled: Joi.boolean().default(false),
      beforeDays: Joi.number().min(0),
      notifyRoles: Joi.array().items(
        Joi.string().valid('admin', 'academic_admin', 'program_manager', 'instructor', 'student')
      )
    }).optional(),
    metadata: Joi.object().optional()
  }),

  updateEvent: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(1000),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    location: Joi.string().max(200),
    isAllDay: Joi.boolean(),
    recurrence: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
      interval: Joi.number().min(1),
      until: Joi.date().iso().greater(Joi.ref('../../startDate'))
    }),
    notification: Joi.object({
      enabled: Joi.boolean(),
      beforeDays: Joi.number().min(0),
      notifyRoles: Joi.array().items(
        Joi.string().valid('admin', 'academic_admin', 'program_manager', 'instructor', 'student')
      )
    }),
    metadata: Joi.object()
  }).min(1),

  export: Joi.object({
    format: Joi.string().valid('json', 'ical', 'excel').required(),
    dateRange: Joi.object({
      from: Joi.date().iso(),
      to: Joi.date().iso().greater(Joi.ref('from'))
    }).optional(),
    includeTerms: Joi.boolean().default(true),
    includeEvents: Joi.boolean().default(true),
    eventTypes: Joi.array().items(
      Joi.string().valid('academic', 'administrative', 'holiday', 'exam', 'registration', 'other')
    ).optional()
  }),

  import: Joi.object({
    file: Joi.any().required(), // Will be validated by multer middleware
    format: Joi.string().valid('json', 'ical', 'excel').required(),
    updateExisting: Joi.boolean().default(false),
    organizationId: Joi.string().guid({ version: 'uuidv4' }).required()
  }),

  clone: Joi.object({
    newName: Joi.string().min(3).max(100).required(),
    academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
    includeTerms: Joi.boolean().default(true),
    includeEvents: Joi.boolean().default(true),
    adjustDates: Joi.boolean().default(true),
    status: Joi.string().valid('draft', 'published').default('draft')
  })
};

module.exports = { academicCalendarSchema };
