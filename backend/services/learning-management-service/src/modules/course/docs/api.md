# Learning Management Service API Documentation

## Course APIs

### Create Course
- **URL**: `/api/courses`
- **Method**: `POST`
- **Access**: Private (requires 'manageCourses' permission)
- **Request Body**:
```json
{
    "title": "string (required)",
    "description": "string (required)",
    "thumbnail": "string (optional)",
    "instructor": "ObjectId (required)",
    "category": "ObjectId (required)",
    "duration": "number (required, in minutes)",
    "price": "number (required, default: 0)",
    "status": "string (enum: draft, published, archived)",
    "enrollmentType": "string (enum: free, paid, restricted)",
    "prerequisites": ["ObjectId (Course)"],
    "tags": ["string"],
    "organizationId": "ObjectId (required)",
    "tenantId": "ObjectId (required)"
}
```
- **Success Response**: `201 Created`
```json
{
    "status": "success",
    "data": {
        "course": {
            "_id": "ObjectId",
            "title": "string",
            ...
        }
    }
}
```

### Get Course
- **URL**: `/api/courses/:courseId`
- **Method**: `GET`
- **Access**: Private
- **Success Response**: `200 OK`
```json
{
    "status": "success",
    "data": {
        "course": {
            "_id": "ObjectId",
            "title": "string",
            ...
        }
    }
}
```

### Update Course
- **URL**: `/api/courses/:courseId`
- **Method**: `PATCH`
- **Access**: Private (requires 'manageCourses' permission)
- **Request Body**: Any course fields to update
- **Success Response**: `200 OK`

### Delete Course
- **URL**: `/api/courses/:courseId`
- **Method**: `DELETE`
- **Access**: Private (requires 'manageCourses' permission)
- **Success Response**: `204 No Content`

### List Courses
- **URL**: `/api/courses`
- **Method**: `GET`
- **Access**: Private
- **Query Parameters**:
  - title: string
  - category: ObjectId
  - instructor: ObjectId
  - status: enum
  - enrollmentType: enum
  - minPrice: number
  - maxPrice: number
  - sortBy: string
  - limit: number (1-100, default: 10)
  - page: number (min: 1, default: 1)
  - organizationId: ObjectId
  - tenantId: ObjectId
- **Success Response**: `200 OK`
```json
{
    "status": "success",
    "data": {
        "courses": [],
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "totalResults": 0
    }
}
```

## Course Category APIs

### Create Category
- **URL**: `/api/course-categories`
- **Method**: `POST`
- **Access**: Private (requires 'manageCourses' permission)
- **Request Body**:
```json
{
    "name": "string (required)",
    "description": "string (optional)",
    "parentCategory": "ObjectId (optional)",
    "icon": "string (optional)",
    "status": "string (enum: active, inactive)",
    "organizationId": "ObjectId (required)",
    "tenantId": "ObjectId (required)"
}
```
- **Success Response**: `201 Created`

### Get Category
- **URL**: `/api/course-categories/:categoryId`
- **Method**: `GET`
- **Access**: Private
- **Success Response**: `200 OK`

### Update Category
- **URL**: `/api/course-categories/:categoryId`
- **Method**: `PATCH`
- **Access**: Private (requires 'manageCourses' permission)
- **Request Body**: Any category fields to update
- **Success Response**: `200 OK`

### Delete Category
- **URL**: `/api/course-categories/:categoryId`
- **Method**: `DELETE`
- **Access**: Private (requires 'manageCourses' permission)
- **Success Response**: `204 No Content`

### List Categories
- **URL**: `/api/course-categories`
- **Method**: `GET`
- **Access**: Private
- **Query Parameters**:
  - name: string
  - status: enum
  - parentCategory: ObjectId
  - sortBy: string
  - limit: number (1-100, default: 10)
  - page: number (min: 1, default: 1)
  - organizationId: ObjectId
  - tenantId: ObjectId
- **Success Response**: `200 OK`

### Get Category Hierarchy
- **URL**: `/api/course-categories/hierarchy`
- **Method**: `GET`
- **Access**: Private
- **Success Response**: `200 OK`
```json
{
    "status": "success",
    "data": {
        "hierarchy": [
            {
                "_id": "ObjectId",
                "name": "string",
                "children": [
                    {
                        "_id": "ObjectId",
                        "name": "string",
                        "children": []
                    }
                ]
            }
        ]
    }
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
    "status": "error",
    "message": "Validation error message"
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
    "message": "You do not have permission to perform this action"
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
