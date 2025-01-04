const Joi = require('joi');

// Common validation schemas
const idSchema = Joi.string().uuid().required();
const nameSchema = Joi.string().min(2).max(100).required();
const statusSchema = Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');
const emailSchema = Joi.string().email();
const phoneSchema = Joi.string().pattern(/^\+?[\d\s-]{8,20}$/);
const urlSchema = Joi.string().uri();
const dateSchema = Joi.date().iso();
const positiveNumberSchema = Joi.number().positive();

// Enhanced validation rules
const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  });

const phoneSchemaEnhanced = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .messages({
    'string.pattern.base': 'Phone number must be in E.164 format'
  });

const ipAddressSchema = Joi.string().ip();
const macAddressSchema = Joi.string().pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);
const colorSchema = Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
const timeSchema = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
const timezoneSchema = Joi.string().pattern(/^[A-Za-z_]+\/[A-Za-z_]+$/);
const semverSchema = Joi.string().pattern(/^\d+\.\d+\.\d+$/);
const base64Schema = Joi.string().base64();
const jwTokenSchema = Joi.string().pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/);
const mongoIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// File validation schemas
const fileSchema = Joi.object({
  name: Joi.string().required(),
  size: Joi.number().positive().required(),
  type: Joi.string().required(),
  extension: Joi.string().pattern(/^\.[a-zA-Z0-9]+$/),
  checksum: Joi.string().pattern(/^[a-fA-F0-9]{32,128}$/),
  metadata: Joi.object()
});

// Geolocation schema
const geolocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude: Joi.number(),
  accuracy: Joi.number().positive(),
  altitudeAccuracy: Joi.number().positive(),
  heading: Joi.number().min(0).max(360),
  speed: Joi.number().positive()
});

// Enhanced address schema with geolocation
const addressSchema = Joi.object({
  street: Joi.string().max(100).required(),
  unit: Joi.string().max(20),
  city: Joi.string().max(50).required(),
  state: Joi.string().max(50).required(),
  country: Joi.string().max(50).required(),
  postalCode: Joi.string().max(20).required(),
  location: geolocationSchema,
  type: Joi.string().valid('PHYSICAL', 'MAILING', 'BILLING', 'SHIPPING', 'REGISTERED'),
  isVerified: Joi.boolean(),
  verificationDate: dateSchema,
  verificationMethod: Joi.string().valid('MANUAL', 'API', 'DOCUMENT'),
  metadata: Joi.object()
});

// Enhanced contact schema
const contactSchema = Joi.object({
  name: nameSchema,
  email: emailSchema.required(),
  phone: phoneSchemaEnhanced,
  alternatePhone: phoneSchemaEnhanced,
  title: Joi.string().max(100),
  department: Joi.string().max(100),
  preferredContactMethod: Joi.string().valid('EMAIL', 'PHONE', 'SMS', 'WHATSAPP', 'TELEGRAM'),
  availability: Joi.object({
    timezone: timezoneSchema.required(),
    schedule: Joi.object().pattern(
      Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
      Joi.array().items(Joi.object({
        start: timeSchema,
        end: timeSchema,
        status: Joi.string().valid('AVAILABLE', 'BUSY', 'TENTATIVE')
      }))
    )
  }),
  socialProfiles: Joi.object({
    linkedin: urlSchema,
    twitter: urlSchema,
    facebook: urlSchema,
    github: urlSchema,
    skype: Joi.string()
  }),
  languages: Joi.array().items(Joi.string()),
  documents: Joi.array().items(fileSchema),
  metadata: Joi.object()
});

