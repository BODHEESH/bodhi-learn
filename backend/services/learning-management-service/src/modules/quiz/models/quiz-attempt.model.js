const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuizAttemptSchema = new Schema({
    quizId: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    timeLimit: {
        type: Number, // in minutes
        required: true
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'graded', 'timed_out'],
        default: 'in_progress'
    },
    questions: [{
        _id: Schema.Types.ObjectId,
        type: String,
        content: Schema.Types.Mixed,
        points: Number,
        options: [Schema.Types.Mixed]
    }],
    answers: [{
        questionId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        response: Schema.Types.Mixed,
        timeSpent: Number, // in seconds
        confidence: {
            type: String,
            enum: ['high', 'medium', 'low']
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    passed: {
        type: Boolean,
        default: false
    },
    feedback: [{
        questionId: Schema.Types.ObjectId,
        correct: Boolean,
        explanation: String,
        points: Number,
        suggestions: [String]
    }],
    metadata: {
        browser: String,
        os: String,
        ipAddress: String,
        userAgent: String,
        tabSwitches: {
            type: Number,
            default: 0
        },
        timeouts: {
            type: Number,
            default: 0
        }
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
QuizAttemptSchema.index({ quizId: 1, userId: 1 });
QuizAttemptSchema.index({ status: 1 });
QuizAttemptSchema.index({ startTime: 1 });

// Virtual for duration
QuizAttemptSchema.virtual('duration').get(function() {
    if (!this.endTime) return 0;
    return this.endTime - this.startTime;
});

// Virtual for remaining time
QuizAttemptSchema.virtual('remainingTime').get(function() {
    if (this.status !== 'in_progress') return 0;
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // in minutes
    return Math.max(0, this.timeLimit - elapsed);
});

// Methods
QuizAttemptSchema.methods.isTimeExpired = function() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // in minutes
    return elapsed >= this.timeLimit;
};

QuizAttemptSchema.methods.calculateScore = function() {
    if (!this.answers || !this.questions) return 0;
    
    let totalScore = 0;
    this.answers.forEach(answer => {
        const feedback = this.feedback.find(f => 
            f.questionId.toString() === answer.questionId.toString()
        );
        if (feedback && feedback.correct) {
            const question = this.questions.find(q => 
                q._id.toString() === answer.questionId.toString()
            );
            totalScore += question ? question.points : 0;
        }
    });
    return totalScore;
};

const QuizAttempt = mongoose.model('QuizAttempt', QuizAttemptSchema);

module.exports = QuizAttempt;
