const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuizSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    moduleId: {
        type: Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    assessmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    settings: {
        timeLimit: {
            type: Number, // in minutes
            default: 30
        },
        attemptsAllowed: {
            type: Number,
            default: 1
        },
        passingScore: {
            type: Number,
            default: 60
        },
        shuffleQuestions: {
            type: Boolean,
            default: true
        },
        showResults: {
            type: Boolean,
            default: true
        },
        showFeedback: {
            type: Boolean,
            default: true
        },
        requireLockdown: {
            type: Boolean,
            default: false
        },
        gradingType: {
            type: String,
            enum: ['automatic', 'manual', 'hybrid'],
            default: 'automatic'
        }
    },
    schedule: {
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        lateSubmission: {
            allowed: {
                type: Boolean,
                default: false
            },
            deadline: {
                type: Date
            },
            penalty: {
                type: Number, // percentage deduction
                default: 0
            }
        }
    },
    prerequisites: [{
        type: {
            type: String,
            enum: ['quiz', 'module', 'assignment'],
            required: true
        },
        id: {
            type: Schema.Types.ObjectId,
            required: true
        },
        minimumScore: {
            type: Number,
            default: 0
        }
    }],
    metadata: {
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        },
        estimatedDuration: {
            type: Number, // in minutes
            default: 30
        },
        tags: [{
            type: String,
            trim: true
        }],
        skills: [{
            type: String,
            trim: true
        }]
    },
    stats: {
        attempts: {
            type: Number,
            default: 0
        },
        completions: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        passRate: {
            type: Number,
            default: 0
        },
        averageTime: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'scheduled'],
        default: 'draft'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for getting total questions
QuizSchema.virtual('totalQuestions').get(function() {
    return this.assessmentId ? this.assessmentId.questions.length : 0;
});

// Virtual for getting total points
QuizSchema.virtual('totalPoints').get(function() {
    if (!this.assessmentId) return 0;
    return this.assessmentId.questions.reduce((total, q) => total + (q.points || 0), 0);
});

// Middleware to update stats after save
QuizSchema.post('save', async function(doc) {
    const Submission = mongoose.model('Submission');
    const submissions = await Submission.find({ quizId: doc._id });

    if (submissions.length > 0) {
        const stats = {
            attempts: submissions.length,
            completions: submissions.filter(s => s.status === 'completed').length,
            averageScore: submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length,
            passRate: (submissions.filter(s => s.passed).length / submissions.length) * 100,
            averageTime: submissions.reduce((acc, s) => acc + (s.duration || 0), 0) / submissions.length
        };

        await mongoose.model('Quiz').findByIdAndUpdate(doc._id, { stats });
    }
});

// Index for efficient querying
QuizSchema.index({ courseId: 1, moduleId: 1 });
QuizSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
QuizSchema.index({ status: 1 });
QuizSchema.index({ 'metadata.tags': 1 });
QuizSchema.index({ 'metadata.skills': 1 });

const Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = Quiz;
