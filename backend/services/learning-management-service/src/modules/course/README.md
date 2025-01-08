# Course Module

## Overview
The Course module is the core component of the learning management service, providing comprehensive functionality for creating, managing, and delivering educational content. It supports various content types, interactive elements, progress tracking, and detailed analytics.

## Core Features

### 1. Course Management
- Course creation and organization
- Content structuring
- Resource management
- Version control
- Publishing workflow

### 2. Content Delivery
- Multi-format content support
- Interactive elements
- Adaptive learning paths
- Progress tracking
- Offline access

### 3. Student Engagement
- Discussion forums
- Interactive exercises
- Real-time feedback
- Progress visualization
- Achievement system

### 4. Instructor Tools
- Content authoring
- Student progress monitoring
- Performance analytics
- Communication tools
- Grading system

## Module Structure

### Models

#### 1. Course Model (`models/course.model.js`)
- **Purpose**: Defines course structure and properties
- **Key Components**:
  - Course information
  - Content structure
  - Settings
  - Analytics
  - Metadata

```javascript
{
  title: String,
  description: String,
  slug: String,
  category: String,
  level: String,
  sections: [{
    title: String,
    description: String,
    order: Number,
    lessons: [{
      title: String,
      type: String,
      content: Mixed,
      duration: Number,
      order: Number,
      requirements: {
        prerequisites: [ObjectId],
        minimumScore: Number
      }
    }]
  }],
  settings: {
    enrollment: {
      type: String,
      startDate: Date,
      endDate: Date,
      capacity: Number
    },
    completion: {
      criteria: String,
      minimumScore: Number,
      requiredTime: Number
    },
    access: {
      type: String,
      restrictions: Mixed
    }
  },
  metadata: {
    language: String,
    tags: [String],
    difficulty: String,
    skills: [{
      name: String,
      level: String
    }],
    certification: {
      available: Boolean,
      provider: String,
      validity: Number
    }
  },
  statistics: {
    enrollments: Number,
    completions: Number,
    averageRating: Number,
    averageCompletion: Number
  }
}
```

#### 2. Enrollment Model (`models/course-enrollment.model.js`)
- **Purpose**: Manages student enrollments and progress
- **Key Components**:
  - Enrollment status
  - Progress tracking
  - Performance data
  - Completion status
  - Certificates

```javascript
{
  courseId: ObjectId,
  userId: ObjectId,
  status: String,
  progress: {
    completedLessons: [{
      lessonId: ObjectId,
      completedAt: Date,
      timeSpent: Number,
      score: Number
    }],
    currentSection: Number,
    currentLesson: Number,
    overallProgress: Number
  },
  performance: {
    averageScore: Number,
    totalTimeSpent: Number,
    lastAccessed: Date,
    achievements: [{
      type: String,
      earnedAt: Date,
      details: Mixed
    }]
  },
  certificate: {
    issued: Boolean,
    issuedAt: Date,
    certificateId: String,
    expiresAt: Date
  }
}
```

### Services

#### Course Service (`services/course.service.js`)
- **Core Functions**:
  ```javascript
  // Course Management
  async createCourse(courseData)
  async updateCourse(courseId, updates)
  async publishCourse(courseId)
  async archiveCourse(courseId)

  // Content Management
  async addSection(courseId, sectionData)
  async addLesson(courseId, sectionId, lessonData)
  async updateContent(courseId, lessonId, content)

  // Enrollment Management
  async enrollStudent(courseId, userId)
  async updateProgress(enrollmentId, progressData)
  async generateCertificate(enrollmentId)

  // Analytics
  async getCourseAnalytics(courseId)
  async getStudentProgress(courseId, userId)
  async generatePerformanceReport(courseId)
  ```

### Controllers

#### Course Controller (`controllers/course.controller.js`)
- **API Endpoints**:
  ```javascript
  // Course Management
  POST   /courses                 // Create course
  GET    /courses                 // List courses
  GET    /courses/:id            // Get course details
  PATCH  /courses/:id            // Update course
  DELETE /courses/:id            // Delete course

  // Content Management
  POST   /courses/:id/sections           // Add section
  POST   /courses/:id/sections/:sid/lessons // Add lesson
  PATCH  /courses/:id/lessons/:lid       // Update lesson

  // Enrollment
  POST   /courses/:id/enroll            // Enroll student
  GET    /courses/:id/progress          // Get progress
  PATCH  /courses/:id/progress          // Update progress

  // Analytics
  GET    /courses/:id/analytics         // Get analytics
  GET    /courses/:id/reports           // Get reports
  ```

## Workflows

### 1. Course Creation and Management

