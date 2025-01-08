const mongoose = require('mongoose');
const { toJSON } = require('../../../plugins/mongoose');

const learningPathSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurriculumItem'
    }],
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CurriculumItem'
        },
        order: Number,
        isOptional: Boolean,
        alternativeItems: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CurriculumItem'
        }]
    }],
    recommendedFor: [{
        type: String,
        enum: ['visual', 'auditory', 'reading', 'kinesthetic']
    }],
    estimatedDuration: Number
});

const skillNodeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    prerequisites: [{
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillNode'
        },
        minLevel: Number
    }],
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CurriculumItem'
        },
        weight: Number
    }],
    assessments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
    }]
});

const learnerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    curriculum: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curriculum',
        required: true
    },
    learningStyle: {
        visual: {
            type: Number,
            min: 0,
            max: 100
        },
        auditory: {
            type: Number,
            min: 0,
            max: 100
        },
        reading: {
            type: Number,
            min: 0,
            max: 100
        },
        kinesthetic: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    pacePreference: {
        type: String,
        enum: ['slow', 'moderate', 'fast'],
        default: 'moderate'
    },
    skillLevels: [{
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SkillNode'
        },
        level: Number,
        confidence: Number
    }],
    interests: [{
        topic: String,
        weight: Number
    }],
    performanceHistory: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CurriculumItem'
        },
        score: Number,
        timeSpent: Number,
        attempts: Number,
        completedAt: Date
    }],
    adaptiveRecommendations: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CurriculumItem'
        },
        reason: String,
        confidence: Number,
        timestamp: Date
    }]
});

const adaptiveSettingsSchema = new mongoose.Schema({
    curriculum: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curriculum',
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    features: {
        learningPaths: {
            type: Boolean,
            default: true
        },
        skillMapping: {
            type: Boolean,
            default: true
        },
        personalizedContent: {
            type: Boolean,
            default: true
        },
        adaptiveAssessments: {
            type: Boolean,
            default: true
        }
    },
    adaptationRules: {
        performanceThresholds: {
            low: {
                type: Number,
                default: 60
            },
            medium: {
                type: Number,
                default: 80
            }
        },
        paceAdjustment: {
            enabled: {
                type: Boolean,
                default: true
            },
            minDays: Number,
            maxDays: Number
        },
        remedialContent: {
            enabled: {
                type: Boolean,
                default: true
            },
            triggerThreshold: Number
        }
    },
    learningPaths: [learningPathSchema],
    skillNodes: [skillNodeSchema],
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Add indexes
adaptiveSettingsSchema.index({ curriculum: 1, organizationId: 1, tenantId: 1 }, { unique: true });
learnerProfileSchema.index({ user: 1, curriculum: 1 }, { unique: true });

// Add plugins
adaptiveSettingsSchema.plugin(toJSON);
learnerProfileSchema.plugin(toJSON);

// Methods
learnerProfileSchema.methods.updateSkillLevel = async function(skillId, performance) {
    const skillLevel = this.skillLevels.find(sl => sl.skill.equals(skillId));
    if (skillLevel) {
        // Update level based on performance
        const levelChange = performance >= 0.8 ? 1 : performance >= 0.6 ? 0.5 : -0.5;
        skillLevel.level = Math.min(Math.max(skillLevel.level + levelChange, 1), 10);
        skillLevel.confidence = Math.min(skillLevel.confidence + 0.1, 1.0);
    }
    await this.save();
};

learnerProfileSchema.methods.getRecommendedPath = async function() {
    // Get adaptive settings
    const adaptiveSettings = await mongoose.model('AdaptiveSettings').findOne({
        curriculum: this.curriculum
    });

    if (!adaptiveSettings || !adaptiveSettings.enabled) {
        return null;
    }

    // Find best matching learning path based on skill levels and learning style
    const paths = adaptiveSettings.learningPaths;
    let bestPath = null;
    let bestScore = -1;

    for (const path of paths) {
        let score = 0;
        
        // Match difficulty with average skill level
        const avgSkillLevel = this.skillLevels.reduce((sum, sl) => sum + sl.level, 0) / this.skillLevels.length;
        if (
            (path.difficulty === 'beginner' && avgSkillLevel <= 3) ||
            (path.difficulty === 'intermediate' && avgSkillLevel > 3 && avgSkillLevel <= 7) ||
            (path.difficulty === 'advanced' && avgSkillLevel > 7)
        ) {
            score += 2;
        }

        // Match learning style
        const dominantStyle = Object.entries(this.learningStyle)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        if (path.recommendedFor.includes(dominantStyle)) {
            score += 1;
        }

        if (score > bestScore) {
            bestScore = score;
            bestPath = path;
        }
    }

    return bestPath;
};

const AdaptiveSettings = mongoose.model('AdaptiveSettings', adaptiveSettingsSchema);
const LearnerProfile = mongoose.model('LearnerProfile', learnerProfileSchema);

module.exports = {
    AdaptiveSettings,
    LearnerProfile
};
