const mongoose = require('mongoose');
const { Schema } = mongoose;

const LearningPathSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner'
    },
    duration: {
        type: Number, // in hours
        required: true
    },
    stages: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        order: {
            type: Number,
            required: true
        },
        milestones: [{
            title: {
                type: String,
                required: true
            },
            description: String,
            type: {
                type: String,
                enum: ['course', 'quiz', 'assignment', 'project', 'assessment'],
                required: true
            },
            itemId: {
                type: Schema.Types.ObjectId,
                required: true,
                refPath: 'stages.milestones.type'
            },
            order: {
                type: Number,
                required: true
            },
            requiredToAdvance: {
                type: Boolean,
                default: true
            },
            completionCriteria: {
                type: {
                    type: String,
                    enum: ['completion', 'score', 'time'],
                    default: 'completion'
                },
                value: {
                    type: Number,
                    default: 100
                }
            },
            estimatedTime: {
                type: Number, // in minutes
                required: true
            },
            skills: [{
                name: String,
                level: {
                    type: String,
                    enum: ['basic', 'intermediate', 'advanced']
                }
            }]
        }],
        unlockCriteria: {
            type: {
                type: String,
                enum: ['previous_stage', 'specific_milestone', 'date', 'custom'],
                default: 'previous_stage'
            },
            value: Schema.Types.Mixed,
            customValidation: String // JS function as string for custom validation
        }
    }],
    prerequisites: [{
        type: {
            type: String,
            enum: ['skill', 'course', 'learning_path'],
            required: true
        },
        itemId: Schema.Types.ObjectId,
        level: String,
        required: {
            type: Boolean,
            default: true
        }
    }],
    learningObjectives: [{
        objective: {
            type: String,
            required: true
        },
        assessmentCriteria: String
    }],
    metadata: {
        tags: [String],
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'beginner'
        },
        skills: [{
            name: String,
            level: String
        }],
        industry: [String],
        certification: {
            available: {
                type: Boolean,
                default: false
            },
            provider: String,
            name: String,
            validityPeriod: Number // in months
        }
    },
    settings: {
        selfPaced: {
            type: Boolean,
            default: true
        },
        sequential: {
            type: Boolean,
            default: true
        },
        requiresApproval: {
            type: Boolean,
            default: false
        },
        allowSkipping: {
            type: Boolean,
            default: false
        },
        deadlines: {
            enabled: {
                type: Boolean,
                default: false
            },
            defaultDuration: {
                type: Number, // in days
                default: 30
            },
            gracePeriod: {
                type: Number, // in days
                default: 7
            }
        },
        progression: {
            type: String,
            enum: ['linear', 'flexible', 'adaptive'],
            default: 'linear'
        }
    },
    stats: {
        enrollments: {
            type: Number,
            default: 0
        },
        completions: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        averageCompletionTime: {
            type: Number, // in hours
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'deprecated'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'organization'],
        default: 'private'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
LearningPathSchema.index({ slug: 1 });
LearningPathSchema.index({ 'metadata.tags': 1 });
LearningPathSchema.index({ status: 1, visibility: 1 });
LearningPathSchema.index({ organization: 1 });

// Virtuals
LearningPathSchema.virtual('totalStages').get(function() {
    return this.stages.length;
});

LearningPathSchema.virtual('totalMilestones').get(function() {
    return this.stages.reduce((total, stage) => total + stage.milestones.length, 0);
});

// Pre-save middleware
LearningPathSchema.pre('save', async function(next) {
    if (!this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

const LearningPath = mongoose.model('LearningPath', LearningPathSchema);

module.exports = LearningPath;
