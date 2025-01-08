# Learning Management Service API Documentation

## Overview

The Learning Management Service provides a comprehensive API for managing educational content and media resources. The service includes advanced features such as intelligent search, personalized recommendations, progress tracking, gamification, and analytics.

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Content Module

### Content Management

#### Create Content
```http
POST /api/content
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "string",
  "description": "string",
  "type": "article|video|quiz|assignment",
  "blocks": [
    {
      "type": "text|image|video|quiz",
      "content": "object"
    }
  ],
  "metadata": {
    "tags": ["string"],
    "difficulty": "beginner|intermediate|advanced",
    "duration": "number",
    "skills": ["string"]
  }
}
```

Rate Limit: 100 requests per hour per organization

#### Get Content List
```http
GET /api/content
Authorization: Bearer <token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by content type
- `difficulty`: Filter by difficulty level
- `skills`: Filter by required skills
- `sortBy`: Sort field and order (e.g., "createdAt:desc")

Cache Duration: 5 minutes

#### Get Content Item
```http
GET /api/content/:contentId
Authorization: Bearer <token>
```

Cache Duration: 1 hour

### Content Search

#### Search Content
```http
GET /api/content/search
Authorization: Bearer <token>

Query Parameters:
- searchText: Search query
- type: Filter by content type
- tags: Filter by tags
- difficulty: Filter by difficulty level
- page: Page number
- limit: Items per page
- sortBy: Sort field and order
```

Features:
- Full-text search across title, description, and content
- Fuzzy matching for typo tolerance
- Tag-based filtering
- Difficulty level filtering
- Relevance scoring

### Content Recommendations

#### Get Personalized Recommendations
```http
GET /api/content/recommendations
Authorization: Bearer <token>

Query Parameters:
- limit: Number of recommendations (default: 10)
- includeTypes: Array of content types to include
- excludeCompleted: Whether to exclude completed content (default: true)
```

Features:
- Personalized based on user's:
  - Learning history
  - Skill levels
  - Interests
  - Progress
- Content popularity factors:
  - View count
  - Completion rate
  - Average ratings

### Content Blocks

#### Add Content Block
```http
POST /api/content/:contentId/blocks
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "text|image|video|quiz",
  "content": "object",
  "order": "number"
}
```

#### Update Content Block
```http
PATCH /api/content/:contentId/blocks/:blockId
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "object",
  "order": "number"
}
```

### Content Lifecycle

#### Publish Content
```http
PATCH /api/content/:contentId/publish
Authorization: Bearer <token>
```

#### Archive Content
```http
PATCH /api/content/:contentId/archive
Authorization: Bearer <token>
```

## Media Module

### Media Management

#### Upload Media
```http
POST /api/media
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
type: "image|video|audio|document"
metadata: {
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "skills": ["string"]
}
```

Features:
- Automatic processing based on media type
- Thumbnail generation
- Transcoding for optimal delivery
- Metadata extraction

Rate Limit: 50 uploads per hour per organization

#### Get Media List
```http
GET /api/media
Authorization: Bearer <token>
```

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by media type
- `tags`: Filter by tags
- `sortBy`: Sort field and order (e.g., "createdAt:desc")

Cache Duration: 5 minutes

#### Get Media Item
```http
GET /api/media/:mediaId
Authorization: Bearer <token>
```

Cache Duration: 1 hour

### Media Search

#### Search Media
```http
GET /api/media/search
Authorization: Bearer <token>

Query Parameters:
- searchText: Search query
- type: Filter by media type
- tags: Filter by tags
- page: Page number
- limit: Items per page
- sortBy: Sort field and order
```

Features:
- Full-text search across title, description, and transcriptions
- Search within annotations
- Tag-based filtering
- Relevance scoring

### Media Recommendations

#### Get Media Recommendations
```http
GET /api/media/recommendations
Authorization: Bearer <token>

Query Parameters:
- limit: Number of recommendations (default: 10)
- includeTypes: Array of media types to include
- excludeViewed: Whether to exclude viewed media (default: false)
```

Features:
- Personalized based on:
  - Viewing history
  - User interests
  - Related content
- Popularity factors:
  - View count
  - Download count
  - Ratings

### Media Processing

#### Add Transcription
```http
POST /api/media/:mediaId/transcriptions
Content-Type: application/json
Authorization: Bearer <token>

{
  "language": "string",
  "content": "string",
  "segments": [
    {
      "startTime": "number",
      "endTime": "number",
      "text": "string"
    }
  ]
}
```

Rate Limit: 20 processing requests per hour

#### Add Annotation
```http
POST /api/media/:mediaId/annotations
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "note|highlight|bookmark",
  "content": {
    "text": "string",
    "timestamp": "number",
    "position": {
      "x": "number",
      "y": "number"
    }
  }
}
```

## Progress Tracking

### Track Content Progress

#### Record Content View
```http
POST /api/content/:contentId/views
Authorization: Bearer <token>
```

#### Record Content Completion
```http
POST /api/content/:contentId/completions
Authorization: Bearer <token>

