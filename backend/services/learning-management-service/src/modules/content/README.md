# Content Module

## Overview
The Content module is a sophisticated system for managing, storing, and delivering educational content across the learning management service. It handles various content types, versioning, access control, and integration with other modules while ensuring optimal performance and security.

## Core Features

### 1. Content Management
- Multi-format content support
- Version control
- Content organization
- Metadata management
- Access control

### 2. Content Delivery
- Streaming capabilities
- CDN integration
- Caching strategies
- Adaptive delivery
- Offline access

### 3. Content Processing
- Format conversion
- Optimization
- Validation
- Indexing
- Analytics tracking

### 4. Content Protection
- DRM implementation
- Access control
- Copyright management
- Watermarking
- Usage tracking

## Module Structure

### Models

#### 1. Content Model (`models/content.model.js`)
- **Purpose**: Defines content structure and metadata
- **Key Components**:
  - Content information
  - Storage details
  - Access controls
  - Version history
  - Usage analytics

```javascript
{
  title: String,
  type: String,
  description: String,
  version: String,
  status: String,
  metadata: {
    format: String,
    size: Number,
    duration: Number,
    language: String,
    tags: [String],
    author: ObjectId,
    copyright: {
      holder: String,
      year: Number,
      license: String
    }
  },
  storage: {
    provider: String,
    location: String,
    format: String,
    variants: [{
      quality: String,
      format: String,
      url: String,
      size: Number
    }]
  },
  access: {
    permissions: [{
      role: String,
      actions: [String]
    }],
    restrictions: {
      geoRestriction: [String],
      timeRestriction: {
        start: Date,
        end: Date
      }
    }
  },
  versions: [{
    version: String,
    changes: String,
    createdAt: Date,
    createdBy: ObjectId,
    storage: Mixed
  }],
  usage: {
    views: Number,
    downloads: Number,
    lastAccessed: Date,
    popularityScore: Number
  }
}
```

#### 2. Content Usage Model (`models/content-usage.model.js`)
- **Purpose**: Tracks content usage and analytics
- **Key Components**:
  - Usage statistics
  - Access patterns
  - Performance metrics
  - User interactions
  - Error tracking

```javascript
{
  contentId: ObjectId,
  userId: ObjectId,
  sessionId: String,
  type: String,
  timestamp: Date,
  details: {
    action: String,
    duration: Number,
    progress: Number,
    quality: String,
    device: {
      type: String,
      os: String,
      browser: String
    },
    network: {
      type: String,
      speed: Number
    },
    performance: {
      loadTime: Number,
      bufferingEvents: Number,
      errors: [{
        type: String,
        message: String,
        timestamp: Date
      }]
    }
  },
  location: {
    country: String,
    region: String,
    city: String
  }
}
```

### Services

#### Content Service (`services/content.service.js`)
- **Core Functions**:
  ```javascript
  // Content Management
  async createContent(contentData)
  async updateContent(contentId, updates)
  async versionContent(contentId, versionData)
  async archiveContent(contentId)

  // Content Processing
  async processContent(contentId, options)
  async optimizeContent(contentId, target)
  async validateContent(contentId)

  // Content Delivery
  async getContentUrl(contentId, options)
  async streamContent(contentId, range)
  async downloadContent(contentId)

  // Analytics
  async trackUsage(contentId, usageData)
  async getContentAnalytics(contentId)
  async generateUsageReport(contentId)
  ```

### Controllers

#### Content Controller (`controllers/content.controller.js`)
- **API Endpoints**:
  ```javascript
  // Content Management
  POST   /content                // Create content
  GET    /content                // List content
  GET    /content/:id           // Get content details
  PATCH  /content/:id           // Update content
  DELETE /content/:id           // Delete content

  // Content Delivery
  GET    /content/:id/stream    // Stream content
  GET    /content/:id/download  // Download content
  GET    /content/:id/preview   // Preview content

  // Version Management
  POST   /content/:id/versions  // Create version
  GET    /content/:id/versions  // List versions
  GET    /content/:id/versions/:vid // Get version

  // Analytics
  GET    /content/:id/analytics // Get analytics
  GET    /content/:id/usage     // Get usage data
  ```

## Workflows

### 1. Content Creation and Processing

#### Creating New Content
```javascript
const contentData = {
  title: "Introduction to JavaScript",
  type: "video",
  description: "Learn JavaScript basics",
  metadata: {
    format: "mp4",
    language: "en",
    tags: ["javascript", "programming"]
  },
  access: {
    permissions: [
      {
        role: "student",
        actions: ["view", "download"]
      }
    ]
  }
};

// POST /api/content
```