// Enhanced organization settings schema
const organizationSettingsSchema = Joi.object({
  general: Joi.object({
    timezone: timezoneSchema,
    language: Joi.string(),
    currency: Joi.string().length(3),
    dateFormat: Joi.string(),
    timeFormat: Joi.string(),
    fiscalYearStart: Joi.string().pattern(/^\d{2}-\d{2}$/),
    weekStart: Joi.string().valid('SUNDAY', 'MONDAY')
  }),
  branding: Joi.object({
    logo: urlSchema,
    favicon: urlSchema,
    colors: Joi.object({
      primary: colorSchema,
      secondary: colorSchema,
      accent: colorSchema,
      success: colorSchema,
      warning: colorSchema,
      error: colorSchema
    }),
    fonts: Joi.object({
      primary: Joi.string(),
      secondary: Joi.string(),
      monospace: Joi.string()
    }),
    email: Joi.object({
      template: Joi.string(),
      signature: Joi.string(),
      disclaimer: Joi.string()
    })
  }),
  security: Joi.object({
    mfa: Joi.object({
      enabled: Joi.boolean(),
      methods: Joi.array().items(
        Joi.string().valid('SMS', 'EMAIL', 'AUTHENTICATOR', 'BIOMETRIC')
      )
    }),
    passwordPolicy: Joi.object({
      minLength: Joi.number().min(8),
      requireSpecialChar: Joi.boolean(),
      requireNumber: Joi.boolean(),
      requireUppercase: Joi.boolean(),
      requireLowercase: Joi.boolean(),
      preventReuse: Joi.number(),
      expiryDays: Joi.number(),
      lockoutAttempts: Joi.number(),
      lockoutDuration: Joi.number()
    }),
    ipWhitelist: Joi.array().items(ipAddressSchema),
    deviceWhitelist: Joi.array().items(macAddressSchema),
    sessionTimeout: Joi.number(),
    jwtSecret: Joi.string(),
    encryption: Joi.object({
      algorithm: Joi.string(),
      keyRotationDays: Joi.number()
    })
  }),
  notifications: Joi.object({
    channels: Joi.object({
      email: Joi.boolean(),
      sms: Joi.boolean(),
      push: Joi.boolean(),
      slack: Joi.boolean(),
      teams: Joi.boolean()
    }),
    preferences: Joi.object({
      security: Joi.array().items(Joi.string()),
      billing: Joi.array().items(Joi.string()),
      updates: Joi.array().items(Joi.string())
    }),
    webhooks: Joi.array().items(Joi.object({
      url: urlSchema,
      events: Joi.array().items(Joi.string()),
      secret: Joi.string()
    }))
  }),
  compliance: Joi.object({
    dataRetention: Joi.object({
      logs: Joi.number(),
      backups: Joi.number(),
      documents: Joi.number(),
      analytics: Joi.number()
    }),
    audit: Joi.object({
      enabled: Joi.boolean(),
      retention: Joi.number(),
      detailLevel: Joi.string().valid('BASIC', 'DETAILED', 'DEBUG')
    }),
    privacy: Joi.object({
      gdpr: Joi.boolean(),
      ccpa: Joi.boolean(),
      dataProcessing: Joi.object(),
      consentManagement: Joi.boolean()
    })
  }),
  integrations: Joi.object({
    sso: Joi.object({
      enabled: Joi.boolean(),
      provider: Joi.string(),
      config: Joi.object()
    }),
    analytics: Joi.object({
      google: Joi.object(),
      mixpanel: Joi.object(),
      segment: Joi.object()
    }),
    communication: Joi.object({
      slack: Joi.object(),
      teams: Joi.object(),
      discord: Joi.object()
    })
  })
});

// Organization validation schemas
const organizationCreateSchema = Joi.object({
  name: nameSchema,
  tenantId: idSchema,
  type: Joi.string().valid('BUSINESS', 'EDUCATIONAL', 'GOVERNMENT', 'NON_PROFIT').required(),
  registrationNumber: Joi.string().max(50),
  taxId: Joi.string().max(50),
  website: urlSchema,
  primaryContact: contactSchema.required(),
  address: addressSchema.required(),
  settings: organizationSettingsSchema,
  metadata: Joi.object()
});

const organizationUpdateSchema = organizationCreateSchema.fork(
  ['name', 'tenantId', 'type', 'primaryContact', 'address'],
  (schema) => schema.optional()
);

const organizationVerificationSchema = Joi.object({
  licenses: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    number: Joi.string().required(),
    issuedBy: Joi.string().required(),
    issuedDate: dateSchema.required(),
    expiryDate: dateSchema.required(),
    document: urlSchema.required()
  })),
  accreditations: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    issuedBy: Joi.string().required(),
    issuedDate: dateSchema.required(),
    expiryDate: dateSchema.required(),
    document: urlSchema.required()
  })),
  verifiedBy: idSchema,
  comments: Joi.string().max(500)
});

