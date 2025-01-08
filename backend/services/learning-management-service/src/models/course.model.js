const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseVersionSchema = new Schema({
    version: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    objectives: [{
        type: String,
        required: true
    }],
    content: [{
        type: Schema.Types.ObjectId,
        ref: 'Content'
    }],
    requirements: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['draft', 'review', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

const courseTemplateSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    structure: {
        sections: [{
            title: String,
            description: String,
            contentTypes: [String]
        }]
    },
    settings: {
        type: Map,
        of: Schema.Types.Mixed
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

const courseSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    currentVersion: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    template: {
        type: Schema.Types.ObjectId,
        ref: 'CourseTemplate'
    },
    instructors: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    versions: [courseVersionSchema],
    settings: {
        enrollment: {
            type: String,
            enum: ['open', 'invite', 'approval'],
            default: 'open'
        },
        maxStudents: Number,
        startDate: Date,
        endDate: Date,
        isTemplate: {
            type: Boolean,
            default: false
        }
    },
    analytics: {
        totalEnrollments: {
            type: Number,
            default: 0
        },
        activeStudents: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        engagementMetrics: {
            type: Map,
            of: Number
        }
    },
    metadata: {
        tags: [String],
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            required: true
        },
        estimatedDuration: Number,
        skillsGained: [String]
    },
    workflow: {
        currentStage: {
            type: String,
            enum: ['planning', 'development', 'review', 'published'],
            default: 'planning'
        },
        stages: [{
            name: String,
            status: {
                type: String,
                enum: ['pending', 'inProgress', 'completed']
            },
            assignedTo: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            startDate: Date,
            endDate: Date,
            comments: [{
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User'
                },
                text: String,
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }]
        }]
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// Indexes
courseSchema.index({ code: 1 });
courseSchema.index({ 'versions.status': 1 });
courseSchema.index({ 'metadata.tags': 1 });
courseSchema.index({ 'workflow.currentStage': 1 });
courseSchema.index({ category: 1 });

// Pre-save middleware
courseSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Methods
courseSchema.methods.createVersion = async function(versionData) {
    this.versions.push({
        ...versionData,
        version: `${this.versions.length + 1}.0.0`
    });
    this.currentVersion = this.versions[this.versions.length - 1].version;
    return this.save();
};

courseSchema.methods.publishVersion = async function(version) {
    const versionDoc = this.versions.find(v => v.version === version);
    if (versionDoc) {
        versionDoc.status = 'published';
        versionDoc.publishedAt = new Date();
        return this.save();
    }
    throw new Error('Version not found');
};

courseSchema.methods.updateAnalytics = async function(metrics) {
    this.analytics = {
        ...this.analytics,
        ...metrics
    };
    return this.save();
};

// Static methods
courseSchema.statics.createFromTemplate = async function(templateId, courseData) {
    const template = await mongoose.model('CourseTemplate').findById(templateId);
    if (!template) throw new Error('Template not found');

    return this.create({
        ...courseData,
        template: templateId,
        settings: {
            ...template.settings,
            ...courseData.settings
        }
    });
};

const Course = mongoose.model('Course', courseSchema);
const CourseTemplate = mongoose.model('CourseTemplate', courseTemplateSchema);

module.exports = {
    Course,
    CourseTemplate
};
