# Curriculum API Documentation

## Overview

The Curriculum API provides endpoints for managing course curricula, including sections, items, and their relationships with courses and users. The API supports multi-tenancy and integrates with the identity management system.

## Authentication and Authorization

All endpoints require authentication using JWT tokens. Many endpoints also require specific permissions:
- `manageCourses`: Required for creating, updating, and deleting curricula
- Basic authentication: Required for viewing curricula and progress

## Data Models

### Curriculum
```typescript
{
    course: ObjectId;              // Reference to Course
    title: string;                 // Curriculum title
    description?: string;          // Optional description
    version: number;               // Curriculum version
    sections: Section[];           // Array of sections
    totalDuration: number;         // Total duration in minutes
    itemsCount: number;            // Total number of items
    status: 'draft' | 'published' | 'archived';
    completionCriteria: {
        requiredSections?: number;
        minTotalScore?: number;
        minCompletionPercentage: number;
    };
    schedule: {
        releaseDate?: Date;
        enrollmentEndDate?: Date;
        completionDeadline?: Date;
        isSequential: boolean;
        itemReleaseInterval: number;
    };
    settings: {
        allowSkip: boolean;
        showProgress: boolean;
        enableDiscussions: boolean;
        enablePeerReview: boolean;
        enableCertificates: boolean;
    };
    metadata: {
        keywords: string[];
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        estimatedCompletionTime: number;
        languages: string[];
    };
    organizationId: ObjectId;
    tenantId: ObjectId;
    createdBy: ObjectId;          // Reference to User
    updatedBy: ObjectId;          // Reference to User
    instructors: ObjectId[];      // Array of User references
    reviewers: ObjectId[];        // Array of User references
}
```

### Section
```typescript
{
    title: string;
    description?: string;
    order: number;
    duration: number;
    learningObjectives: string[];
    completionCriteria: {
        requiredItems?: number;
        requiredScore?: number;
    };
    items: Item[];
    status: 'draft' | 'published' | 'archived';
    instructors: ObjectId[];      // Reference to User
}
```

### Item
```typescript
{
    title: string;
    description?: string;
    type: 'video' | 'document' | 'quiz' | 'assignment' | 'live-session';
    contentId: ObjectId;
    duration: number;
    order: number;
    isPreview: boolean;
    isRequired: boolean;
    status: 'draft' | 'published' | 'archived';
    prerequisites: ObjectId[];    // Reference to other Items
    completionCriteria: {
        minScore?: number;
        minTimeSpent?: number;
        requiredActivities?: ('watch' | 'read' | 'submit' | 'participate')[];
    };
    metadata: {
        videoUrl?: string;
        documentUrl?: string;
        quizId?: ObjectId;
        assignmentId?: ObjectId;
        liveSessionUrl?: string;
        startTime?: Date;
        endTime?: Date;
    };
    resources: {
        title: string;
        type: string;
        url: string;
        isRequired: boolean;
    }[];
    instructors: ObjectId[];      // Reference to User
}
```

## API Endpoints

### Curriculum Management

#### Create Curriculum
- **POST** `/api/curriculums`
- **Auth:** Required (`manageCourses`)
- **Request Body:** Curriculum object
- **Response:** Created curriculum
```json
{
    "status": "success",
    "data": {
        "curriculum": {
            "_id": "ObjectId",
            "title": "Course Curriculum",
            ...
        }
    }
}
```

#### Get Curriculum
- **GET** `/api/curriculums/:curriculumId`
- **Auth:** Required
- **Response:** Curriculum object with populated references
```json
{
    "status": "success",
    "data": {
        "curriculum": {
            "_id": "ObjectId",
            "course": {
                "_id": "ObjectId",
                "title": "Course Title"
            },
            ...
        }
    }
}
```

#### Update Curriculum
- **PATCH** `/api/curriculums/:curriculumId`
- **Auth:** Required (`manageCourses`)
- **Request Body:** Partial curriculum object
- **Response:** Updated curriculum

#### Delete Curriculum
- **DELETE** `/api/curriculums/:curriculumId`
- **Auth:** Required (`manageCourses`)
- **Response:** 204 No Content

### Section Management

#### Add Section
- **POST** `/api/curriculums/:curriculumId/sections`
- **Auth:** Required (`manageCourses`)
- **Request Body:** Section object
- **Response:** Updated curriculum with new section

