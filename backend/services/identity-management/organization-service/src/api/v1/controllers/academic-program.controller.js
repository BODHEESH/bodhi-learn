// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\controllers\academic-program.controller.js

const academicProgramService = require('../../../services/academic-program.service');
const { asyncHandler } = require('../middleware/error-handler');
const logger = require('../../../utils/logger');

class AcademicProgramController {
  /**
   * List all programs with filtering and pagination
   */
  listPrograms = asyncHandler(async (req, res) => {
    const { page, limit, ...filters } = req.query;
    const result = await academicProgramService.listPrograms(filters, { page, limit });
    res.json(result);
  });

  /**
   * Create a new program
   */
  createProgram = asyncHandler(async (req, res) => {
    const program = await academicProgramService.createProgram(req.body);
    logger.audit('Program created', {
      userId: req.user.id,
      programId: program.id
    });
    res.status(201).json(program);
  });

  /**
   * Get program by ID
   */
  getProgram = asyncHandler(async (req, res) => {
    const program = await academicProgramService.getProgram(req.params.programId);
    res.json(program);
  });

  /**
   * Update program
   */
  updateProgram = asyncHandler(async (req, res) => {
    const program = await academicProgramService.updateProgram(
      req.params.programId,
      req.body
    );
    logger.audit('Program updated', {
      userId: req.user.id,
      programId: program.id,
      updates: Object.keys(req.body)
    });
    res.json(program);
  });

  /**
   * Delete program
   */
  deleteProgram = asyncHandler(async (req, res) => {
    await academicProgramService.deleteProgram(req.params.programId);
    logger.audit('Program deleted', {
      userId: req.user.id,
      programId: req.params.programId
    });
    res.status(204).end();
  });

  /**
   * Get program statistics
   */
  getProgramStats = asyncHandler(async (req, res) => {
    const stats = await academicProgramService.getProgramStats(req.params.programId);
    res.json(stats);
  });

  /**
   * Add learning reference to program
   */
  addLearningReference = asyncHandler(async (req, res) => {
    const reference = await academicProgramService.addLearningReference(
      req.params.programId,
      req.body
    );
    logger.audit('Learning reference added to program', {
      userId: req.user.id,
      programId: req.params.programId,
      referenceId: reference.id
    });
    res.status(201).json(reference);
  });
}

module.exports = new AcademicProgramController();
