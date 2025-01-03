// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\base.service.js

const { NotFoundError, ValidationError } = require('../utils/errors');

class BaseService {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  async findById(id, options = {}) {
    const item = await this.model.findByPk(id, options);
    if (!item) {
      throw new NotFoundError(`${this.modelName} not found`);
    }
    return item;
  }

  async findOne(query, options = {}) {
    const item = await this.model.findOne({ where: query, ...options });
    if (!item) {
      throw new NotFoundError(`${this.modelName} not found`);
    }
    return item;
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 10, order = [['createdAt', 'DESC']], ...filterOptions } = options;

    const offset = (page - 1) * limit;
    const items = await this.model.findAndCountAll({
      where: query,
      limit,
      offset,
      order,
      ...filterOptions
    });

    return {
      items: items.rows,
      total: items.count,
      page: parseInt(page),
      totalPages: Math.ceil(items.count / limit)
    };
  }

  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError('Duplicate entry found');
      }
      throw error;
    }
  }

  async update(id, data) {
    const item = await this.findById(id);
    try {
      await item.update(data);
      return item;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError('Duplicate entry found');
      }
      throw error;
    }
  }

  async delete(id) {
    const item = await this.findById(id);
    await item.destroy();
    return true;
  }

  async restore(id) {
    const restored = await this.model.restore(id);
    if (!restored) {
      throw new NotFoundError(`${this.modelName} not found or already restored`);
    }
    return this.findById(id);
  }

  // Utility methods for transaction handling
  async withTransaction(callback) {
    const transaction = await this.model.sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = BaseService;
