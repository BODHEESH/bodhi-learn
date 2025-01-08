const mongoose = require('mongoose');
const { COURSE_STATUS, ENROLLMENT_TYPE, COURSE_LEVEL, COURSE_LANGUAGE } = require('../constants/course.constants');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true,
        maxLength: 200
    },
    thumbnail: {
        type: String,
        required: false
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coInstructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseCategory',
        required: true
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseCategory'
    }],
    duration: {
        type: Number,  // in minutes
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: Object.values(COURSE_STATUS),
        default: COURSE_STATUS.DRAFT
    },
    enrollmentType: {
        type: String,
        enum: Object.values(ENROLLMENT_TYPE),
        default: ENROLLMENT_TYPE.FREE
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    tags: [{
        type: String,
        trim: true
    }],
    level: {
        type: String,
        enum: Object.values(COURSE_LEVEL),
        required: true
    },
    languages: [{
        type: String,
        enum: Object.values(COURSE_LANGUAGE),
        required: true
    }],
    rating: {
        averageScore: {
            type: Number,
            default: 0
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        distribution: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        }
    },
    learningObjectives: [{
        type: String,
        trim: true
    }],
    targetAudience: [{
        type: String,
        trim: true
    }],
    skills: [{
        type: String,
        trim: true
    }],
    certification: {
        enabled: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: ['completion', 'achievement', 'professional'],
            default: 'completion'
        },
        validityPeriod: Number, // in months
        template: String
    },
    schedule: {
        enrollmentStart: Date,
        enrollmentEnd: Date,
        courseStart: Date,
        courseEnd: Date,
        isFlexible: {
            type: Boolean,
            default: true
        },
        maxDuration: Number, // in days
        batchSize: Number
    },
    settings: {
        allowReview: {
            type: Boolean,
            default: true
        },
        allowDiscussion: {
            type: Boolean,
            default: true
        },
        allowCertificate: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        showProgress: {
            type: Boolean,
            default: true
        },
        allowRefund: {
            type: Boolean,
            default: false
        },
        refundPeriod: Number // in days
    },
    stats: {
        totalEnrollments: {
            type: Number,
            default: 0
        },
        activeEnrollments: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        },
        averageCompletionTime: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        }
    },
    resources: [{
        title: String,
        type: String,
        url: String,
        isRequired: Boolean
    }],
    faqs: [{
        question: String,
        answer: String
    }],
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes
courseSchema.index({ title: 'text', description: 'text', shortDescription: 'text', tags: 'text' });
courseSchema.index({ organizationId: 1, tenantId: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ languages: 1 });
courseSchema.index({ 'schedule.enrollmentStart': 1, 'schedule.enrollmentEnd': 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ 'stats.totalEnrollments': -1 });
courseSchema.index({ 'rating.averageScore': -1 });

// Virtual for curriculum
courseSchema.virtual('curriculum', {
    ref: 'Curriculum',
    localField: '_id',
    foreignField: 'course',
    justOne: true
});

// Virtual for enrollments
courseSchema.virtual('enrollments', {
    ref: 'Enrollment',
    localField: '_id',
    foreignField: 'course'
});

// Methods
courseSchema.methods.isEnrollmentOpen = function() {
    if (this.status !== COURSE_STATUS.PUBLISHED) {
        return false;
    }

    const now = new Date();
    if (this.schedule.enrollmentStart && now < this.schedule.enrollmentStart) {
        return false;
    }

    if (this.schedule.enrollmentEnd && now > this.schedule.enrollmentEnd) {
        return false;
    }

    if (this.schedule.batchSize && this.stats.activeEnrollments >= this.schedule.batchSize) {
        return false;
    }

    return true;
};

courseSchema.methods.updateStats = async function() {
    const enrollments = await mongoose.model('Enrollment').find({ course: this._id });
    
    this.stats.totalEnrollments = enrollments.length;
    this.stats.activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    
    const completed = enrollments.filter(e => e.status === 'completed');
    this.stats.completionRate = completed.length / enrollments.length * 100;
    
    if (completed.length > 0) {
        const totalTime = completed.reduce((sum, e) => sum + e.completionTime, 0);
        this.stats.averageCompletionTime = totalTime / completed.length;
    }
    
    const revenue = enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    this.stats.totalRevenue = revenue;
    
    await this.save();
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;