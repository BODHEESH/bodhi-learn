const mongoose = require('mongoose');
const { Schema } = mongoose;

const EnrollmentSchema = new Schema({
    learningPathId: {
        type: Schema.Types.ObjectId,
        ref: 'LearningPath',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['enrolled', 'in_progress', 'completed', 'dropped', 'expired'],
        default: 'enrolled'
    },
    progress: {
        currentStage: {
            type: Number,
            default: 0
        },
        currentMilestone: {
            type: Number,
            default: 0
        },
        completedStages: [{
            stageIndex: Number,
            completedAt: Date,
            score: Number,
            feedback: String
        }],
        completedMilestones: [{
            stageIndex: Number,
            milestoneIndex: Number,
            completedAt: Date,
            score: Number,
            attempts: Number,
            timeSpent: Number, // in minutes
            feedback: String
        }]
    },
    timeline: {
        enrolledAt: {
            type: Date,
            default: Date.now
        },
        startedAt: Date,
        lastAccessedAt: Date,
        completedAt: Date,
        deadline: Date,
        extensions: [{
            duration: Number, // in days
            reason: String,
            grantedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            grantedAt: Date
        }]
    },
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'milestone'],
                default: 'weekly'
            }
        },
        pacing: {
            type: String,
            enum: ['self_paced', 'scheduled'],
            default: 'self_paced'
        },
        reminders: {
            enabled: {
                type: Boolean,
                default: true
            },
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'custom'],
                default: 'weekly'
            },
            customDays: [Number] // 0-6 for Sunday-Saturday
        }
    },
    metrics: {
        overallProgress: {
            type: Number, // percentage
            default: 0
        },
        totalTimeSpent: {
            type: Number, // in minutes
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        skillProgress: [{
            skillName: String,
            currentLevel: String,
            progress: Number // percentage
        }],
        achievements: [{
            type: {
                type: String,
                enum: ['milestone', 'skill', 'completion', 'streak']
            },
            name: String,
            earnedAt: Date,
            details: Schema.Types.Mixed
        }]
    },
    feedback: {
        ratings: [{
            category: {
                type: String,
                enum: ['content', 'difficulty', 'engagement', 'overall']
            },
            value: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String,
            givenAt: Date
        }],
        reviews: [{
            text: String,
            rating: Number,
            givenAt: Date
        }],
        suggestions: [{
            type: {
                type: String,
                enum: ['improvement', 'bug', 'feature']
            },
            text: String,
            status: {
                type: String,
                enum: ['pending', 'reviewed', 'implemented'],
                default: 'pending'
            },
            submittedAt: Date
        }]
    },
    notes: [{
        stageIndex: Number,
        milestoneIndex: Number,
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: Date
    }],
    certificates: [{
        type: {
            type: String,
            enum: ['completion', 'achievement', 'skill']
        },
        issuedAt: Date,
        expiresAt: Date,
        certificateId: String,
        metadata: Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

// Indexes
EnrollmentSchema.index({ learningPathId: 1, userId: 1 }, { unique: true });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ 'timeline.deadline': 1 });
EnrollmentSchema.index({ 'metrics.overallProgress': 1 });

// Methods
EnrollmentSchema.methods.updateProgress = async function() {
    const learningPath = await mongoose.model('LearningPath').findById(this.learningPathId);
    if (!learningPath) return;

    const totalMilestones = learningPath.stages.reduce((total, stage) => 
        total + stage.milestones.length, 0);
    const completedMilestones = this.progress.completedMilestones.length;

    this.metrics.overallProgress = (completedMilestones / totalMilestones) * 100;
    await this.save();
};

EnrollmentSchema.methods.addAchievement = async function(achievement) {
    this.metrics.achievements.push({
        ...achievement,
        earnedAt: new Date()
    });
    await this.save();
};

EnrollmentSchema.methods.updateSkillProgress = async function(skill, progress) {
    const skillIndex = this.metrics.skillProgress.findIndex(
        s => s.skillName === skill.name
    );

    if (skillIndex === -1) {
        this.metrics.skillProgress.push({
            skillName: skill.name,
            currentLevel: skill.level,
            progress
        });
    } else {
        this.metrics.skillProgress[skillIndex].progress = progress;
        this.metrics.skillProgress[skillIndex].currentLevel = skill.level;
    }

    await this.save();
};

const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);

module.exports = Enrollment;
