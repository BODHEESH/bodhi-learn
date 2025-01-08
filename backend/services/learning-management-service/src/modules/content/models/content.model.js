const mongoose = require('mongoose');
const { toJSON } = require('../../../plugins/mongoose');

const contentBlockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'document', 'code', 'quiz', 'interactive', 'embed'],
        required: true
    },
    title: String,
    description: String,
    content: {
        // Text content
        text: String,
        format: {
            type: String,
            enum: ['plain', 'markdown', 'html'],
            default: 'markdown'
        },
        
        // Media content
        mediaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media'
        },
        url: String,
        thumbnailUrl: String,
        duration: Number,
        
        // Code content
        code: String,
        language: String,
        
        // Quiz content
        questions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }],
        
        // Interactive content
        interactiveType: {
            type: String,
            enum: ['simulation', 'game', 'exercise']
        },
        config: Object,
        
        // Embed content
        embedCode: String,
        embedType: {
            type: String,
            enum: ['iframe', 'script']
        }
    },
    metadata: {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        tags: [String],
        language: String,
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced']
        },
        estimatedTime: Number,
        skills: [{
            name: String,
            level: Number
        }]
    },
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowComments: {
            type: Boolean,
            default: true
        },
        showMetadata: {
            type: Boolean,
            default: true
        },
        requireAuth: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        views: {
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
        },
        avgRating: {
            type: Number,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        }
    },
    version: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: Date,
    archivedAt: Date,
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

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['article', 'lesson', 'tutorial', 'guide', 'documentation'],
        required: true
    },
    blocks: [contentBlockSchema],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    tags: [String],
    metadata: {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        contributors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        language: {
            type: String,
            default: 'en'
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        },
        estimatedTime: Number,
        prerequisites: [{
            content: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Content'
            },
            description: String
        }],
        skills: [{
            name: String,
            level: Number
        }],
        keywords: [String]
    },
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowComments: {
            type: Boolean,
            default: true
        },
        allowRatings: {
            type: Boolean,
            default: true
        },
        requireAuth: {
            type: Boolean,
            default: true
        },
        showAuthor: {
            type: Boolean,
            default: true
        },
        enableVersioning: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        uniqueViews: {
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
        },
        comments: {
            type: Number,
            default: 0
        },
        avgRating: {
            type: Number,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        completions: {
            type: Number,
            default: 0
        },
        avgTimeSpent: {
            type: Number,
            default: 0
        }
    },
    version: {
        major: {
            type: Number,
            default: 1
        },
        minor: {
            type: Number,
            default: 0
        },
        patch: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['draft', 'review', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: Date,
    archivedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
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
contentSchema.index({ title: 'text', description: 'text', 'metadata.keywords': 'text' });
contentSchema.index({ 'metadata.author': 1, organizationId: 1, tenantId: 1 });
contentSchema.index({ status: 1, organizationId: 1, tenantId: 1 });
contentSchema.index({ category: 1, organizationId: 1, tenantId: 1 });

// Add plugins
contentSchema.plugin(toJSON);

// Methods
contentSchema.methods.incrementViews = async function(userId) {
    this.stats.views += 1;
    // Implement unique views tracking logic here
    await this.save();
};

contentSchema.methods.updateRating = async function(rating) {
    const totalRating = this.stats.avgRating * this.stats.totalRatings + rating;
    this.stats.totalRatings += 1;
    this.stats.avgRating = totalRating / this.stats.totalRatings;
    await this.save();
};

contentSchema.methods.recordCompletion = async function(timeSpent) {
    this.stats.completions += 1;
    this.stats.avgTimeSpent = (this.stats.avgTimeSpent * (this.stats.completions - 1) + timeSpent) / this.stats.completions;
    await this.save();
};

contentSchema.methods.publish = async function(reviewerId) {
    this.status = 'published';
    this.publishedAt = new Date();
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    await this.save();
};

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
