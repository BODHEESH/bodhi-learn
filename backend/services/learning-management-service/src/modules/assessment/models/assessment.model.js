const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema({
    type: {
        type: String,
        enum: [
            'multiple-choice', 
            'true-false', 
            'essay', 
            'coding',
            'matching', 
            'fill-blank',
            'sequence',           // New: Order items in correct sequence
            'hotspot',           // New: Click correct areas in an image
            'drag-drop',         // New: Drag items to correct zones
            'audio-response',    // New: Record audio answer
            'math-equation',     // New: Mathematical equation input
            'diagram-label',     // New: Label parts of a diagram
            'case-study',        // New: Multi-part questions based on a case
            'peer-review'        // New: Peer assessment questions
        ],
        required: true
    },
    content: {
        question: {
            type: String,
            required: true
        },
        options: [{
            id: String,
            text: String,
            isCorrect: Boolean,
            feedback: String,    // New: Specific feedback for each option
            media: {            // New: Media support for options
                type: String,
                url: String
            }
        }],
        correctAnswer: Schema.Types.Mixed,
        explanation: String,
        media: [{              // New: Enhanced media support
            type: {
                type: String,
                enum: ['image', 'video', 'audio', 'document']
            },
            url: String,
            caption: String,
            timestamp: Number,  // For video/audio segments
            hotspots: [{       // For hotspot questions
                x: Number,
                y: Number,
                radius: Number,
                feedback: String
            }],
            zones: [{          // For drag-drop questions
                id: String,
                x: Number,
                y: Number,
                width: Number,
                height: Number
            }]
        }],
        hints: [{             // New: Progressive hints
            text: String,
            pointDeduction: Number
        }]
    },
    metadata: {
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            required: true
        },
        tags: [String],
        skills: [String],
        bloomsLevel: {
            type: String,
            enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
        },
        cognitiveLoad: {     // New: Cognitive load tracking
            type: String,
            enum: ['low', 'medium', 'high']
        },
        estimatedTime: Number,
        language: String,
        accessibility: {     // New: Accessibility features
            audioDescription: Boolean,
            screenReader: Boolean,
            keyboardNavigation: Boolean
        }
    },
    scoring: {
        points: {
            type: Number,
            required: true,
            default: 1
        },
        partialCredit: Boolean,
        rubric: [{
            criterion: String,
            points: Number,
            description: String,
            levels: [{        // New: Detailed rubric levels
                level: String,
                points: Number,
                description: String
            }]
        }],
        autoGrading: {      // New: Auto-grading settings
            enabled: Boolean,
            method: String,
            tolerance: Number,
            caseSensitive: Boolean
        },
        peerReview: {       // New: Peer review settings
            enabled: Boolean,
            minReviewers: Number,
            rubric: [{
                criterion: String,
                weight: Number
            }]
        }
    },
    settings: {
        timeLimit: Number,
        attempts: Number,
        shuffleOptions: Boolean,
        progressiveScoring: {  // New: Progressive scoring
            enabled: Boolean,
            initialPoints: Number,
            deductionPerAttempt: Number
        },
        hintSettings: {       // New: Hint settings
            enabled: Boolean,
            maxHints: Number,
            pointDeduction: Number
        },
        feedback: {           // New: Enhanced feedback settings
            timing: String,
            type: String,
            customization: {
                correct: String,
                incorrect: String,
                partial: String
            }
        }
    },
    stats: {
        timesUsed: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        difficultyIndex: {
            type: Number,
            default: 0
        },
        discriminationIndex: {
            type: Number,
            default: 0
        },
        reliability: {        // New: Reliability metrics
            cronbachAlpha: Number,
            itemTotalCorrelation: Number
        },
        engagement: {         // New: Engagement metrics
            averageAttempts: Number,
            averageTimeSpent: Number,
            hintUsage: Number
        },
        errorPatterns: [{     // New: Common error patterns
            pattern: String,
            frequency: Number,
            description: String
        }]
    }
});

const assessmentSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['quiz', 'exam', 'practice', 'survey'],
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    questions: [questionSchema],
    settings: {
        timeLimit: Number,
        passingScore: Number,
        maxAttempts: Number,
        shuffleQuestions: Boolean,
        showResults: {
            type: String,
            enum: ['immediately', 'after_submission', 'after_due_date', 'never'],
            default: 'immediately'
        },
        dueDate: Date,
        gradingType: {
            type: String,
            enum: ['automatic', 'manual', 'hybrid'],
            default: 'automatic'
        }
    },
    metadata: {
        totalPoints: Number,
        estimatedDuration: Number,
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard']
        },
        tags: [String],
        skills: [String]
    },
    stats: {
        attempts: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        },
        timeSpentAvg: Number
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
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
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    realtime: {              // New: Real-time features
        enabled: Boolean,
        settings: {
            showParticipants: Boolean,
            showProgress: Boolean,
            showLeaderboard: Boolean,
            collaborative: Boolean
        },
        currentParticipants: [{
            userId: Schema.Types.ObjectId,
            status: String,
            progress: Number,
            lastActive: Date
        }],
        analytics: {
            participationRate: Number,
            averageCompletionTime: Number,
            dropoffPoints: [{
                question: Number,
                count: Number
            }]
        }
    },
    adaptiveLogic: {         // New: Adaptive assessment
        enabled: Boolean,
        algorithm: String,
        difficultyAdjustment: {
            initial: String,
            step: Number,
            max: Number,
            min: Number
        },
        terminationCriteria: {
            maxQuestions: Number,
            confidenceLevel: Number,
            precisionLevel: Number
        }
    },
    analytics: {             // New: Enhanced analytics
        performance: {
            averageScore: Number,
            standardDeviation: Number,
            percentiles: {
                25: Number,
                50: Number,
                75: Number
            },
            skillGaps: [{
                skill: String,
                gap: Number
            }]
        },
        engagement: {
            completionRate: Number,
            averageAttempts: Number,
            timeDistribution: {
                fast: Number,
                average: Number,
                slow: Number
            }
        },
        feedback: {
            sentiment: {
                positive: Number,
                neutral: Number,
                negative: Number
            },
            commonIssues: [{
                issue: String,
                frequency: Number
            }]
        },
        accessibility: {
            assistiveTechnologyUsage: Number,
            accommodationRequests: Number
        }
    }
});

const submissionSchema = new Schema({
    assessmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: Schema.Types.ObjectId,
        answer: Schema.Types.Mixed,
        score: Number,
        feedback: String,
        timeSpent: Number
    }],
    status: {
        type: String,
        enum: ['in_progress', 'submitted', 'graded'],
        default: 'in_progress'
    },
    score: {
        total: Number,
        percentage: Number,
        passing: Boolean
    },
    metadata: {
        startTime: Date,
        endTime: Date,
        timeSpent: Number,
        attempt: Number,
        ipAddress: String,
        userAgent: String
    },
    feedback: {
        comments: String,
        gradedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// Indexes
assessmentSchema.index({ courseId: 1, status: 1 });
assessmentSchema.index({ 'metadata.tags': 1 });
assessmentSchema.index({ createdAt: -1 });

submissionSchema.index({ assessmentId: 1, userId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ createdAt: -1 });

// Pre-save middleware
assessmentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    if (this.isModified('questions')) {
        this.metadata.totalPoints = this.questions.reduce(
            (total, q) => total + q.scoring.points,
            0
        );
    }
    next();
});

submissionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Assessment = mongoose.model('Assessment', assessmentSchema);
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = {
    Assessment,
    Submission
};
