# Curriculum Module

## Overview
The Curriculum module is a comprehensive system for designing, managing, and delivering structured educational programs. It provides tools for creating curriculum frameworks, mapping learning outcomes, organizing content, and tracking progress across multiple courses and learning paths.

## Core Features

### 1. Curriculum Design
- Program structure
- Learning outcomes
- Course mapping
- Skill frameworks
- Assessment planning

### 2. Program Management
- Version control
- Change tracking
- Approval workflow
- Quality assurance
- Compliance tracking

### 3. Progress Tracking
- Student progress
- Outcome achievement
- Skill development
- Performance analytics
- Completion tracking

### 4. Integration Management
- Course alignment
- Resource mapping
- Assessment integration
- Certification tracking
- Analytics coordination

## Module Structure

### Models

#### 1. Curriculum Model (`models/curriculum.model.js`)
- **Purpose**: Defines curriculum structure and components
- **Key Components**:
  - Program information
  - Structure definition
  - Learning outcomes
  - Course mappings
  - Assessment framework

```javascript
{
  title: String,
  code: String,
  version: String,
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived']
  },
  framework: {
    type: String,
    structure: String,
    standards: [String],
    accreditation: [{
      body: String,
      status: String,
      validUntil: Date
    }]
  },
  structure: {
    levels: [{
      name: String,
      order: Number,
      description: String,
      requirements: {
        credits: Number,
        courses: Number,
        core: Number,
        elective: Number
      }
    }],
    tracks: [{
      name: String,
      description: String,
      requirements: Mixed
    }]
  },
  outcomes: [{
    code: String,
    description: String,
    category: String,
    level: String,
    assessmentCriteria: [{
      criterion: String,
      methods: [String],
      minimumScore: Number
    }]
  }],
  courses: [{
    courseId: ObjectId,
    level: String,
    track: String,
    type: {
      type: String,
      enum: ['core', 'elective', 'optional']
    },
    credits: Number,
    prerequisites: [ObjectId],
    outcomes: [{
      outcomeId: String,
      level: String,
      weight: Number
    }]
  }],
  assessments: [{
    type: String,
    description: String,
    weight: Number,
    methods: [String],
    schedule: Mixed
  }],
  metadata: {
    department: String,
    field: String,
    duration: Number,
    credits: Number,
    language: String,
    tags: [String]
  },
  quality: {
    reviews: [{
      reviewer: ObjectId,
      date: Date,
      status: String,
      comments: String
    }],
    metrics: [{
      name: String,
      value: Number,
      target: Number
    }]
  }
}
```

#### 2. Progress Model (`models/curriculum-progress.model.js`)
- **Purpose**: Tracks student progress through curriculum
- **Key Components**:
  - Completion status
  - Outcome achievement
  - Assessment results
  - Skill development

```javascript
{
  studentId: ObjectId,
  curriculumId: ObjectId,
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'withdrawn']
  },
  progress: {
    level: String,
    track: String,
    credits: {
      earned: Number,
      required: Number,
      distribution: Mixed
    },
    courses: [{
      courseId: ObjectId,
      status: String,
      grade: String,
      completedAt: Date
    }]
  },
  outcomes: [{
    outcomeId: String,
    status: String,
    evidence: [{
      type: String,
      reference: Mixed,
      score: Number,
      date: Date
    }]
  }],
  skills: [{
    name: String,
    level: String,
    progress: Number,
    validations: [{
      method: String,
      score: Number,
      date: Date
    }]
  }],
  analytics: {
    gpa: Number,
    completion: Number,
    pace: Number,
    engagement: Number
  }
}
```

### Services

#### Curriculum Service (`services/curriculum.service.js`)
- **Core Functions**:
  ```javascript
  // Curriculum Management
  async createCurriculum(data)
  async updateCurriculum(id, updates)
  async publishCurriculum(id)
  async archiveCurriculum(id)

  // Progress Management
  async enrollStudent(curriculumId, studentId)
  async updateProgress(progressId, data)
  async evaluateOutcomes(progressId)
  async generateTranscript(progressId)

  // Analysis
  async analyzeCurriculumEffectiveness(id)
  async trackOutcomeAchievement(id)
  async generateProgressReport(progressId)
  ```

### Controllers

#### Curriculum Controller (`controllers/curriculum.controller.js`)
- **API Endpoints**:
  ```javascript
  // Curriculum Management
  POST   /curriculum            // Create curriculum
  GET    /curriculum           // List curricula
  GET    /curriculum/:id       // Get curriculum
  PATCH  /curriculum/:id       // Update curriculum
  DELETE /curriculum/:id       // Delete curriculum

  // Progress Management
  POST   /curriculum/:id/enroll    // Enroll student
  GET    /curriculum/:id/progress  // Get progress
  PATCH  /progress/:id            // Update progress

  // Analysis
  GET    /curriculum/:id/analytics // Get analytics
  GET    /curriculum/:id/outcomes  // Get outcomes
  GET    /progress/:id/transcript  // Get transcript
  ```

## Workflows

### 1. Curriculum Design

