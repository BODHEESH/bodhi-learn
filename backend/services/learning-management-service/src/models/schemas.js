const mongoose = require('mongoose');
const { Schema } = mongoose;
const notificationClient = require('../utils/notificationClient');
const moderationClient = require('../utils/moderationClient');
const {
    validators,
    courseValidators,
    contentValidators,
    mentorshipValidators,
    challengeValidators,
    studySessionValidators
} = require('./validators');

// Schema plugins for common functionality
const timestampPlugin = (schema) => {
    schema.add({
        createdAt: { type: Date, default: Date.now, index: true },
        updatedAt: { type: Date, default: Date.now, index: true }
    });

    schema.pre('save', function(next) {
        this.updatedAt = new Date();
        next();
    });
};

const auditPlugin = (schema) => {
    schema.add({
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        version: { type: Number, default: 1 },
        changeHistory: [{
            modifiedAt: Date,
            modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            changes: Schema.Types.Mixed
        }]
    });
};

const moderationPlugin = (schema) => {
    schema.add({
        moderationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true
        },
        moderationDetails: {
            moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            moderatedAt: Date,
            reason: String,
            score: Number
        }
    });

    schema.pre('save', async function(next) {
        if (this.isModified('content')) {
            try {
                const result = await moderationClient.checkContent({
                    text: this.content,
                    type: this.constructor.modelName.toLowerCase()
                });
                this.moderationStatus = result.approved ? 'approved' : 'pending';
                this.moderationDetails = {
                    moderatedAt: new Date(),
                    score: result.score
                };
            } catch (error) {
                console.error('Moderation check failed:', error);
            }
        }
        next();
    });
};

// Common schemas that can be reused
const MediaSchema = new Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'document', 'audio'],
        required: true,
        index: true
    },
    url: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^(http|https):\/\/[^ "]+$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    thumbnailUrl: String,
    mimeType: {
        type: String,
        required: true,
        index: true
    },
    size: {
        type: Number,
        min: 0,
        required: true
    },
    duration: Number,
    resolution: {
        width: Number,
        height: Number
    },
    encoding: String,
    status: {
        type: String,
        enum: ['processing', 'ready', 'failed'],
        default: 'processing',
        index: true
    },
    metadata: Schema.Types.Mixed
});

const CommentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    mentions: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    attachments: [MediaSchema],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Course Module Schemas
const CourseSchema = new Schema({
    title: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    thumbnail: MediaSchema,
    instructors: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    modules: [{
        type: Schema.Types.ObjectId,
        ref: 'Module'
    }],
    prerequisites: [{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }],
    skills: [{
        type: Schema.Types.ObjectId,
        ref: 'Skill'
    }],
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    duration: Number, // in minutes
    enrollmentCount: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    tags: [String],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    price: {
        amount: Number,
        currency: String
    },
    metadata: Schema.Types.Mixed,
    curriculum: {
        learningObjectives: [String],
        targetAudience: [String],
        prerequisites: {
            courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
            skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
            description: String
        },
        certification: {
            available: Boolean,
            type: String,
            validityPeriod: Number
        }
    },
    schedule: {
        startDate: Date,
        endDate: Date,
        enrollmentDeadline: Date,
        sessionSchedule: [{
            day: String,
            startTime: String,
            endTime: String,
            timeZone: String
        }]
    },
    pricing: {
        amount: {
            type: Number,
            min: 0
        },
        currency: {
            type: String,
            enum: ['USD', 'EUR', 'INR']
        },
        discounts: [{
            code: String,
            percentage: Number,
            validUntil: Date
        }]
    },
    engagement: {
        totalEnrollments: { type: Number, default: 0 },
        activeStudents: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        reviews: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            rating: Number,
            review: String,
            createdAt: Date
        }]
    }
}, { timestamps: true });

CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ 'pricing.amount': 1, 'schedule.startDate': 1 });
CourseSchema.index({ 'engagement.averageRating': -1 });

CourseSchema.path('pricing.amount').validate(function(value) {
    return value >= 0;
}, 'Price cannot be negative');

CourseSchema.path('schedule.startDate').validate(function(value) {
    return value > new Date();
}, 'Start date must be in the future');