{
  "score": "number",
  "timeSpent": "number"
}
```

Features:
- Automatic skill level updating
- Progress statistics
- Learning path adaptation
- Achievement tracking

### Track Media Progress

#### Record Media View
```http
POST /api/media/:mediaId/views
Authorization: Bearer <token>
```

Features:
- View time tracking
- Progress resumption
- Watch history
- Viewing statistics

## Gamification

### User Progress and Levels

#### Get User Level
```http
GET /api/gamification/level
Authorization: Bearer <token>

Response:
{
  "level": number,
  "xp": number,
  "nextLevelXP": number,
  "progress": number
}
```

#### Get User Achievements
```http
GET /api/gamification/achievements
Authorization: Bearer <token>

Query Parameters:
- type: Achievement type filter
- status: "locked" | "unlocked"
```

#### Get User Rewards
```http
GET /api/gamification/rewards
Authorization: Bearer <token>

Query Parameters:
- status: "available" | "claimed"
```

### Leaderboards

#### Get Leaderboard
```http
GET /api/gamification/leaderboard
Authorization: Bearer <token>

Query Parameters:
- timeframe: "daily" | "weekly" | "monthly" | "all"
- scope: "global" | "organization" | "tenant"
- limit: Number of entries (default: 10)
```

Features:
- Experience points (XP) system
- Level progression
- Achievement system
- Reward unlocks
- Leaderboards
- Skill tracking

## Engagement Features

### Learning Challenges

#### Create Learning Challenge
```http
POST /api/engagement/challenges
Authorization: Bearer <token>

{
  "title": "string",
  "description": "string",
  "type": "learning|skill|project",
  "startDate": "date",
  "endDate": "date",
  "goals": [
    {
      "id": "string",
      "description": "string",
      "criteria": "object",
      "points": "number"
    }
  ],
  "rewards": {
    "xp": "number",
    "badges": ["string"],
    "achievements": ["string"]
  },
  "metadata": "object"
}
```

#### Join Challenge
```http
POST /api/engagement/challenges/:challengeId/join
Authorization: Bearer <token>
```

#### Track Challenge Progress
```http
POST /api/engagement/challenges/:challengeId/progress
Authorization: Bearer <token>

{
  "goalId": "string",
  "status": "completed|failed",
  "evidence": "object"
}
```

### Group Study Sessions

#### Create Study Session
```http
POST /api/engagement/study-sessions
Authorization: Bearer <token>

{
  "title": "string",
  "description": "string",
  "scheduledDate": "date",
  "duration": "number",
  "maxParticipants": "number",
  "topics": ["string"],
  "type": "lecture|discussion|workshop",
  "resources": [
    {
      "type": "document|video|link",
      "url": "string",
      "title": "string"
    }
  ],
  "metadata": "object"
}
```

#### Join Study Session
```http
POST /api/engagement/study-sessions/:sessionId/join
Authorization: Bearer <token>
```

#### Record Participation
```http
POST /api/engagement/study-sessions/:sessionId/participation
Authorization: Bearer <token>

{
  "duration": "number",
  "contributions": [
    {
      "type": "question|answer|resource",
      "content": "string",
      "timestamp": "date"
    }
  ],
  "feedback": "string",
  "rating": "number"
}
```

### Mentorship

#### Create Mentorship
```http
POST /api/engagement/mentorship
Authorization: Bearer <token>

{
  "mentorId": "string",
  "menteeId": "string",
  "type": "formal|peer|group",
  "goals": [
    {
      "description": "string",
      "timeline": "string",
      "metrics": "object"
    }
  ],
  "duration": "object",
  "schedule": {
    "frequency": "string",
    "preferredTimes": ["string"],
    "timezone": "string"
  },
  "metadata": "object"
}
```

#### Update Mentorship Status
```http
PATCH /api/engagement/mentorship/:mentorshipId/status
Authorization: Bearer <token>

{
  "status": "active|paused|completed|cancelled",
  "note": "string"
}
```

#### Record Mentorship Session
```http
POST /api/engagement/mentorship/:mentorshipId/sessions
Authorization: Bearer <token>

{
  "date": "date",
  "duration": "number",
  "topics": ["string"],
  "outcomes": ["string"],
  "nextSteps": ["string"],
  "feedback": {
    "mentor": "string",
    "mentee": "string"
  }
}
```

### Analytics

#### Get Engagement Metrics
```http
GET /api/analytics/engagement
Authorization: Bearer <token>

Query Parameters:
- userId: Optional user filter
- contentId: Optional content filter
- timeframe: Time period (e.g., "30d", "7d", "24h")
- type: Optional engagement type filter

Response:
{
  "likes": {
    "total": "number",
    "uniqueUsers": "number",
    "dailyStats": [
      {
        "date": "string",
        "count": "number",
        "uniqueUsers": "number"
      }
    ]
  },
  "comments": {
    "total": "number",
    "uniqueUsers": "number",
    "dailyStats": [...]
  },
  "shares": {...},
  "bookmarks": {...}
}
```

#### Get Mentorship Analytics
```http
GET /api/analytics/mentorship
Authorization: Bearer <token>

Query Parameters:
- userId: Optional user filter
- type: Optional mentorship type filter
- timeframe: Time period

