# Assessment Module

## Overview
The Assessment module is a comprehensive system for evaluating student learning through various assessment types, including assignments, projects, and practical evaluations. It works in conjunction with the Quiz module to provide a complete assessment solution.

## Core Features

### 1. Assessment Management
- Multiple assessment types
- Rubric-based evaluation
- Automated and manual grading
- Feedback management
- Deadline handling

### 2. Submission Handling
- File uploads
- Version control
- Plagiarism detection
- Review process
- Feedback system

### 3. Evaluation Tools
- Rubric builder
- Grading templates
- Batch grading
- Peer review
- Feedback templates

## Module Structure

### Models

#### 1. Assessment Model (`models/assessment.model.js`)
- **Purpose**: Defines assessment structure and requirements
- **Key Components**:
  - Assessment details
  - Requirements
  - Rubrics
  - Settings
  - Deadlines

```javascript
{
  title: String,
  description: String,
  type: String, // assignment, project, practical
  rubric: [{
    criterion: String,
    description: String,
    points: Number,
    levels: [{
      level: String,
      description: String,
      score: Number
    }]
  }],
  settings: {
    deadline: Date,
    maxAttempts: Number,
    allowLateSubmission: Boolean,
    requirePeerReview: Boolean
  }
}
```

#### 2. Submission Model (`models/submission.model.js`)
- **Purpose**: Tracks student submissions and evaluations
- **Key Components**:
  - Submission content
  - Files
  - Evaluation
  - Feedback
  - Timeline

```javascript
{
  assessmentId: ObjectId,
  userId: ObjectId,
  content: {
    text: String,
    files: [{
      name: String,
      path: String,
      type: String
    }]
  },
  evaluation: {
    score: Number,
    rubricScores: [{
      criterionId: ObjectId,
      score: Number,
      feedback: String
    }],
    feedback: String,
    status: String
  },
  timeline: {
    submitted: Date,
    evaluated: Date,
    revised: Date
  }
}
```

### Services

#### Assessment Service (`services/assessment.service.js`)
- **Core Functions**:
  - Assessment management
  - Submission handling
  - Evaluation processing
  - Feedback management
  - Analytics generation

### Controllers

#### Assessment Controller (`controllers/assessment.controller.js`)
- **API Endpoints**:
  - Assessment management
  - Submission handling
  - Evaluation
  - Analytics
  - Feedback

### Routes

#### Assessment Routes (`routes/assessment.routes.js`)
```javascript
POST    /api/assessments                    // Create assessment
GET     /api/assessments                    // List assessments
GET     /api/assessments/:id                // Get assessment details
PATCH   /api/assessments/:id                // Update assessment
DELETE  /api/assessments/:id                // Delete assessment

POST    /api/assessments/:id/submissions    // Submit assessment
GET     /api/assessments/:id/submissions    // Get submissions
PATCH   /api/submissions/:id                // Update submission
POST    /api/submissions/:id/evaluate       // Evaluate submission
GET     /api/assessments/:id/analytics      // Get analytics
```

## Workflows

### 1. Creating an Assessment
1. Instructor creates assessment with:
   - Basic information
   - Requirements
   - Rubric
   - Settings

```javascript
{
  "title": "Web Application Project",
  "description": "Build a full-stack web application",
  "type": "project",
  "rubric": [
    {
      "criterion": "Code Quality",
      "description": "Code organization and best practices",
      "points": 20,
      "levels": [
        {
          "level": "Excellent",
          "description": "Well-organized, documented code",
          "score": 20
        }
      ]
    }
  ],
  "settings": {
    "deadline": "2025-02-09T00:00:00Z",
    "maxAttempts": 2
  }
}
```

### 2. Submitting Work
1. Student submits work
2. System validates submission
3. Checks for plagiarism
4. Processes files
5. Notifies evaluators

```javascript
{
  "content": {
    "text": "Project submission description",
    "files": [
      {
        "name": "project.zip",
        "type": "application/zip"
      }
    ]
  }
}
```

### 3. Evaluation Process
1. Evaluator reviews submission
2. Applies rubric
3. Provides feedback
4. Calculates score
5. Notifies student

```javascript
{
  "evaluation": {
    "rubricScores": [
      {
        "criterionId": "criterion1",
        "score": 18,
        "feedback": "Excellent code organization"
      }
    ],
    "feedback": "Great work overall"
  }
}
```

## Integration Points

### 1. Learning Path Module
- Assessment milestones
- Progress tracking
- Completion criteria

### 2. Quiz Module
- Combined assessments
- Score aggregation
- Progress tracking

### 3. Analytics Module
- Performance analysis
- Learning analytics
- Progress tracking

## Analytics and Reporting

### 1. Individual Analytics
- Submission history
- Performance trends
- Skill development
- Time management

### 2. Assessment Analytics
- Completion rates
- Score distribution
- Time patterns
- Common issues
- Success factors

## Assessment Types

1. **Assignments**
   - Written work
   - Problem sets
   - Research papers
   - Case studies

2. **Projects**
   - Individual projects
   - Group projects
   - Portfolio work
   - Practical applications

3. **Practical Evaluations**
   - Lab work
   - Field work
   - Demonstrations
   - Presentations

## Best Practices

1. **Assessment Design**
   - Clear objectives
   - Detailed instructions
   - Fair evaluation criteria
   - Reasonable deadlines

2. **Rubric Development**
   - Clear criteria
   - Objective measures
   - Detailed descriptions
   - Fair point distribution

3. **Feedback Design**
   - Constructive comments
   - Specific suggestions
   - Balanced feedback
   - Growth-oriented

## Error Handling

The module handles:
- Invalid submissions
- File processing errors
- Evaluation conflicts
- Deadline violations
- Access control issues

## Security

1. **Authentication**
   - Required for all endpoints
   - Role-based access
   - Session validation

2. **File Security**
   - Secure uploads
   - File validation
   - Storage security
   - Access control

## Dependencies
- Mongoose (Database)
- Express (Routing)
- Multer (File handling)
- date-fns (Time management)

## Usage Examples

### Creating an Assessment
```javascript
const assessment = {
  title: "Final Project",
  description: "Build a web application",
  type: "project",
  rubric: [
    {
      criterion: "Implementation",
      points: 40
    }
  ],
  settings: {
    deadline: "2025-02-09"
  }
};

// POST /api/assessments
```

### Submitting Work
```javascript
const submission = {
  content: {
    text: "Project submission",
    files: [/* file data */]
  }
};

// POST /api/assessments/:id/submissions
```

### Evaluating Submission
```javascript
const evaluation = {
  rubricScores: [
    {
      criterionId: "criterion1",
      score: 35
    }
  ],
  feedback: "Excellent work"
};

// POST /api/submissions/:id/evaluate
```

### Getting Analytics
```javascript
// GET /api/assessments/:id/analytics
const analytics = await getAssessmentAnalytics(assessmentId);
```
