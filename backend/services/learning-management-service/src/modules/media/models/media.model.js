const mongoose = require('mongoose');
const { toJSON } = require('../../../plugins/mongoose');

const transcriptionSchema = new mongoose.Schema({
    language: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['auto', 'manual'],
        default: 'auto'
    },
    confidence: Number,
    segments: [{
        startTime: Number,
        endTime: Number,
        text: String,
        speaker: String
    }]
});

const annotationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['note', 'highlight', 'bookmark', 'tag', 'custom'],
        required: true
    },
    content: {
        text: String,
        color: String,
        timestamp: Number,
        position: {
            x: Number,
            y: Number
        },
        duration: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const mediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'presentation'],
        required: true
    },
    fileDetails: {
        originalName: String,
        encoding: String,
        mimeType: String,
        size: Number,
        extension: String,
        duration: Number,
        dimensions: {
            width: Number,
            height: Number
        },
        bitrate: Number,
        format: String
    },
    storage: {
        provider: {
            type: String,
            enum: ['local', 's3', 'gcs', 'azure'],
            required: true
        },
        bucket: String,
        key: String,
        url: {
            type: String,
            required: true
        },
        thumbnailUrl: String,
        previewUrl: String
    },
    processing: {
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        error: String,
        completedAt: Date
    },
    metadata: {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        tags: [String],
        language: String,
        copyright: String,
        license: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        captureDate: Date,
        keywords: [String]
    },
    transcriptions: [transcriptionSchema],
    annotations: [annotationSchema],
    versions: [{
        version: Number,
        url: String,
        quality: String,
        size: Number,
        createdAt: Date
    }],
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowDownload: {
            type: Boolean,
            default: true
        },
        allowSharing: {
            type: Boolean,
            default: true
        },
        requireAttribution: {
            type: Boolean,
            default: false
        },
        autoProcess: {
            transcription: {
                enabled: {
                    type: Boolean,
                    default: false
                },
                languages: [String]
            },
            thumbnails: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                intervals: [Number]
            },
            optimization: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                quality: {
                    type: String,
                    enum: ['low', 'medium', 'high'],
                    default: 'medium'
                }
            }
        }
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['draft', 'processing', 'active', 'archived'],
        default: 'draft'
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
mediaSchema.index({ title: 'text', description: 'text', 'metadata.keywords': 'text' });
mediaSchema.index({ 'metadata.author': 1, organizationId: 1, tenantId: 1 });
mediaSchema.index({ status: 1, organizationId: 1, tenantId: 1 });
mediaSchema.index({ type: 1, organizationId: 1, tenantId: 1 });

// Add plugins
mediaSchema.plugin(toJSON);

// Methods
mediaSchema.methods.generateThumbnail = async function() {
    if (!this.settings.autoProcess.thumbnails.enabled) {
        return;
    }
    // Implement thumbnail generation logic here
};

mediaSchema.methods.transcribe = async function(language) {
    if (!this.settings.autoProcess.transcription.enabled) {
        return;
    }
    // Implement transcription logic here
};

mediaSchema.methods.optimize = async function() {
    if (!this.settings.autoProcess.optimization.enabled) {
        return;
    }
    // Implement media optimization logic here
};

mediaSchema.methods.incrementViews = async function() {
    this.stats.views += 1;
    await this.save();
};

mediaSchema.methods.recordDownload = async function() {
    this.stats.downloads += 1;
    await this.save();
};

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
