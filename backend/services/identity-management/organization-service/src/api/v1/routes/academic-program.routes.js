// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\routes\academic-program.routes.js

const express = require('express');
const router = express.Router();
const academicProgramController = require('../controllers/academic-program.controller');
const { validateSchema } = require('../middleware/validate-schema');
const { academicProgramSchema } = require('../../../utils/validation-schemas/academic-program.schema');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all programs with filtering and pagination
router.get(
  '/',
  authorize(['admin', 'academic_admin', 'program_manager']),
  academicProgramController.listPrograms
);

// Advanced search programs
router.post(
  '/search',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor']),
  validateSchema(academicProgramSchema.search),
  academicProgramController.searchPrograms
);

// Create a new program
router.post(
  '/',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.create),
  academicProgramController.createProgram
);

// Batch create programs
router.post(
  '/batch',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.batchCreate),
  academicProgramController.batchCreatePrograms
);

// Get program by ID
router.get(
  '/:programId',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor']),
  academicProgramController.getProgram
);

// Update program
router.put(
  '/:programId',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.update),
  academicProgramController.updateProgram
);

// Batch update programs
router.put(
  '/batch',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.batchUpdate),
  academicProgramController.batchUpdatePrograms
);

// Delete program
router.delete(
  '/:programId',
  authorize(['admin', 'academic_admin']),
  academicProgramController.deleteProgram
);

// Batch delete programs
router.post(
  '/batch-delete',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.batchDelete),
  academicProgramController.batchDeletePrograms
);

// Get program statistics
router.get(
  '/:programId/stats',
  authorize(['admin', 'academic_admin', 'program_manager']),
  academicProgramController.getProgramStats
);

// Add learning reference to program
router.post(
  '/:programId/learning-references',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.addLearningReference),
  academicProgramController.addLearningReference
);

// Get program learning references
router.get(
  '/:programId/learning-references',
  authorize(['admin', 'academic_admin', 'program_manager', 'instructor']),
  academicProgramController.getLearningReferences
);

// Delete learning reference
router.delete(
  '/:programId/learning-references/:referenceId',
  authorize(['admin', 'academic_admin']),
  academicProgramController.deleteLearningReference
);

// Get program audit logs
router.get(
  '/:programId/audit-logs',
  authorize(['admin', 'academic_admin']),
  academicProgramController.getProgramAuditLogs
);

// Export programs
router.post(
  '/export',
  authorize(['admin', 'academic_admin', 'program_manager']),
  validateSchema(academicProgramSchema.export),
  academicProgramController.exportPrograms
);

// Import programs
router.post(
  '/import',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.import),
  academicProgramController.importPrograms
);

// Clone program
router.post(
  '/:programId/clone',
  authorize(['admin', 'academic_admin']),
  validateSchema(academicProgramSchema.clone),
  academicProgramController.cloneProgram
);

module.exports = router;