CourseSchema.pre('save', async function(next) {
    if (this.isModified('status') && this.status === 'published') {
        // Notify enrolled students
        const enrolledStudents = await mongoose.model('Enrollment')
            .find({ courseId: this._id })
            .select('userId');
        
        await Promise.all(enrolledStudents.map(enrollment =>
            notificationClient.sendNotification({
                template: 'course_published',
                recipients: [enrollment.userId],
                data: {
                    courseId: this._id,
                    title: this.title
                }
            })
        ));
    }
    next();
});

CourseSchema.post('save', async function(doc) {
    // Update search index
    await mongoose.model('SearchIndex').updateOne(
        { documentId: doc._id },
        {
            $set: {
                type: 'course',
                title: doc.title,
                description: doc.description,
                tags: doc.tags,
                status: doc.status
            }
        },
        { upsert: true }
    );
});

const ModuleSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    order: Number,
    lessons: [{
        type: Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    duration: Number,
    prerequisites: [{
        type: Schema.Types.ObjectId,
        ref: 'Module'
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, { timestamps: true });

const LessonSchema = new Schema({
    moduleId: {
        type: Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    content: {
        type: {
            type: String,
            enum: ['video', 'text', 'quiz', 'assignment', 'interactive'],
            required: true
        },
        data: Schema.Types.Mixed
    },
    duration: Number,
    order: Number,
    resources: [MediaSchema],
    comments: [CommentSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, { timestamps: true });

// Content Module Schemas
const ContentSchema = new Schema({
    type: {
        type: String,
        enum: ['article', 'video', 'podcast', 'resource'],
        required: true
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    content: Schema.Types.Mixed,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [String],
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }],
    media: [MediaSchema],
    comments: [CommentSchema],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    shares: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    metadata: Schema.Types.Mixed
}, { timestamps: true });

// Social Learning Schemas
const PeerReviewSchema = new Schema({
    contentId: {
        type: Schema.Types.ObjectId,
        refPath: 'contentType',
        required: true
    },
    contentType: {
        type: String,
        enum: ['Assignment', 'Project', 'Content'],
        required: true
    },
    reviewerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: {
        strengths: [String],
        improvements: [String],
        comments: String
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'accepted', 'rejected'],
        default: 'pending'
    },
    submittedAt: Date,
    metadata: Schema.Types.Mixed
}, { timestamps: true });

const MentorshipSchema = new Schema({
    mentorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    menteeId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['formal', 'peer', 'group'],
        required: true
    },
    goals: [{
        description: String,
        timeline: String,
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending'
        },
        completedAt: Date
    }],
    duration: {
        start: Date,
        end: Date
    },
    schedule: {
        frequency: String,
        preferredTimes: [String],
        timezone: String
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],
        default: 'pending'
    },
    sessions: [{
        type: Schema.Types.ObjectId,
        ref: 'MentorshipSession'
    }],
    feedback: {
        mentor: String,
        mentee: String,
        rating: Number
    },
    skillsFocus: [{
        skillId: { type: Schema.Types.ObjectId, ref: 'Skill' },
        currentLevel: Number,
        targetLevel: Number
    }],
    milestones: [{
        title: String,
        description: String,
        targetDate: Date,
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'missed'],
            default: 'pending'
        },
        feedback: {
            mentor: String,
            mentee: String
        }
    }],
    communications: [{
        type: {
            type: String,
            enum: ['chat', 'video', 'email']
        },
        frequency: String,
        preferredPlatform: String
    }],
    resources: [{
        type: String,
        title: String,
        url: String,
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedAt: Date
    }],
    metadata: Schema.Types.Mixed
}, { timestamps: true });

MentorshipSchema.index({ mentorId: 1, status: 1 });
MentorshipSchema.index({ menteeId: 1, status: 1 });
MentorshipSchema.index({ 'skillsFocus.skillId': 1 });

MentorshipSchema.path('duration.end').validate(function(value) {
    return !this.duration.start || value > this.duration.start;
}, 'End date must be after start date');