#### Processing Content
```javascript
const processingOptions = {
  video: {
    formats: ["mp4", "webm"],
    qualities: ["1080p", "720p", "480p"],
    thumbnail: {
      generate: true,
      intervals: [0, 10, 30]
    }
  },
  optimization: {
    compress: true,
    target: {
      size: "max2gb",
      quality: "high"
    }
  }
};

// POST /api/content/:id/process
```

### 2. Content Delivery

#### Streaming Content
```javascript
// GET /api/content/:id/stream
const streamOptions = {
  quality: "auto",
  format: "adaptive",
  drm: {
    enabled: true,
    type: "widevine"
  }
};
```

#### Downloading Content
```javascript
// GET /api/content/:id/download
const downloadOptions = {
  quality: "original",
  format: "mp4",
  watermark: {
    enabled: true,
    text: "Copyright © 2025"
  }
};
```

## Integration Points

### 1. Course Module
- Content embedding
- Progress tracking
- Access control

### 2. Media Module
- Media processing
- Streaming services
- Storage management

### 3. Analytics Module
- Usage tracking
- Performance monitoring
- User behavior analysis

## Content Types and Processing

### 1. Video Content
```javascript
{
  processing: {
    transcoding: {
      formats: ["mp4", "webm"],
      qualities: ["1080p", "720p"],
      codec: "h264"
    },
    thumbnail: {
      intervals: [0, 30, 60],
      size: "640x360"
    },
    captions: {
      generate: true,
      languages: ["en", "es"]
    }
  }
}
```

### 2. Document Content
```javascript
{
  processing: {
    conversion: {
      formats: ["pdf", "epub"],
      optimization: true
    },
    preview: {
      generate: true,
      pages: 3
    },
    text: {
      extract: true,
      index: true
    }
  }
}
```

### 3. Interactive Content
```javascript
{
  processing: {
    validation: {
      schema: "h5p",
      compatibility: ["web", "mobile"]
    },
    resources: {
      bundle: true,
      optimize: true
    }
  }
}
```

## Analytics and Monitoring

### 1. Usage Analytics
```javascript
{
  overview: {
    totalViews: Number,
    uniqueUsers: Number,
    averageEngagement: Number
  },
  performance: {
    loadTime: {
      average: Number,
      p95: Number
    },
    buffering: {
      events: Number,
      duration: Number
    },
    quality: {
      switches: Number,
      distribution: Object
    }
  },
  geographic: {
    countries: Array,
    regions: Array,
    cities: Array
  }
}
```

### 2. Technical Monitoring
```javascript
{
  storage: {
    total: Number,
    distribution: Object
  },
  delivery: {
    bandwidth: Number,
    cdn: {
      hits: Number,
      efficiency: Number
    }
  },
  errors: {
    count: Number,
    types: Array,
    impact: Object
  }
}
```

## Best Practices

### 1. Content Organization
- Consistent naming
- Proper categorization
- Clear versioning
- Efficient tagging
- Complete metadata

### 2. Content Processing
- Format optimization
- Quality preservation
- Efficient encoding
- Error handling
- Progress tracking

### 3. Content Delivery
- CDN utilization
- Adaptive streaming
- Caching strategy
- Error recovery
- Performance optimization

## Security

### 1. Access Control
- Role-based access
- Token authentication
- URL signing
- IP restrictions
- Time limitations

### 2. Content Protection
- DRM implementation
- Watermarking
- Copy protection
- Usage tracking
- Encryption

## Error Handling

The module handles:
- Upload failures
- Processing errors
- Storage issues
- Delivery problems
- Access violations

## Dependencies
- AWS S3 (Storage)
- CloudFront (CDN)
- FFmpeg (Media processing)
- ImageMagick (Image processing)
- Redis (Caching)

## Usage Examples

### Content Management
```javascript
// Create content
const content = await ContentService.createContent({
  title: "Course Video",
  type: "video",
  metadata: {...}
});

// Process content
await ContentService.processContent(
  content.id,
  {
    video: {
      formats: ["mp4", "webm"]
    }
  }
);
```

### Content Delivery
```javascript
// Get streaming URL
const url = await ContentService.getContentUrl(
  contentId,
  {
    type: "stream",
    quality: "auto"
  }
);

// Track usage
await ContentService.trackUsage(
  contentId,
  {
    action: "view",
    duration: 300
  }
);
```

### Analytics
```javascript
// Get content analytics
const analytics = await ContentService.getContentAnalytics(
  contentId,
  {
    period: "last7days",
    metrics: ["views", "engagement"]
  }
);

// Generate usage report
const report = await ContentService.generateUsageReport(
  contentId,
  {
    type: "detailed",
    format: "csv"
  }
);
```
