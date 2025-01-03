# User Service

The User Service is a microservice responsible for managing users, roles, and permissions in the Bodhi Learn platform. It provides comprehensive user management functionality with support for multi-tenancy, role-based access control, and profile management.

## Features

- User Management (CRUD operations)
- Role-Based Access Control (RBAC)
- Profile Management
- Multi-tenant Support
- Event-driven Architecture
- Caching Layer
- Authentication & Authorization
- Rate Limiting

## Tech Stack

- Node.js
- Express.js
- PostgreSQL (User data)
- MongoDB (Permissions)
- Redis (Caching)
- RabbitMQ (Event handling)
- Jest (Testing)
- Docker

## Prerequisites

- Node.js >= 16
- PostgreSQL >= 13
- MongoDB >= 5
- Redis >= 6
- RabbitMQ >= 3.8

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd user-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the service:
   ```bash
   npm run start
   ```

## Configuration

The service can be configured through environment variables:

- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Server port
- `DATABASE_URL`: PostgreSQL connection URL
- `MONGODB_URL`: MongoDB connection URL
- `REDIS_URL`: Redis connection URL
- `RABBITMQ_URL`: RabbitMQ connection URL
- `JWT_SECRET`: Secret for JWT signing
- `RATE_LIMIT_WINDOW`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX`: Maximum requests per window

## API Documentation

### Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Users

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Update user status

#### Profiles

- `GET /api/profiles/:userId` - Get profile
- `PUT /api/profiles/:userId` - Update profile
- `PATCH /api/profiles/:userId/avatar` - Update avatar

#### Roles

- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role details
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Database Migrations

Run migrations:
```bash
npm run migrate
```

Rollback migrations:
```bash
npm run migrate:undo
```

Create new migration:
```bash
npm run migrate:create name_of_migration
```

## Event System

The service uses RabbitMQ for event handling. Events are published for:

- User creation/updates/deletion
- Role changes
- Profile updates
- Status changes

## Caching

Redis is used for caching:

- User data
- Profiles
- Roles and permissions
- API responses

Cache invalidation is handled automatically through the event system.

## Security

- JWT-based authentication
- Role-based authorization
- Rate limiting
- Input validation
- Password hashing
- XSS protection
- CORS configuration

## Error Handling

The service uses a centralized error handling system with:

- Standard error formats
- Detailed error logging
- Custom error types
- Error tracking

## Monitoring

The service exposes metrics for:

- Request rates
- Error rates
- Response times
- Cache hit rates
- Database performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