#### Creating a New Course
```javascript
const courseData = {
  title: "Advanced Web Development",
  description: "Master modern web technologies",
  category: "Programming",
  level: "advanced",
  sections: [
    {
      title: "Modern JavaScript",
      order: 1,
      lessons: [
        {
          title: "ES6+ Features",
          type: "video",
          content: {
            videoUrl: "path/to/video",
            duration: 1800,
            transcript: "..."
          }
        }
      ]
    }
  ],
  settings: {
    enrollment: {
      type: "open",
      capacity: 100
    }
  }
};

// POST /api/courses
```

#### Adding Content
```javascript
const sectionData = {
  title: "React Fundamentals",
  order: 2,
  description: "Learn React basics"
};

const lessonData = {
  title: "Component Lifecycle",
  type: "interactive",
  content: {
    theory: "...",
    exercises: [...]
  }
};

// POST /api/courses/:id/sections
// POST /api/courses/:id/sections/:sid/lessons
```

### 2. Student Enrollment and Progress

#### Enrolling in a Course
```javascript
const enrollmentData = {
  userId: "user123",
  preferences: {
    notifications: true,
    language: "en"
  }
};

// POST /api/courses/:id/enroll
```

#### Updating Progress
```javascript
const progressData = {
  lessonId: "lesson123",
  status: "completed",
  timeSpent: 1200,
  score: 95
};

// PATCH /api/courses/:id/progress
```

## Integration Points

### 1. Learning Path Module
- Course inclusion in learning paths
- Progress synchronization
- Prerequisite validation

### 2. Content Module
- Content storage and delivery
- Media management
- Version control

### 3. Assessment Module
- Quiz integration
- Assignment management
- Grade calculation

### 4. Analytics Module
- Performance tracking
- Learning analytics
- Progress reporting

## Content Types and Delivery

### 1. Video Content
- Streaming support
- Quality options
- Playback controls
- Progress tracking
- Transcripts

### 2. Interactive Content
- Exercises
- Simulations
- Code editors
- Virtual labs
- Interactive diagrams

### 3. Text Content
- Rich text
- Code snippets
- Mathematical formulas
- Diagrams
- References

### 4. Downloadable Resources
- PDFs
- Source code
- Templates
- Worksheets
- Additional materials

## Analytics and Reporting

### 1. Course Analytics
```javascript
{
  overview: {
    totalEnrollments: Number,
    activeStudents: Number,
    completionRate: Number,
    averageProgress: Number
  },
  engagement: {
    averageTimePerLesson: Number,
    mostEngagingContent: Array,
    participationRate: Number
  },
  performance: {
    averageScores: Object,
    completionTrends: Array,
    skillProgress: Array
  }
}
```

### 2. Student Analytics
```javascript
{
  progress: {
    completedLessons: Number,
    timeSpent: Number,
    currentPosition: Object
  },
  performance: {
    scores: Array,
    strengths: Array,
    improvements: Array
  },
  engagement: {
    lastAccess: Date,
    activityPattern: Object,
    resourceUsage: Array
  }
}
```

## Best Practices

### 1. Course Design
- Clear learning objectives
- Structured content flow
- Varied content types
- Regular assessments
- Engaging activities

### 2. Content Organization
- Logical progression
- Consistent structure
- Clear navigation
- Resource optimization
- Version control

### 3. Student Engagement
- Interactive elements
- Progress feedback
- Achievement system
- Discussion opportunities
- Support resources

## Security

### 1. Access Control
- Role-based permissions
- Content protection
- Enrollment validation
- Progress verification

### 2. Content Security
- DRM for videos
- Download restrictions
- Copy protection
- Access logging

## Error Handling

The module implements comprehensive error handling for:
- Content access issues
- Progress tracking errors
- Enrollment conflicts
- Resource limitations
- System constraints

## Dependencies
- Mongoose (Database)
- Express (API)
- AWS S3 (Content storage)
- Redis (Caching)
- FFmpeg (Media processing)

## Usage Examples

### Course Creation
```javascript
// Create a new course
const course = await CourseService.createCourse({
  title: "Web Development",
  description: "Learn web development",
  sections: [...]
});

// Add content
await CourseService.addSection(course.id, {
  title: "HTML Basics",
  lessons: [...]
});
```

### Student Enrollment
```javascript
// Enroll a student
const enrollment = await CourseService.enrollStudent(
  courseId,
  userId,
  {
    startDate: new Date(),
    preferences: {...}
  }
);

// Track progress
await CourseService.updateProgress(
  enrollmentId,
  {
    lessonId: "lesson1",
    status: "completed",
    score: 95
  }
);
```

### Analytics
```javascript
// Get course analytics
const analytics = await CourseService.getCourseAnalytics(
  courseId,
  {
    period: "last30days",
    metrics: ["engagement", "performance"]
  }
);

// Generate reports
const report = await CourseService.generatePerformanceReport(
  courseId,
  {
    type: "detailed",
    format: "pdf"
  }
);
```
