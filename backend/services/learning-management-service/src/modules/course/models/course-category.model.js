const mongoose = require('mongoose');
const { CATEGORY_STATUS } = require('../constants/course.constants');

const courseCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseCategory',
        default: null
    },
    icon: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: Object.values(CATEGORY_STATUS),
        default: CATEGORY_STATUS.ACTIVE
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes
courseCategorySchema.index({ name: 'text' });
courseCategorySchema.index({ organizationId: 1, tenantId: 1 });
courseCategorySchema.index({ parentCategory: 1 });
courseCategorySchema.index({ status: 1 });

const CourseCategory = mongoose.model('CourseCategory', courseCategorySchema);

module.exports = CourseCategory;