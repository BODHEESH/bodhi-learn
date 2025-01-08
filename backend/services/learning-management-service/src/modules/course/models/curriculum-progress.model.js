const mongoose = require('mongoose');
const { toJSON } = require('../../../plugins/mongoose');

const activityLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    action: {
        type: String,
        enum: ['start', 'complete', 'fail', 'pause', 'resume', 'submit'],
        required: true
    },
    metadata: {
        timeSpent: Number,
        score: Number,
        progress: Number,
        lastPosition: Number,
        submissionId: mongoose.Schema.Types.ObjectId,
        answers: Object,
        feedback: String
    }
}, { _id: false });

const itemProgressSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'failed'],
        default: 'not_started'
    },
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    completedActivities: [{
        type: String,
        enum: ['watch', 'read', 'submit', 'participate']
    }],
    attempts: {
        type: Number,
        default: 0
    },
    lastAttemptDate: Date,
    completionDate: Date,
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    activityLog: [activityLogSchema],
    feedback: String,
    notes: String
}, { _id: false });

const sectionProgressSchema = new mongoose.Schema({
    section: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    completedItems: {
        type: Number,
        default: 0
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        min: 0,
        max: 100
    },
    startDate: Date,
    completionDate: Date,
    items: {
        type: Map,
        of: itemProgressSchema
    }
}, { _id: false });

const curriculumProgressSchema = new mongoose.Schema(
    {
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
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        enrollmentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed', 'expired'],
            default: 'not_started'
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        overallScore: {
            type: Number,
            min: 0,
            max: 100
        },
        timeSpent: {
            type: Number,
            default: 0
        },
        completedSections: {
            type: Number,
            default: 0
        },
        completedItems: {
            type: Number,
            default: 0
        },
        lastAccessDate: Date,
        startDate: Date,
        completionDate: Date,
        certificateId: mongoose.Schema.Types.ObjectId,
        sections: {
            type: Map,
            of: sectionProgressSchema
        },
        currentSection: mongoose.Schema.Types.ObjectId,
        currentItem: mongoose.Schema.Types.ObjectId,
        bookmarks: [{
            item: mongoose.Schema.Types.ObjectId,
            note: String,
            timestamp: Date
        }],
        notes: [{
            item: mongoose.Schema.Types.ObjectId,
            content: String,
            timestamp: Date
        }],
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
    },
    {
        timestamps: true
    }
);

// Indexes
curriculumProgressSchema.index({ user: 1, curriculum: 1, organizationId: 1, tenantId: 1 }, { unique: true });
curriculumProgressSchema.index({ course: 1 });
curriculumProgressSchema.index({ enrollmentId: 1 });
curriculumProgressSchema.index({ status: 1 });

// Add plugins
curriculumProgressSchema.plugin(toJSON);

// Methods

// Update section progress
curriculumProgressSchema.methods.updateSectionProgress = function(sectionId) {
    const section = this.sections.get(sectionId.toString());
    if (!section) return;

    let completedItems = 0;
    let totalScore = 0;
    let scoredItems = 0;
    let totalTimeSpent = 0;

    section.items.forEach(item => {
        if (item.status === 'completed') {
            completedItems++;
            totalTimeSpent += item.timeSpent || 0;
            if (item.score != null) {
                totalScore += item.score;
                scoredItems++;
            }
        }
    });

    section.completedItems = completedItems;
    section.timeSpent = totalTimeSpent;
    section.averageScore = scoredItems > 0 ? totalScore / scoredItems : null;
    section.progress = (completedItems / section.items.size) * 100;

    if (completedItems === section.items.size) {
        section.status = 'completed';
        section.completionDate = new Date();
    } else if (completedItems > 0) {
        section.status = 'in_progress';
    }
};

// Update overall progress
curriculumProgressSchema.methods.updateOverallProgress = function() {
    let totalSections = this.sections.size;
    let completedSections = 0;
    let totalItems = 0;
    let completedItems = 0;
    let totalScore = 0;
    let scoredItems = 0;
    let totalTimeSpent = 0;

    this.sections.forEach(section => {
        if (section.status === 'completed') {
            completedSections++;
        }

        section.items.forEach(item => {
            totalItems++;
            if (item.status === 'completed') {
                completedItems++;
                totalTimeSpent += item.timeSpent || 0;
                if (item.score != null) {
                    totalScore += item.score;
                    scoredItems++;
                }
            }
        });
    });

    this.completedSections = completedSections;
    this.completedItems = completedItems;
    this.timeSpent = totalTimeSpent;
    this.overallScore = scoredItems > 0 ? totalScore / scoredItems : null;
    this.progress = (completedItems / totalItems) * 100;

    if (completedSections === totalSections) {
        this.status = 'completed';
        this.completionDate = new Date();
    } else if (completedItems > 0) {
        this.status = 'in_progress';
    }
};

// Log activity
curriculumProgressSchema.methods.logActivity = function(itemId, action, metadata = {}) {
    const [sectionId, item] = this.findItem(itemId);
    if (!item) return;

    item.activityLog.push({
        timestamp: new Date(),
        action,
        metadata
    });

    if (action === 'complete') {
        item.status = 'completed';
        item.completionDate = new Date();
        this.updateSectionProgress(sectionId);
        this.updateOverallProgress();
    }
};

// Find item in any section
curriculumProgressSchema.methods.findItem = function(itemId) {
    for (const [sectionId, section] of this.sections) {
        const item = section.items.get(itemId.toString());
        if (item) {
            return [sectionId, item];
        }
    }
    return [null, null];
};

const CurriculumProgress = mongoose.model('CurriculumProgress', curriculumProgressSchema);

module.exports = {
    CurriculumProgress,
    curriculumProgressSchema
};
