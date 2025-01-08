const mongoose = require('mongoose');
const { toJSON } = require('../../../plugins/mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['completion', 'streak', 'score', 'time', 'engagement', 'custom'],
        required: true
    },
    icon: String,
    points: {
        type: Number,
        required: true,
        default: 0
    },
    criteria: {
        itemCount: Number,
        streakDays: Number,
        minScore: Number,
        maxTime: Number,
        customRule: String
    },
    level: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    isHidden: {
        type: Boolean,
        default: false
    }
});

const rewardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['badge', 'certificate', 'points', 'unlock', 'custom'],
        required: true
    },
    icon: String,
    value: {
        points: Number,
        badge: String,
        certificateTemplate: String,
        unlockedContent: mongoose.Schema.Types.ObjectId,
        customData: Object
    },
    expiryDays: Number
});

const levelSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    icon: String,
    pointsRequired: {
        type: Number,
        required: true
    },
    rewards: [rewardSchema],
    unlockContent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurriculumItem'
    }]
});

const userProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentLevel: {
        type: Number,
        default: 1
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    achievements: [{
        achievement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Achievement'
        },
        earnedAt: Date,
        progress: Number
    }],
    rewards: [{
        reward: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reward'
        },
        earnedAt: Date,
        expiresAt: Date,
        isRedeemed: Boolean,
        redeemedAt: Date
    }],
    streaks: {
        current: {
            type: Number,
            default: 0
        },
        longest: {
            type: Number,
            default: 0
        },
        lastActivityDate: Date
    },
    weeklyProgress: [{
        week: Date,
        pointsEarned: Number,
        activeDays: Number,
        completedItems: Number
    }],
    leaderboardRank: {
        overall: Number,
        weekly: Number,
        monthly: Number
    }
});

const gamificationSettingsSchema = new mongoose.Schema({
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
        achievements: {
            type: Boolean,
            default: true
        },
        levels: {
            type: Boolean,
            default: true
        },
        leaderboard: {
            type: Boolean,
            default: true
        },
        rewards: {
            type: Boolean,
            default: true
        },
        streaks: {
            type: Boolean,
            default: true
        }
    },
    pointsSystem: {
        itemCompletion: {
            type: Number,
            default: 10
        },
        perfectScore: {
            type: Number,
            default: 50
        },
        dailyStreak: {
            type: Number,
            default: 5
        },
        engagement: {
            type: Number,
            default: 2
        },
        bonusChallenge: {
            type: Number,
            default: 20
        }
    },
    levels: [levelSchema],
    achievements: [achievementSchema],
    leaderboard: {
        enabled: {
            type: Boolean,
            default: true
        },
        displayTop: {
            type: Number,
            default: 10
        },
        resetPeriod: {
            type: String,
            enum: ['never', 'daily', 'weekly', 'monthly'],
            default: 'weekly'
        },
        categories: [{
            name: String,
            metric: {
                type: String,
                enum: ['points', 'progress', 'time', 'score']
            }
        }]
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
    }
}, {
    timestamps: true
});

// Add indexes
gamificationSettingsSchema.index({ curriculum: 1, organizationId: 1, tenantId: 1 }, { unique: true });
userProgressSchema.index({ user: 1, curriculum: 1 }, { unique: true });

// Add plugins
gamificationSettingsSchema.plugin(toJSON);
userProgressSchema.plugin(toJSON);

const GamificationSettings = mongoose.model('GamificationSettings', gamificationSettingsSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = {
    GamificationSettings,
    UserProgress
};