MentorshipSchema.pre('save', async function(next) {
    if (this.isModified('status')) {
        // Notify both mentor and mentee about status changes
        await Promise.all([
            notificationClient.sendNotification({
                template: 'mentorship_status_update',
                recipients: [this.mentorId],
                data: {
                    mentorshipId: this._id,
                    status: this.status,
                    role: 'mentor'
                }
            }),
            notificationClient.sendNotification({
                template: 'mentorship_status_update',
                recipients: [this.menteeId],
                data: {
                    mentorshipId: this._id,
                    status: this.status,
                    role: 'mentee'
                }
            })
        ]);
    }
    next();
});

const MentorshipSessionSchema = new Schema({
    mentorshipId: {
        type: Schema.Types.ObjectId,
        ref: 'Mentorship',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    duration: Number,
    topics: [String],
    outcomes: [String],
    nextSteps: [String],
    resources: [MediaSchema],
    feedback: {
        mentor: String,
        mentee: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, { timestamps: true });

// Engagement Schemas
const LearningChallengeSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['learning', 'skill', 'project'],
        required: true
    },
    startDate: Date,
    endDate: Date,
    goals: [{
        id: String,
        description: String,
        criteria: Schema.Types.Mixed,
        points: Number
    }],
    rewards: {
        xp: Number,
        badges: [String],
        achievements: [String]
    },
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: Date,
        progress: Number,
        status: {
            type: String,
            enum: ['active', 'completed', 'dropped'],
            default: 'active'
        },
        completedAt: Date
    }],
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: Schema.Types.Mixed
}, { timestamps: true });

const GroupStudySessionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    scheduledDate: {
        type: Date,
        required: true
    },
    duration: Number,
    maxParticipants: Number,
    topics: [String],
    facilitatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['lecture', 'discussion', 'workshop'],
        required: true
    },
    resources: [{
        type: {
            type: String,
            enum: ['document', 'video', 'link']
        },
        url: String,
        title: String
    }],
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['facilitator', 'participant'],
            default: 'participant'
        },
        joinedAt: Date
    }],
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    metadata: Schema.Types.Mixed
}, { timestamps: true });

const SessionParticipationSchema = new Schema({
    sessionId: {
        type: Schema.Types.ObjectId,
        ref: 'GroupStudySession',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: Number,
    contributions: [{
        type: {
            type: String,
            enum: ['question', 'answer', 'resource']
        },
        content: String,
        timestamp: Date
    }],
    feedback: String,
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
}, { timestamps: true });

// Analytics Schemas
const UserStatsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    badges: [{
        id: String,
        earnedAt: Date
    }],
    achievements: [{
        id: String,
        earnedAt: Date
    }],
    studySession: {
        attended: {
            type: Number,
            default: 0
        },
        facilitated: {
            type: Number,
            default: 0
        },
        totalDuration: {
            type: Number,
            default: 0
        }
    },
    mentorship: {
        isMentor: {
            type: Boolean,
            default: false
        },
        mentorshipType: [String],
        sessionsCompleted: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        }
    },
    engagement: {
        posts: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        }
    },
    learning: {
        coursesEnrolled: {
            type: Number,
            default: 0
        },
        coursesCompleted: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        totalTimeSpent: {
            type: Number,
            default: 0
        }
    },
    skills: [{
        skillId: {
            type: Schema.Types.ObjectId,
            ref: 'Skill'
        },
        level: Number,
        progress: Number,
        endorsements: Number
    }],
    learningPath: {
        currentPath: { type: Schema.Types.ObjectId, ref: 'LearningPath' },
        progress: Number,
        startedAt: Date,
        estimatedCompletion: Date,
        milestones: [{
            title: String,
            completedAt: Date,
            score: Number
        }]
    },
    certifications: [{
        title: String,
        issuedBy: String,
        issuedAt: Date,
        expiresAt: Date,
        verificationUrl: String
    }],
    preferences: {
        learningStyle: {
            type: String,
            enum: ['visual', 'auditory', 'reading', 'kinesthetic']
        },
        pacePreference: {
            type: String,
            enum: ['self-paced', 'structured', 'intensive']
        },
        communicationPreferences: {
            email: Boolean,
            inApp: Boolean,
            push: Boolean
        }
    },
    availability: {
        timeZone: String,
        preferredTimes: [{
            day: String,
            startTime: String,
            endTime: String
        }]
    }
}, { timestamps: true });

