# Media Module

## Overview
The Media module is a specialized system for handling all media-related operations in the learning management service. It provides comprehensive functionality for media upload, processing, storage, streaming, and management, supporting various media types including video, audio, images, and interactive media.

## Core Features

### 1. Media Processing
- Multi-format transcoding
- Adaptive streaming
- Thumbnail generation
- Quality optimization
- Batch processing

### 2. Media Storage
- Distributed storage
- CDN integration
- Caching system
- Version control
- Backup management

### 3. Media Streaming
- Adaptive bitrate streaming
- Live streaming support
- DRM integration
- Quality selection
- Bandwidth optimization

### 4. Media Management
- Metadata management
- Organization system
- Search capabilities
- Access control
- Usage analytics

## Module Structure

### Models

#### 1. Media Model (`models/media.model.js`)
- **Purpose**: Defines media structure and properties
- **Key Components**:
  - Media information
  - Processing status
  - Storage details
  - Streaming config
  - Analytics data

```javascript
{
  title: String,
  description: String,
  type: {
    type: String,
    enum: ['video', 'audio', 'image', 'document', 'interactive']
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed', 'archived']
  },
  metadata: {
    format: String,
    duration: Number,
    dimensions: {
      width: Number,
      height: Number
    },
    size: Number,
    bitrate: Number,
    codec: String,
    language: String,
    tags: [String],
    copyright: {
      owner: String,
      year: Number,
      license: String
    }
  },
  processing: {
    status: String,
    progress: Number,
    error: String,
    history: [{
      action: String,
      timestamp: Date,
      details: Mixed
    }],
    settings: {
      quality: [String],
      formats: [String],
      thumbnails: Boolean,
      captions: Boolean
    }
  },
  storage: {
    provider: String,
    location: String,
    versions: [{
      quality: String,
      format: String,
      url: String,
      size: Number
    }],
    thumbnails: [{
      time: Number,
      url: String
    }]
  },
  streaming: {
    provider: String,
    protocol: String,
    urls: {
      hls: String,
      dash: String,
      smooth: String
    },
    drm: {
      enabled: Boolean,
      provider: String,
      settings: Mixed
    }
  },
  analytics: {
    views: Number,
    uniqueViewers: Number,
    totalPlaytime: Number,
    averageViewDuration: Number,
    qualityDistribution: Mixed,
    bandwidth: Number
  },
  organization: {
    id: ObjectId,
    permissions: [{
      role: String,
      actions: [String]
    }]
  }
}
```

#### 2. Media Job Model (`models/media-job.model.js`)
- **Purpose**: Manages media processing jobs
- **Key Components**:
  - Job configuration
  - Processing status
  - Progress tracking
  - Error handling

```javascript
{
  mediaId: ObjectId,
  type: String,
  priority: Number,
  status: String,
  config: {
    input: {
      source: String,
      format: String
    },
    output: {
      formats: [String],
      qualities: [String],
      settings: Mixed
    },
    processing: {
      thumbnails: Boolean,
      captions: Boolean,
      optimization: Mixed
    }
  },
  progress: {
    stage: String,
    percentage: Number,
    details: Mixed
  },
  error: {
    code: String,
    message: String,
    details: Mixed
  },
  timeline: {
    created: Date,
    started: Date,
    completed: Date
  }
}
```

### Services

#### Media Service (`services/media.service.js`)
- **Core Functions**:
  ```javascript
  // Media Management
  async uploadMedia(file, options)
  async processMedia(mediaId, config)
  async updateMedia(mediaId, updates)
  async deleteMedia(mediaId)

  // Streaming
  async getStreamingUrl(mediaId, options)
  async generateStreamingToken(mediaId, user)
  async handleStreamingAnalytics(mediaId, data)

  // Processing
  async createProcessingJob(mediaId, config)
  async monitorProcessingJob(jobId)
  async handleProcessingCallback(jobId, status)

  // Analytics
  async trackMediaUsage(mediaId, usage)
  async getMediaAnalytics(mediaId)
  async generateMediaReport(mediaId)
  ```

### Controllers

#### Media Controller (`controllers/media.controller.js`)
- **API Endpoints**:
  ```javascript
  // Media Management
  POST   /media/upload          // Upload media
  GET    /media                 // List media
  GET    /media/:id            // Get media details
  PATCH  /media/:id            // Update media
  DELETE /media/:id            // Delete media

  // Streaming
  GET    /media/:id/stream     // Get streaming URL
  GET    /media/:id/token      // Get streaming token
  POST   /media/:id/analytics  // Track streaming

  // Processing
  POST   /media/:id/process    // Start processing
  GET    /media/:id/status     // Get processing status
  POST   /media/webhook        // Processing webhook

  // Analytics
  GET    /media/:id/analytics  // Get analytics
  GET    /media/:id/reports    // Get reports
  ```

## Workflows

### 1. Media Upload and Processing

#### Uploading Media
```javascript
const uploadConfig = {
  file: File,
  metadata: {
    title: "Course Introduction",
    description: "Welcome video",
    type: "video",
    language: "en"
  },
  processing: {
    quality: ["1080p", "720p", "480p"],
    formats: ["mp4", "hls"],
    thumbnails: true,
    captions: {
      generate: true,
      languages: ["en", "es"]
    }
  }
};

// POST /api/media/upload
```