// Branch validation schemas
const branchCreateSchema = Joi.object({
  name: nameSchema,
  organizationId: idSchema,
  type: Joi.string().valid('MAIN', 'SATELLITE').required(),
  address: addressSchema.required(),
  contact: contactSchema.required(),
  facilities: Joi.object({
    area: positiveNumberSchema,
    capacity: positiveNumberSchema,
    rooms: Joi.array().items(Joi.object({
      id: idSchema,
      name: Joi.string().required(),
      type: Joi.string().required(),
      capacity: positiveNumberSchema,
      equipment: Joi.array().items(Joi.object({
        type: Joi.string(),
        quantity: Joi.number(),
        status: Joi.string()
      })),
      availability: Joi.object({
        schedule: Joi.object().pattern(
          Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
          Joi.array().items(Joi.object({
            start: timeSchema,
            end: timeSchema,
            status: Joi.string().valid('AVAILABLE', 'BOOKED', 'MAINTENANCE')
          }))
        )
      })
    })),
    amenities: Joi.array().items(Joi.string()),
    security: Joi.object({
      accessControl: Joi.boolean(),
      cctv: Joi.boolean(),
      guards: Joi.number()
    }),
    maintenance: Joi.object({
      schedule: Joi.object(),
      lastInspection: dateSchema,
      nextInspection: dateSchema
    })
  }),
  operatingHours: Joi.object({
    timezone: Joi.string().required(),
    schedule: Joi.object().pattern(
      Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
      Joi.object({
        open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      })
    )
  }),
  metadata: Joi.object()
});

const branchUpdateSchema = branchCreateSchema.fork(
  ['name', 'organizationId', 'type', 'address', 'contact'],
  (schema) => schema.optional()
);

// Department validation schemas
const departmentCreateSchema = Joi.object({
  name: nameSchema,
  branchId: idSchema,
  organizationId: idSchema,
  parentDepartmentId: idSchema.optional(),
  description: Joi.string().max(500),
  head: Joi.object({
    userId: idSchema,
    name: nameSchema,
    title: Joi.string().required(),
    startDate: dateSchema.required()
  }),
  resources: Joi.object({
    budget: Joi.object({
      amount: positiveNumberSchema,
      currency: Joi.string(),
      fiscalYear: Joi.string()
    }),
    equipment: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      quantity: positiveNumberSchema,
      status: Joi.string().valid('AVAILABLE', 'IN_USE', 'MAINTENANCE')
    })),
    software: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      licenses: positiveNumberSchema,
      expiryDate: dateSchema
    }))
  }),
  settings: Joi.object({
    autoAssignment: Joi.boolean(),
    requireApproval: Joi.boolean(),
    notificationPreferences: Joi.object({
      email: Joi.boolean(),
      slack: Joi.boolean(),
      teams: Joi.boolean()
    })
  }),
  metadata: Joi.object()
});

const departmentUpdateSchema = departmentCreateSchema.fork(
  ['name', 'branchId', 'organizationId', 'parentDepartmentId', 'head'],
  (schema) => schema.optional()
);

const departmentMoveSchema = Joi.object({
  targetBranchId: idSchema,
  maintainHierarchy: Joi.boolean().default(true),
  reason: Joi.string().max(500)
});

// Enhanced backup validation schemas
const backupCreateSchema = Joi.object({
  organizationId: idSchema,
  type: Joi.string().valid('FULL', 'INCREMENTAL', 'DIFFERENTIAL').required(),
  includeAttachments: Joi.boolean().default(true),
  compression: Joi.object({
    enabled: Joi.boolean().default(true),
    level: Joi.number().min(0).max(9).default(6),
    algorithm: Joi.string().valid('gzip', 'brotli').default('gzip')
  }),
  encryption: Joi.object({
    enabled: Joi.boolean().default(true),
    algorithm: Joi.string().valid('aes-256-gcm', 'aes-256-cbc').default('aes-256-gcm'),
    keyDerivation: Joi.string().valid('pbkdf2', 'argon2').default('pbkdf2')
  }),
  verification: Joi.object({
    enabled: Joi.boolean().default(true),
    checksumAlgorithm: Joi.string().valid('sha256', 'sha512').default('sha256'),
    validateRestore: Joi.boolean().default(true)
  }),
  retention: Joi.object({
    days: Joi.number().min(1).default(30),
    maxBackups: Joi.number().min(1).default(10)
  }),
  metadata: Joi.object()
});

const backupRestoreSchema = Joi.object({
  backupPath: Joi.string().required(),
  options: Joi.object({
    force: Joi.boolean().default(false),
    skipValidation: Joi.boolean().default(false),
    restoreSettings: Joi.boolean().default(true),
    restoreConnections: Joi.boolean().default(true)
  })
});

module.exports = {
  organizationCreateSchema,
  organizationUpdateSchema,
  organizationVerificationSchema,
  branchCreateSchema,
  branchUpdateSchema,
  departmentCreateSchema,
  departmentUpdateSchema,
  departmentMoveSchema,
  backupCreateSchema,
  backupRestoreSchema
};