UserStatsSchema.index({ userId: 1 }, { unique: true });
UserStatsSchema.index({ 'skills.skillId': 1, 'skills.level': -1 });
UserStatsSchema.index({ xp: -1 });

UserStatsSchema.pre('save', async function(next) {
    if (this.isModified('xp')) {
        // Calculate new level
        const newLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            // Notify user about level up
            await notificationClient.sendNotification({
                template: 'level_up',
                recipients: [this.userId],
                data: {
                    newLevel: this.level,
                    xp: this.xp
                }
            });
        }
    }
    next();
});

// Apply validators to schemas
CourseSchema.path('title').validate(courseValidators.title.validator, courseValidators.title.message);
CourseSchema.path('description').validate(courseValidators.description.validator, courseValidators.description.message);
CourseSchema.path('modules').validate(courseValidators.moduleOrder.validator, courseValidators.moduleOrder.message);
CourseSchema.path('pricing').validate(courseValidators.pricing.validator, courseValidators.pricing.message);
CourseSchema.path('schedule').validate(courseValidators.schedule.validator, courseValidators.schedule.message);

ContentSchema.path('content').validate(contentValidators.content.validator, contentValidators.content.message);
ContentSchema.path('tags').validate(contentValidators.tags.validator, contentValidators.tags.message);
ContentSchema.path('media').validate(contentValidators.media.validator, contentValidators.media.message);

MentorshipSchema.path('duration').validate(mentorshipValidators.duration.validator, mentorshipValidators.duration.message);
MentorshipSchema.path('goals').validate(mentorshipValidators.goals.validator, mentorshipValidators.goals.message);
MentorshipSchema.path('schedule').validate(mentorshipValidators.schedule.validator, mentorshipValidators.schedule.message);

LearningChallengeSchema.path('goals').validate(challengeValidators.goals.validator, challengeValidators.goals.message);
LearningChallengeSchema.pre('validate', function(next) {
    if (challengeValidators.duration.validator(this)) {
        next();
    } else {
        next(new Error(challengeValidators.duration.message));
    }
});
LearningChallengeSchema.path('rewards').validate(challengeValidators.rewards.validator, challengeValidators.rewards.message);

GroupStudySessionSchema.path('duration').validate(studySessionValidators.duration.validator, studySessionValidators.duration.message);
GroupStudySessionSchema.path('participants').validate(studySessionValidators.participants.validator, studySessionValidators.participants.message);
GroupStudySessionSchema.path('scheduledDate').validate(studySessionValidators.schedule.validator, studySessionValidators.schedule.message);

// Common URL validations
[MediaSchema, ContentSchema, MentorshipSchema].forEach(schema => {
    if (schema.path('url')) {
        schema.path('url').validate(validators.url.validator, validators.url.message);
    }
});

// Common date validations
[CourseSchema, MentorshipSchema, GroupStudySessionSchema].forEach(schema => {
    if (schema.path('startDate')) {
        schema.path('startDate').validate(validators.futureDate.validator, validators.futureDate.message);
    }
});

// Common number validations
[CourseSchema, ContentSchema, LearningChallengeSchema].forEach(schema => {
    if (schema.path('price') || schema.path('points')) {
        const path = schema.path('price') ? 'price' : 'points';
        schema.path(path).validate(validators.positiveNumber.validator, validators.positiveNumber.message);
    }
});

// Apply plugins to all schemas
[CourseSchema, ModuleSchema, LessonSchema, ContentSchema, 
 MentorshipSchema, GroupStudySessionSchema].forEach(schema => {
    schema.plugin(timestampPlugin);
    schema.plugin(auditPlugin);
    schema.plugin(moderationPlugin);
});

// Export all schemas
module.exports = {
    MediaSchema,
    CommentSchema,
    CourseSchema,
    ModuleSchema,
    LessonSchema,
    ContentSchema,
    PeerReviewSchema,
    MentorshipSchema,
    MentorshipSessionSchema,
    LearningChallengeSchema,
    GroupStudySessionSchema,
    SessionParticipationSchema,
    UserStatsSchema
};
