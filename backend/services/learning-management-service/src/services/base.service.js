const mongoose = require('mongoose');
const { logger } = require('../config/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

class BaseService {
    constructor(model) {
        this.model = model;
        this.logger = logger;
    }

    async create(data) {
        try {
            const doc = new this.model(data);
            return await doc.save();
        } catch (error) {
            this.handleError('create', error);
        }
    }

    async findById(id, options = {}) {
        try {
            const doc = await this.model.findById(id)
                .select(options.select)
                .populate(options.populate);

            if (!doc) {
                throw new NotFoundError(`${this.model.modelName} not found`);
            }

            return doc;
        } catch (error) {
            this.handleError('findById', error);
        }
    }

    async findOne(query, options = {}) {
        try {
            const doc = await this.model.findOne(query)
                .select(options.select)
                .populate(options.populate);

            if (!doc && options.required) {
                throw new NotFoundError(`${this.model.modelName} not found`);
            }

            return doc;
        } catch (error) {
            this.handleError('findOne', error);
        }
    }

    async find(query = {}, options = {}) {
        try {
            const {
                select,
                populate,
                sort = { createdAt: -1 },
                page = 1,
                limit = 10
            } = options;

            const skip = (page - 1) * limit;

            const [docs, total] = await Promise.all([
                this.model.find(query)
                    .select(select)
                    .populate(populate)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                this.model.countDocuments(query)
            ]);

            return {
                docs,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            this.handleError('find', error);
        }
    }

    async update(id, data, options = {}) {
        try {
            const doc = await this.model.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true, ...options }
            );

            if (!doc) {
                throw new NotFoundError(`${this.model.modelName} not found`);
            }

            return doc;
        } catch (error) {
            this.handleError('update', error);
        }
    }

    async delete(id) {
        try {
            const doc = await this.model.findByIdAndDelete(id);

            if (!doc) {
                throw new NotFoundError(`${this.model.modelName} not found`);
            }

            return doc;
        } catch (error) {
            this.handleError('delete', error);
        }
    }

    async bulkCreate(dataArray) {
        try {
            return await this.model.insertMany(dataArray, { ordered: false });
        } catch (error) {
            this.handleError('bulkCreate', error);
        }
    }

    async bulkUpdate(filter, update) {
        try {
            return await this.model.updateMany(filter, update, { runValidators: true });
        } catch (error) {
            this.handleError('bulkUpdate', error);
        }
    }

    async aggregate(pipeline) {
        try {
            return await this.model.aggregate(pipeline);
        } catch (error) {
            this.handleError('aggregate', error);
        }
    }

    handleError(operation, error) {
        this.logger.error(`Error in ${this.model.modelName}.${operation}:`, error);

        if (error instanceof mongoose.Error.ValidationError) {
            throw new ValidationError(error.message);
        }

        if (error.code === 11000) {
            throw new ValidationError('Duplicate key error');
        }

        throw error;
    }

    // Utility methods
    isValidId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    async exists(query) {
        return await this.model.exists(query);
    }

    async count(query = {}) {
        return await this.model.countDocuments(query);
    }

    async distinct(field, query = {}) {
        return await this.model.distinct(field, query);
    }
}

module.exports = BaseService;
