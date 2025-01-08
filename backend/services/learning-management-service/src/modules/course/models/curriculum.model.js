const mongoose = require('mongoose');
const { toJSON } = require('../../../plugins/mongoose');
const { CURRICULUM_STATUS, CURRICULUM_ITEM_TYPE } = require('../constants/curriculum.constants');

const curriculumItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: Object.values(CURRICULUM_ITEM_TYPE),
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    order: {
        type: Number,
        default: 0
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    isRequired: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: Object.values(CURRICULUM_STATUS),
        default: CURRICULUM_STATUS.DRAFT
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurriculumItem'
    }],
    completionCriteria: {
        minScore: {
            type: Number,
            min: 0,
            max: 100
        },
        minTimeSpent: {
            type: Number,
            min: 0
        },
        requiredActivities: [{
            type: String,
            enum: ['watch', 'read', 'submit', 'participate']
        }]
    },
    metadata: {
        videoUrl: String,
        documentUrl: String,
        quizId: mongoose.Schema.Types.ObjectId,
        assignmentId: mongoose.Schema.Types.ObjectId,
        liveSessionUrl: String,
        startTime: Date,
        endTime: Date
    },
    resources: [{
        title: String,
        type: String,
        url: String,
        isRequired: Boolean
    }],
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const curriculumSectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        default: 0
    },
    learningObjectives: [{
        type: String,
        trim: true
    }],
    completionCriteria: {
        requiredItems: {
            type: Number,
            min: 0
        },
        requiredScore: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    items: [curriculumItemSchema],
    status: {
        type: String,
        enum: Object.values(CURRICULUM_STATUS),
        default: CURRICULUM_STATUS.DRAFT
    },
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const curriculumSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        version: {
            type: Number,
            default: 1
        },
        sections: [curriculumSectionSchema],
        totalDuration: {
            type: Number,
            default: 0
        },
        itemsCount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: Object.values(CURRICULUM_STATUS),
            default: CURRICULUM_STATUS.DRAFT
        },
        completionCriteria: {
            requiredSections: {
                type: Number,
                min: 0
            },
            minTotalScore: {
                type: Number,
                min: 0,
                max: 100
            },
            minCompletionPercentage: {
                type: Number,
                min: 0,
                max: 100,
                default: 80
            }
        },
        schedule: {
            releaseDate: Date,
            enrollmentEndDate: Date,
            completionDeadline: Date,
            isSequential: {
                type: Boolean,
                default: false
            },
            itemReleaseInterval: {
                type: Number,
                default: 0 // in days, 0 means all items available at once
            }
        },
        settings: {
            allowSkip: {
                type: Boolean,
                default: false
            },
            showProgress: {
                type: Boolean,
                default: true
            },
            enableDiscussions: {
                type: Boolean,
                default: true
            },
            enablePeerReview: {
                type: Boolean,
                default: false
            },
            enableCertificates: {
                type: Boolean,
                default: true
            }
        },
        metadata: {
            keywords: [String],
            difficulty: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced']
            },
            estimatedCompletionTime: Number, // in hours
            languages: [String]
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
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
        instructors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        reviewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    {
        timestamps: true
    }
);

// Add indexes
curriculumSchema.index({ course: 1, organizationId: 1, tenantId: 1 }, { unique: true });
curriculumSchema.index({ status: 1 });
curriculumSchema.index({ 'schedule.releaseDate': 1 });

// Add plugins
curriculumSchema.plugin(toJSON);

// Add middleware to update totalDuration and itemsCount
curriculumSchema.pre('save', function(next) {
    let totalDuration = 0;
    let itemsCount = 0;

    this.sections.forEach(section => {
        section.duration = 0;
        section.items.forEach(item => {
            totalDuration += item.duration || 0;
            section.duration += item.duration || 0;
            itemsCount += 1;
        });
    });

    this.totalDuration = totalDuration;
    this.itemsCount = itemsCount;
    next();
});

// Add method to check if curriculum is available
curriculumSchema.methods.isAvailable = function() {
    if (this.status !== CURRICULUM_STATUS.PUBLISHED) {
        return false;
    }

    const now = new Date();
    if (this.schedule.releaseDate && now < this.schedule.releaseDate) {
        return false;
    }

    if (this.schedule.enrollmentEndDate && now > this.schedule.enrollmentEndDate) {
        return false;
    }

    return true;
};

// Add method to get available items based on schedule
curriculumSchema.methods.getAvailableItems = function(enrollmentDate) {
    if (!this.schedule.isSequential || !this.schedule.itemReleaseInterval) {
        return this.sections.reduce((items, section) => {
            return items.concat(section.items);
        }, []);
    }

    const now = new Date();
    const daysSinceEnrollment = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));
    const availableItemCount = Math.floor(daysSinceEnrollment / this.schedule.itemReleaseInterval);

    let itemCounter = 0;
    const availableItems = [];

    for (const section of this.sections) {
        for (const item of section.items) {
            if (itemCounter < availableItemCount) {
                availableItems.push(item);
            }
            itemCounter++;
        }
    }

    return availableItems;
};

const Curriculum = mongoose.model('Curriculum', curriculumSchema);

module.exports = {
    Curriculum,
    curriculumSchema
};