Response:
{
  "sessions": {
    "total": "number",
    "averageDuration": "number",
    "completionRate": "number",
    "topTopics": ["string"]
  },
  "mentees": {
    "total": "number",
    "activeCount": "number",
    "completionRate": "number",
    "satisfactionScore": "number"
  },
  "goals": {
    "total": "number",
    "completedCount": "number",
    "inProgressCount": "number",
    "completionRate": "number"
  }
}
```

#### Get Learning Challenge Analytics
```http
GET /api/analytics/challenges
Authorization: Bearer <token>

Query Parameters:
- challengeId: Optional challenge filter
- timeframe: Time period

Response:
{
  "participation": {
    "total": "number",
    "active": "number",
    "completed": "number",
    "completionRate": "number"
  },
  "goals": {
    "totalMilestones": "number",
    "completedMilestones": "number",
    "completionRate": "number",
    "topAchievers": [
      {
        "userId": "string",
        "progress": "number",
        "completedGoals": "number"
      }
    ]
  },
  "rewards": {
    "totalXPAwarded": "number",
    "badgesAwarded": "number",
    "achievementsUnlocked": "number"
  }
}
```

## Analytics

### Content Analytics

#### Get Content Analytics
```http
GET /api/analytics/content
Authorization: Bearer <token>

Query Parameters:
- contentId: Optional content ID filter
- timeframe: Time period (e.g., "30d", "7d", "24h")
- organizationId: Optional organization filter
- tenantId: Optional tenant filter

Response:
{
  "views": {
    "totalViews": number,
    "uniqueViewers": number,
    "dailyStats": [
      {
        "date": string,
        "views": number,
        "uniqueUsers": number
      }
    ]
  },
  "completions": {
    "totalCompletions": number,
    "averageScore": number,
    "averageTimeSpent": number
  },
  "engagement": {
    "totalComments": number,
    "totalShares": number,
    "averageRating": number,
    "ratingDistribution": {
      "1": number,
      "2": number,
      "3": number,
      "4": number,
      "5": number
    }
  }
}
```

### Media Analytics

#### Get Media Analytics
```http
GET /api/analytics/media
Authorization: Bearer <token>

Query Parameters:
- mediaId: Optional media ID filter
- timeframe: Time period (e.g., "30d", "7d", "24h")
- organizationId: Optional organization filter
- tenantId: Optional tenant filter

Response:
{
  "views": {
    "totalViews": number,
    "uniqueViewers": number,
    "dailyStats": [
      {
        "date": string,
        "views": number,
        "uniqueUsers": number,
        "averageDuration": number
      }
    ]
  },
  "engagement": {
    "totalDownloads": number,
    "totalShares": number,
    "totalAnnotations": number
  }
}
```

### User Analytics

#### Get User Analytics
```http
GET /api/analytics/user
Authorization: Bearer <token>

Query Parameters:
- userId: Optional user ID filter
- timeframe: Time period (e.g., "30d", "7d", "24h")
- organizationId: Optional organization filter
- tenantId: Optional tenant filter

Response:
{
  "progress": {
    "contentCompleted": number,
    "averageScore": number,
    "totalTimeSpent": number,
    "skillProgress": [
      {
        "skill": string,
        "level": string,
        "progress": number
      }
    ]
  },
  "engagement": {
    "comments": number,
    "ratings": number,
    "shares": number,
    "annotations": number
  }
}
```

Features:
- Detailed content performance metrics
- Media consumption analytics
- User engagement tracking
- Learning progress analysis
- Organization-wide insights
- Custom timeframe analysis

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "status": "error",
  "code": "number",
  "message": "string",
  "details": "object (optional)"
}
```

Common error codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

Different endpoints have different rate limits:
- Content Creation: 100 requests per hour per organization
- Media Upload: 50 uploads per hour per organization
- Media Processing: 20 requests per hour per organization
- General API: 1000 requests per 15 minutes per organization

## Caching

The service implements intelligent caching:
- Content Lists: 5 minutes
- Content Items: 1 hour
- Media Lists: 5 minutes
- Media Items: 1 hour
- Content Blocks: 30 minutes

Cache is automatically invalidated when related resources are modified.

## Metrics

The service collects various metrics:
- Request latency
- Error rates
- Cache hit/miss rates
- Storage usage
- Media processing times
- Content and media creation rates

These metrics are available through Prometheus-compatible endpoints.

## Performance Features

### Caching
- Intelligent caching based on content type and access patterns
- Cache invalidation on content updates
- Organization-specific cache isolation

### Rate Limiting
- Operation-specific limits
- Organization-based quotas
- Burst allowance for specific operations

### Search Optimization
- Elasticsearch-powered search
- Fuzzy matching
- Relevance scoring
- Field boosting

### Recommendations
- Collaborative filtering
- Content-based filtering
- Real-time interest tracking
- Skill level adaptation

## Metrics and Analytics

The service collects comprehensive metrics:
- User engagement
- Content performance
- Media consumption
- System performance
- Cache effectiveness
- Search quality

These metrics are available through Prometheus-compatible endpoints and can be visualized using tools like Grafana.
