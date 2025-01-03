// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\validation-schemas\academic-program.schema.js

const Joi = require('joi');

const academicProgramSchema = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(100),
    code: Joi.string().required().pattern(/^[A-Z0-9-]{3,20}$/),
    description: Joi.string().optional().max(1000),
    level: Joi.string().required().valid('undergraduate', 'postgraduate', 'doctorate', 'diploma', 'certificate'),
    duration: Joi.number().required().min(1).max(120),
    totalCredits: Joi.number().required().min(0),
    status: Joi.string().valid('active', 'inactive', 'draft', 'archived').default('draft'),
    accreditation: Joi.object({
      body: Joi.string().required(),
      accreditationId: Joi.string().required(),
      validFrom: Joi.date().iso().required(),
      validTo: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
      status: Joi.string().valid('pending', 'approved', 'expired').required()
    }).optional(),
    admissionRequirements: Joi.object({
      minimumQualification: Joi.string().required(),
      minimumGrade: Joi.string().required(),
      entranceExam: Joi.boolean().default(false),
      additionalRequirements: Joi.array().items(Joi.string())
    }).required(),
    learningOutcomes: Joi.array().items(
      Joi.object({
        category: Joi.string().required(),
        description: Joi.string().required()
      })
    ).min(1).required(),
    organizationId: Joi.string().guid({ version: 'uuidv4' }).required(),
    departmentId: Joi.string().guid({ version: 'uuidv4' }).required(),
    metadata: Joi.object().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(1000),
    level: Joi.string().valid('undergraduate', 'postgraduate', 'doctorate', 'diploma', 'certificate'),
    duration: Joi.number().min(1).max(120),
    totalCredits: Joi.number().min(0),
    status: Joi.string().valid('active', 'inactive', 'draft', 'archived'),
    accreditation: Joi.object({
      body: Joi.string().required(),
      accreditationId: Joi.string().required(),
      validFrom: Joi.date().iso().required(),
      validTo: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
      status: Joi.string().valid('pending', 'approved', 'expired').required()
    }),
    admissionRequirements: Joi.object({
      minimumQualification: Joi.string(),
      minimumGrade: Joi.string(),
      entranceExam: Joi.boolean(),
      additionalRequirements: Joi.array().items(Joi.string())
    }),
    learningOutcomes: Joi.array().items(
      Joi.object({
        category: Joi.string().required(),
        description: Joi.string().required()
      })
    ).min(1),
    metadata: Joi.object()
  }).min(1),

  search: Joi.object({
    query: Joi.string().optional().max(100),
    level: Joi.array().items(
      Joi.string().valid('undergraduate', 'postgraduate', 'doctorate', 'diploma', 'certificate')
    ).optional(),
    status: Joi.array().items(
      Joi.string().valid('active', 'inactive', 'draft', 'archived')
    ).optional(),
    duration: Joi.object({
      min: Joi.number().min(1),
      max: Joi.number().max(120)
    }).optional(),
    credits: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number()
    }).optional(),
    organizationId: Joi.string().guid({ version: 'uuidv4' }).optional(),
    departmentId: Joi.string().guid({ version: 'uuidv4' }).optional(),
    createdAt: Joi.object({
      from: Joi.date().iso(),
      to: Joi.date().iso().greater(Joi.ref('from'))
    }).optional(),
    sortBy: Joi.string().valid('name', 'code', 'level', 'createdAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10)
  }),

  batchCreate: Joi.object({
    programs: Joi.array().items(academicProgramSchema.create).min(1).max(100).required()
  }),

  batchUpdate: Joi.object({
    updates: Joi.array().items(
      Joi.object({
        id: Joi.string().guid({ version: 'uuidv4' }).required(),
        data: academicProgramSchema.update.required()
      })
    ).min(1).max(100).required()
  }),

  batchDelete: Joi.object({
    programIds: Joi.array().items(
      Joi.string().guid({ version: 'uuidv4' })
    ).min(1).max(100).required()
  }),

  addLearningReference: Joi.object({
    courseId: Joi.string().guid({ version: 'uuidv4' }).required(),
    curriculumId: Joi.string().guid({ version: 'uuidv4' }).required(),
    type: Joi.string().valid('course', 'curriculum', 'assessment').required(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    metadata: Joi.object().optional()
  }),

  export: Joi.object({
    format: Joi.string().valid('json', 'csv', 'excel').required(),
    programIds: Joi.array().items(
      Joi.string().guid({ version: 'uuidv4' })
    ).optional(),
    includeReferences: Joi.boolean().default(true),
    filters: academicProgramSchema.search.optional()
  }),

  import: Joi.object({
    file: Joi.any().required(), // Will be validated by multer middleware
    format: Joi.string().valid('json', 'csv', 'excel').required(),
    updateExisting: Joi.boolean().default(false),
    organizationId: Joi.string().guid({ version: 'uuidv4' }).required()
  }),

  clone: Joi.object({
    newName: Joi.string().min(3).max(100).required(),
    newCode: Joi.string().pattern(/^[A-Z0-9-]{3,20}$/).required(),
    includeReferences: Joi.boolean().default(true),
    status: Joi.string().valid('active', 'inactive', 'draft').default('draft')
  })
};

module.exports = { academicProgramSchema };
