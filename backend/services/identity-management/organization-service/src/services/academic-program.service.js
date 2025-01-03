// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\services\academic-program.service.js

const { Op } = require('sequelize');
const { withTransaction } = require('../database/connection');
const AcademicProgram = require('../models/academic-program.model');
const ProgramLearningReference = require('../models/program-learning-reference.model');
const { ValidationError, NotFoundError } = require('../utils/errors/custom-error');
const logger = require('../utils/logger');
const learningManagementService = require('../integrations/learning-management.service');

class AcademicProgramService {
  /**
   * Create a new academic program
   */
  async createProgram(programData, transaction = null) {
    const program = await withTransaction(async (t) => {
      // Create program in organization service
      const newProgram = await AcademicProgram.create(programData, {
        transaction: t || transaction
      });

      // Create program in learning management service
      const learningProgram = await learningManagementService.createProgram({
        organizationProgramId: newProgram.id,
        ...programData
      });

      // Update the learning management reference
      await newProgram.update({
        learningManagementId: learningProgram.id
      }, {
        transaction: t || transaction
      });

      logger.info('Created new academic program', {
        programId: newProgram.id,
        learningManagementId: learningProgram.id
      });

      return newProgram;
    });

    return program;
  }

  /**
   * Update an existing academic program
   */
  async updateProgram(programId, updateData, transaction = null) {
    const program = await this.getProgram(programId);

    const updatedProgram = await withTransaction(async (t) => {
      // Update program in organization service
      await program.update(updateData, {
        transaction: t || transaction
      });

      // Update program in learning management service
      await learningManagementService.updateProgram(program.learningManagementId, updateData);

      logger.info('Updated academic program', {
        programId: program.id,
        updates: Object.keys(updateData)
      });

      return program;
    });

    return updatedProgram;
  }

  /**
   * Get a single academic program by ID
   */
  async getProgram(programId, includeRelations = true) {
    const include = includeRelations ? [
      {
        model: ProgramLearningReference,
        as: 'learningReferences'
      }
    ] : [];

    const program = await AcademicProgram.findByPk(programId, { include });

    if (!program) {
      throw new NotFoundError('Academic program not found');
    }

    return program;
  }

  /**
   * List academic programs with filtering and pagination
   */
  async listPrograms(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const where = {};

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { code: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { rows: programs, count } = await AcademicProgram.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ProgramLearningReference,
          as: 'learningReferences'
        }
      ]
    });

    return {
      programs,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Delete an academic program
   */
  async deleteProgram(programId, transaction = null) {
    const program = await this.getProgram(programId);

    await withTransaction(async (t) => {
      // Delete program from learning management service
      await learningManagementService.deleteProgram(program.learningManagementId);

      // Delete program from organization service
      await program.destroy({
        transaction: t || transaction
      });

      logger.info('Deleted academic program', {
        programId: program.id
      });
    });

    return true;
  }

  /**
   * Add learning reference to program
   */
  async addLearningReference(programId, referenceData, transaction = null) {
    const program = await this.getProgram(programId);

    const reference = await withTransaction(async (t) => {
      const newReference = await ProgramLearningReference.create({
        ...referenceData,
        programId: program.id
      }, {
        transaction: t || transaction
      });

      logger.info('Added learning reference to program', {
        programId: program.id,
        referenceId: newReference.id
      });

      return newReference;
    });

    return reference;
  }

  /**
   * Get program statistics
   */
  async getProgramStats(programId) {
    const program = await this.getProgram(programId, true);

    // Get stats from learning management service
    const learningStats = await learningManagementService.getProgramStats(program.learningManagementId);

    const stats = {
      totalReferences: await ProgramLearningReference.count({ 
        where: { programId } 
      }),
      referencesByType: await ProgramLearningReference.count({
        where: { programId },
        group: ['type']
      }),
      // Include learning management stats
      ...learningStats
    };

    return stats;
  }
}

module.exports = new AcademicProgramService();
