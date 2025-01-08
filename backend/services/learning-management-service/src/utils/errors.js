class BaseError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends BaseError {
    constructor(message) {
        super(message || 'Validation Error', 400);
    }
}

class NotFoundError extends BaseError {
    constructor(message) {
        super(message || 'Resource Not Found', 404);
    }
}

class UnauthorizedError extends BaseError {
    constructor(message) {
        super(message || 'Unauthorized', 401);
    }
}

class ForbiddenError extends BaseError {
    constructor(message) {
        super(message || 'Forbidden', 403);
    }
}

class ConflictError extends BaseError {
    constructor(message) {
        super(message || 'Resource Conflict', 409);
    }
}

class ServiceError extends BaseError {
    constructor(message) {
        super(message || 'Service Error', 500);
    }
}

module.exports = {
    BaseError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    ServiceError
};
