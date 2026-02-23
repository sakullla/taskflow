export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super("AUTHENTICATION_ERROR", message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super("AUTHORIZATION_ERROR", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super("DATABASE_ERROR", message, 500);
  }
}