#### Creating Curriculum Structure
```javascript
const curriculumData = {
  title: "Computer Science Program",
  code: "CS-2025",
  framework: {
    type: "semester",
    standards: ["IEEE", "ACM"]
  },
  structure: {
    levels: [
      {
        name: "Year 1",
        requirements: {
          credits: 30,
          core: 24,
          elective: 6
        }
      }
    ],
    tracks: [
      {
        name: "Software Engineering",
        requirements: {
          specialization: 40,
          project: true
        }
      }
    ]
  }
};

// POST /api/curriculum
```

#### Defining Learning Outcomes
```javascript
const outcomes = {
  outcomes: [
    {
      code: "CS-PL-1",
      description: "Apply programming concepts",
      category: "Technical Skills",
      assessmentCriteria: [
        {
          criterion: "Code Implementation",
          methods: ["project", "exam"],
          minimumScore: 70
        }
      ]
    }
  ]
};

// PATCH /api/curriculum/:id
```

### 2. Progress Tracking

#### Enrolling Student
```javascript
const enrollment = {
  studentId: "student123",
  track: "Software Engineering",
  startDate: "2025-01-09"
};

// POST /api/curriculum/:id/enroll
```

#### Updating Progress
```javascript
const progressUpdate = {
  courseCompletion: {
    courseId: "course123",
    grade: "A",
    completedAt: "2025-01-09"
  },
  outcomeAchievement: {
    outcomeId: "CS-PL-1",
    evidence: {
      type: "project",
      score: 85
    }
  }
};

// PATCH /api/progress/:id
```

## Integration Points

### 1. Course Module
- Course mapping
- Progress tracking
- Outcome alignment

### 2. Assessment Module
- Outcome evaluation
- Skill validation
- Performance tracking

### 3. Analytics Module
- Progress analysis
- Outcome achievement
- Program effectiveness

## Curriculum Components

### 1. Program Structure
```javascript
{
  structure: {
    type: "semester",
    duration: 8,
    credits: 120,
    distribution: {
      core: 80,
      specialization: 30,
      elective: 10
    }
  }
}
```

### 2. Course Mapping
```javascript
{
  courseMap: {
    semester1: {
      core: ["CS101", "MATH101"],
      elective: ["ENG101"]
    },
    semester2: {
      core: ["CS102", "MATH102"],
      elective: ["PHY101"]
    }
  }
}
```

### 3. Assessment Framework
```javascript
{
  assessment: {
    continuous: {
      weight: 40,
      components: ["quiz", "assignment"]
    },
    terminal: {
      weight: 60,
      components: ["exam", "project"]
    }
  }
}
```

## Analytics and Reporting

### 1. Program Analytics
```javascript
{
  effectiveness: {
    completion: {
      rate: Number,
      time: Number
    },
    outcomes: {
      achievement: Number,
      distribution: Object
    },
    progression: {
      retention: Number,
      advancement: Number
    }
  }
}
```

### 2. Student Analytics
```javascript
{
  progress: {
    credits: {
      completed: Number,
      remaining: Number
    },
    outcomes: {
      achieved: Number,
      inProgress: Number
    },
    pace: {
      actual: Number,
      expected: Number
    }
  }
}
```

## Best Practices

### 1. Curriculum Design
- Clear objectives
- Structured progression
- Balanced assessment
- Regular review
- Industry alignment

### 2. Outcome Mapping
- Clear definitions
- Measurable criteria
- Multiple assessments
- Regular validation
- Continuous improvement

### 3. Progress Tracking
- Regular updates
- Multiple measures
- Clear feedback
- Intervention triggers
- Support mechanisms

## Security

### 1. Access Control
- Role-based access
- Version control
- Audit logging
- Data protection
- Privacy compliance

### 2. Quality Assurance
- Review process
- Approval workflow
- Change tracking
- Compliance checking
- Standard validation

## Error Handling

The module handles:
- Structural conflicts
- Prerequisite violations
- Progress inconsistencies
- Assessment conflicts
- Data validation errors

## Dependencies
- Mongoose (Database)
- Express (API)
- Joi (Validation)
- date-fns (Date handling)
- pdf-lib (Document generation)

## Usage Examples

### Curriculum Management
```javascript
// Create curriculum
const curriculum = await CurriculumService.createCurriculum({
  title: "Data Science Program",
  structure: {...},
  outcomes: [...]
});

// Update structure
await CurriculumService.updateCurriculum(
  curriculumId,
  {
    structure: {
      levels: [...],
      tracks: [...]
    }
  }
);
```

### Progress Management
```javascript
// Track progress
await CurriculumService.updateProgress(
  progressId,
  {
    courseCompletion: {...},
    outcomeAchievement: {...}
  }
);

// Generate transcript
const transcript = await CurriculumService.generateTranscript(
  progressId,
  {
    format: "pdf",
    details: "full"
  }
);
```

### Analytics
```javascript
// Analyze effectiveness
const analysis = await CurriculumService.analyzeCurriculumEffectiveness(
  curriculumId,
  {
    period: "academic_year",
    metrics: ["completion", "outcomes"]
  }
);

// Track outcomes
const outcomes = await CurriculumService.trackOutcomeAchievement(
  curriculumId,
  {
    cohort: "2025",
    detail: "full"
  }
);
```
