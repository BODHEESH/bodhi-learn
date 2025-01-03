// \d\DREAM\bodhi - learn\backend\models\mongodb\Course.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    institutionId: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    credits: Number,
    duration: {
        type: Number, // in weeks
        required: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    prerequisites: [{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }],
    learningOutcomes: [String],
    syllabus: [{
        week: Number,
        topic: String,
        description: String,
        resources: [{
            type: String,
            url: String,
            title: String
        }]
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedBy: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'courses'
});

// Indexes
courseSchema.index({ institutionId: 1, code: 1 }, { unique: true });
courseSchema.index({ name: 'text', description: 'text' });
courseSchema.index({ status: 1 });
courseSchema.index({ isDeleted: 1 });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