#### Processing Configuration
```javascript
const processingConfig = {
  video: {
    codec: "h264",
    bitrate: {
      "1080p": "5000k",
      "720p": "2500k",
      "480p": "1000k"
    },
    framerate: 30,
    keyframe: 2
  },
  audio: {
    codec: "aac",
    bitrate: "128k",
    channels: 2,
    sampling: 44100
  },
  thumbnails: {
    count: 5,
    interval: 20,
    size: "640x360"
  }
};

// POST /api/media/:id/process
```

### 2. Streaming Setup

#### Getting Streaming URL
```javascript
const streamingOptions = {
  protocol: "hls",
  quality: "auto",
  token: true,
  drm: {
    type: "widevine",
    license: true
  }
};

// GET /api/media/:id/stream
```

#### Analytics Tracking
```javascript
const analyticsData = {
  event: "play",
  timestamp: Date.now(),
  position: 30,
  quality: "720p",
  buffering: {
    count: 1,
    duration: 2.5
  },
  network: {
    bandwidth: 5000,
    type: "wifi"
  }
};

// POST /api/media/:id/analytics
```

## Integration Points

### 1. Content Module
- Media embedding
- Content organization
- Access control

### 2. Course Module
- Course media
- Lecture videos
- Resource materials

### 3. Storage Module
- File storage
- CDN distribution
- Cache management

## Media Processing Pipeline

### 1. Upload Flow
```javascript
{
  stages: [
    {
      name: "validation",
      checks: ["format", "size", "security"]
    },
    {
      name: "preprocessing",
      tasks: ["metadata", "thumbnail", "preview"]
    },
    {
      name: "transcoding",
      formats: ["mp4", "hls"],
      qualities: ["1080p", "720p"]
    },
    {
      name: "postprocessing",
      tasks: ["drm", "watermark", "analytics"]
    }
  ]
}
```

### 2. Streaming Flow
```javascript
{
  preparation: {
    manifest: "generate",
    encryption: "encrypt",
    cdn: "distribute"
  },
  delivery: {
    protocol: "hls",
    packaging: "dynamic",
    protection: "token"
  },
  monitoring: {
    quality: "monitor",
    performance: "track",
    errors: "log"
  }
}
```

## Analytics and Monitoring

### 1. Streaming Analytics
```javascript
{
  playback: {
    views: Number,
    duration: Number,
    completion: Number
  },
  quality: {
    distribution: Object,
    switches: Number,
    average: String
  },
  performance: {
    buffering: Number,
    startup: Number,
    errors: Number
  },
  audience: {
    concurrent: Number,
    geographic: Object,
    devices: Object
  }
}
```

### 2. Processing Analytics
```javascript
{
  jobs: {
    total: Number,
    success: Number,
    failed: Number
  },
  performance: {
    averageTime: Number,
    resourceUsage: Object,
    queue: Number
  },
  errors: {
    types: Object,
    frequency: Object,
    impact: Number
  }
}
```

## Best Practices

### 1. Media Processing
- Format optimization
- Quality preservation
- Efficient encoding
- Error recovery
- Progress monitoring

### 2. Streaming Delivery
- Adaptive bitrate
- Quality selection
- Buffer management
- Error handling
- Analytics tracking

### 3. Storage Management
- Redundancy
- Geographic distribution
- Cache optimization
- Backup strategy
- Cost optimization

## Security

### 1. Content Protection
- DRM implementation
- Token authentication
- URL signing
- Geo-restriction
- IP whitelisting

### 2. Access Control
- Role-based access
- Usage limits
- Time restrictions
- Domain locking
- Audit logging

## Error Handling

The module handles:
- Upload failures
- Processing errors
- Streaming issues
- Storage problems
- Security violations

## Dependencies
- FFmpeg (Transcoding)
- AWS MediaConvert (Processing)
- CloudFront (CDN)
- Elastic Transcoder (Processing)
- Redis (Caching)

## Usage Examples

### Media Upload
```javascript
// Upload media
const media = await MediaService.uploadMedia(
  file,
  {
    type: "video",
    processing: {
      quality: ["1080p", "720p"]
    }
  }
);

// Monitor processing
const status = await MediaService.monitorProcessingJob(
  media.processingJob.id
);
```

### Streaming
```javascript
// Get streaming URL
const url = await MediaService.getStreamingUrl(
  mediaId,
  {
    protocol: "hls",
    token: true
  }
);

// Track analytics
await MediaService.trackMediaUsage(
  mediaId,
  {
    event: "play",
    quality: "720p"
  }
);
```

### Analytics
```javascript
// Get media analytics
const analytics = await MediaService.getMediaAnalytics(
  mediaId,
  {
    period: "last24h",
    metrics: ["views", "quality"]
  }
);

// Generate report
const report = await MediaService.generateMediaReport(
  mediaId,
  {
    type: "performance",
    format: "pdf"
  }
);
```