#### Update Section
- **PATCH** `/api/curriculums/:curriculumId/sections/:sectionId`
- **Auth:** Required (`manageCourses`)
- **Request Body:** Partial section object
- **Response:** Updated curriculum

#### Delete Section
- **DELETE** `/api/curriculums/:curriculumId/sections/:sectionId`
- **Auth:** Required (`manageCourses`)
- **Response:** Updated curriculum

#### Reorder Sections
- **PATCH** `/api/curriculums/:curriculumId/sections/reorder`
- **Auth:** Required (`manageCourses`)
- **Request Body:**
```json
{
    "orderData": [
        { "sectionId": "ObjectId", "order": 0 },
        { "sectionId": "ObjectId", "order": 1 }
    ]
}
```
- **Response:** Updated curriculum

### Item Management

#### Add Item
- **POST** `/api/curriculums/:curriculumId/sections/:sectionId/items`
- **Auth:** Required (`manageCourses`)
- **Request Body:** Item object
- **Response:** Updated curriculum with new item

#### Update Item
- **PATCH** `/api/curriculums/:curriculumId/sections/:sectionId/items/:itemId`
- **Auth:** Required (`manageCourses`)
- **Request Body:** Partial item object
- **Response:** Updated curriculum

#### Delete Item
- **DELETE** `/api/curriculums/:curriculumId/sections/:sectionId/items/:itemId`
- **Auth:** Required (`manageCourses`)
- **Response:** Updated curriculum

#### Reorder Items
- **PATCH** `/api/curriculums/:curriculumId/sections/:sectionId/items/reorder`
- **Auth:** Required (`manageCourses`)
- **Request Body:**
```json
{
    "orderData": [
        { "itemId": "ObjectId", "order": 0 },
        { "itemId": "ObjectId", "order": 1 }
    ]
}
```
- **Response:** Updated curriculum

### Course Integration

#### Get Curriculum by Course
- **GET** `/api/curriculums/course/:courseId`
- **Auth:** Required
- **Response:** Curriculum object for the specified course

## Special Features

### 1. Versioning
- Each curriculum has a version number
- When making significant changes, create a new version
- Previous versions remain accessible for enrolled students

### 2. Sequential Release
- Configure `schedule.isSequential` and `itemReleaseInterval`
- Items are released gradually based on enrollment date
- Use `getAvailableItems(enrollmentDate)` to get currently available items

### 3. Completion Criteria
- Set at curriculum, section, and item levels
- Support for different types of criteria:
  - Minimum scores
  - Time spent
  - Required activities
  - Completion percentage

### 4. Content Types
- Video lessons
- Documents
- Quizzes
- Assignments
- Live sessions
- Each type has specific metadata and completion criteria

### 5. Prerequisites
- Define prerequisites between items
- Enforce sequential completion when required
- Track completion status

### 6. Multi-tenant Support
- All operations are scoped to organization and tenant
- Data isolation between tenants
- Tenant-specific configurations

### 7. Identity Integration
- Instructors and reviewers linked to User model
- Permission-based access control
- User tracking for created/updated fields

## Error Handling

All endpoints may return these error responses:

### 400 Bad Request
```json
{
    "status": "error",
    "message": "Validation error details"
}
```

### 401 Unauthorized
```json
{
    "status": "error",
    "message": "Please authenticate"
}
```

### 403 Forbidden
```json
{
    "status": "error",
    "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
    "status": "error",
    "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
    "status": "error",
    "message": "Internal server error"
}
```

## Best Practices

1. **Versioning**
   - Create new versions for major curriculum changes
   - Keep old versions accessible for existing students

2. **Content Organization**
   - Group related items into sections
   - Use clear, descriptive titles
   - Add learning objectives to sections

3. **Prerequisites**
   - Define clear prerequisites
   - Consider both technical and knowledge requirements
   - Document prerequisites in descriptions

4. **Completion Tracking**
   - Set appropriate completion criteria
   - Consider different learning styles
   - Allow flexibility when possible

5. **Security**
   - Always validate user permissions
   - Scope data to organization and tenant
   - Validate content access rights

6. **Performance**
   - Use pagination for large curricula
   - Optimize queries with proper indexes
   - Cache frequently accessed data
