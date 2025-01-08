# Quiz Module

## Overview
The Quiz module is a comprehensive assessment system designed to create, manage, and evaluate quizzes within the learning management service. It supports various question types, automated grading, detailed analytics, and integration with learning paths.

## Core Features

### 1. Quiz Management
- Create and manage quizzes
- Multiple question types support
- Configurable settings
- Scoring rules
- Time limits

### 2. Quiz Attempts
- Attempt tracking
- Real-time evaluation
- Progress saving
- Time tracking
- Multiple attempts support

### 3. Analytics
- Performance metrics
- Question analysis
- Time analysis
- Difficulty assessment
- Score distribution

## Module Structure

### Models

#### 1. Quiz Model (`models/quiz.model.js`)
- **Purpose**: Defines quiz structure and properties
- **Key Components**:
  - Basic information
  - Questions
  - Settings
  - Statistics
  - Metadata

```javascript
{
  title: String,
  description: String,
  questions: [{
    type: String,
    content: String,
    options: [String],
    correctAnswer: Mixed,
    points: Number
  }],
  settings: {
    timeLimit: Number,
    maxAttempts: Number,
    passingScore: Number
  }
}
```

#### 2. Quiz Attempt Model (`models/quiz-attempt.model.js`)
- **Purpose**: Tracks individual quiz attempts
- **Key Components**:
  - User responses
  - Scoring
  - Timing
  - Feedback
  - Status

```javascript
{
  quizId: ObjectId,
  userId: ObjectId,
  answers: [{
    questionId: ObjectId,
    response: Mixed,
    isCorrect: Boolean,
    score: Number
  }],
  totalScore: Number,
  startTime: Date,
  endTime: Date
}
```

### Services

#### Quiz Service (`services/quiz.service.js`)
- **Core Functions**:
  - Quiz CRUD operations
  - Attempt management
  - Grading
  - Analytics
  - Statistics

### Controllers

#### Quiz Controller (`controllers/quiz.controller.js`)
- **API Endpoints**:
  - Quiz management
  - Attempt handling
  - Results retrieval
  - Analytics

### Routes

#### Quiz Routes (`routes/quiz.routes.js`)
```javascript
POST    /api/quizzes              // Create quiz
GET     /api/quizzes              // List quizzes
GET     /api/quizzes/:quizId      // Get quiz details
PATCH   /api/quizzes/:quizId      // Update quiz
DELETE  /api/quizzes/:quizId      // Delete quiz

POST    /api/quizzes/:quizId/attempts      // Start attempt
PATCH   /api/quizzes/attempts/:attemptId   // Submit answers
GET     /api/quizzes/:quizId/results       // Get results
GET     /api/quizzes/:quizId/analytics     // Get analytics
```

## Workflows

### 1. Creating a Quiz
1. Instructor creates quiz with:
   - Basic information
   - Questions and answers
   - Settings
   - Grading rules

```javascript
{
  "title": "JavaScript Basics",
  "description": "Test your JavaScript knowledge",
  "questions": [
    {
      "type": "multiple_choice",
      "content": "What is JavaScript?",
      "options": ["Programming Language", "Markup Language", "Style Sheet"],
      "correctAnswer": 0,
      "points": 10
    }
  ],
  "settings": {
    "timeLimit": 30,
    "maxAttempts": 2,
    "passingScore": 70
  }
}
```

### 2. Taking a Quiz
1. User starts quiz attempt
2. System tracks time and responses
3. User submits answers
4. System grades and provides feedback

```javascript
// Starting attempt
POST /api/quizzes/:quizId/attempts

// Submitting answers
{
  "answers": [
    {
      "questionId": "questionId1",
      "response": 0
    }
  ]
}
```

### 3. Reviewing Results
1. System calculates scores
2. Generates feedback
3. Updates statistics
4. Provides analytics

```javascript
{
  "score": 85,
  "feedback": [
    {
      "questionId": "questionId1",
      "isCorrect": true,
      "explanation": "Correct! JavaScript is a programming language."
    }
  ]
}
```

## Integration Points

### 1. Learning Path Module
- Quizzes as assessment milestones
- Progress tracking
- Score reporting

### 2. Course Module
- Course assessments
- Knowledge checks
- Final exams

### 3. Analytics Module
- Performance data
- Learning analytics
- Progress tracking

## Analytics and Reporting

### 1. Individual Analytics
- Score history
- Time analysis
- Question performance
- Skill assessment

### 2. Quiz Analytics
- Average scores
- Completion rates
- Question difficulty
- Time distribution
- Success patterns

## Question Types

1. **Multiple Choice**
   - Single correct answer
   - Multiple correct answers
   - Weighted scoring

2. **True/False**
   - Binary choices
   - Simple scoring

3. **Short Answer**
   - Text responses
   - Pattern matching
   - Manual grading option

4. **Essay**
   - Long-form responses
   - Rubric-based grading
   - Manual review

## Best Practices

1. **Quiz Design**
   - Clear instructions
   - Balanced difficulty
   - Varied question types
   - Appropriate time limits

2. **Question Writing**
   - Clear language
   - Unambiguous answers
   - Relevant content
   - Appropriate difficulty

3. **Feedback Design**
   - Constructive feedback
   - Detailed explanations
   - Learning resources
   - Improvement suggestions

## Error Handling

The module handles:
- Invalid quiz structures
- Attempt violations
- Timing issues
- Grading errors
- Submission conflicts

## Security

1. **Authentication**
   - Required for all endpoints
   - Role-based access
   - Session validation

2. **Anti-Cheating**
   - Time tracking
   - Answer validation
   - Attempt limiting
   - Random question order

## Dependencies
- Mongoose (Database)
- Express (Routing)
- Joi (Validation)
- date-fns (Time handling)

## Usage Examples

### Creating a Quiz
```javascript
const quiz = {
  title: "JavaScript Fundamentals",
  description: "Test your JavaScript knowledge",
  questions: [
    {
      type: "multiple_choice",
      content: "What is JavaScript?",
      options: ["Programming Language", "Markup Language"],
      correctAnswer: 0
    }
  ],
  settings: {
    timeLimit: 30,
    maxAttempts: 2
  }
};

// POST /api/quizzes
```

### Starting a Quiz Attempt
```javascript
// POST /api/quizzes/:quizId/attempts
const attempt = await startQuizAttempt(quizId);
```

### Submitting Answers
```javascript
const submission = {
  answers: [
    {
      questionId: "q1",
      response: 0
    }
  ]
};

// PATCH /api/quizzes/attempts/:attemptId
```

### Getting Results
```javascript
// GET /api/quizzes/:quizId/results
const results = await getQuizResults(quizId);
```
