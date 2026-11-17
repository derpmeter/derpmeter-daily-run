"""
Centralized Error Code System for Toonify API

Each error has:
- code: A unique string identifier for the frontend to map to i18n messages
- status_code: HTTP status code
- detail: Default English message (used as fallback)

Frontend should use the `code` field to display localized messages via i18n.
"""

from enum import Enum
from typing import Optional
from fastapi import HTTPException
from pydantic import BaseModel


class ErrorCode(str, Enum):
    """
    Unique error codes for client-side i18n mapping.
    Format: CATEGORY_SPECIFIC_ERROR
    """
    # Authentication Errors (401)
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID"
    AUTH_CREDENTIALS_INVALID = "AUTH_CREDENTIALS_INVALID"
    AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED"
    AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND"
    
    # Authorization Errors (403)
    FORBIDDEN_RESOURCE = "FORBIDDEN_RESOURCE"
    FORBIDDEN_WORKSPACE = "FORBIDDEN_WORKSPACE"
    FORBIDDEN_PROJECT = "FORBIDDEN_PROJECT"
    
    # Resource Not Found Errors (404)
    NOT_FOUND_USER = "NOT_FOUND_USER"
    NOT_FOUND_PROJECT = "NOT_FOUND_PROJECT"
    NOT_FOUND_EPISODE = "NOT_FOUND_EPISODE"
    NOT_FOUND_CUT = "NOT_FOUND_CUT"
    NOT_FOUND_CHARACTER = "NOT_FOUND_CHARACTER"
    NOT_FOUND_STYLE = "NOT_FOUND_STYLE"
    NOT_FOUND_WORKSPACE = "NOT_FOUND_WORKSPACE"
    NOT_FOUND_SUGGESTION = "NOT_FOUND_SUGGESTION"
    NOT_FOUND_GENRE = "NOT_FOUND_GENRE"
    
    # Payment/Credits Errors (402)
    PAYMENT_INSUFFICIENT_CREDITS = "PAYMENT_INSUFFICIENT_CREDITS"
    PAYMENT_REQUIRED = "PAYMENT_REQUIRED"
    
    # Validation Errors (400/422)
    VALIDATION_INVALID_INPUT = "VALIDATION_INVALID_INPUT"
    VALIDATION_INVALID_UUID = "VALIDATION_INVALID_UUID"
    VALIDATION_DUPLICATE_ENTRY = "VALIDATION_DUPLICATE_ENTRY"
    VALIDATION_MISSING_REQUIRED = "VALIDATION_MISSING_REQUIRED"
    
    # Conflict Errors (409)
    CONFLICT_DUPLICATE_NAME = "CONFLICT_DUPLICATE_NAME"
    CONFLICT_RESOURCE_EXISTS = "CONFLICT_RESOURCE_EXISTS"
    
    # Rate Limiting (429)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # Server Errors (500)
    SERVER_INTERNAL_ERROR = "SERVER_INTERNAL_ERROR"
    SERVER_AI_SERVICE_ERROR = "SERVER_AI_SERVICE_ERROR"
    SERVER_STORAGE_ERROR = "SERVER_STORAGE_ERROR"
    SERVER_DATABASE_ERROR = "SERVER_DATABASE_ERROR"
    
    # Generation Errors (custom business logic)
    GENERATION_FAILED = "GENERATION_FAILED"
    GENERATION_TIMEOUT = "GENERATION_TIMEOUT"
    GENERATION_QUOTA_EXCEEDED = "GENERATION_QUOTA_EXCEEDED"


class ErrorResponse(BaseModel):
    """
    Standard error response format.
    Frontend should check `code` for i18n mapping.
    """
    code: str
    detail: str
    status_code: int
    extra: Optional[dict] = None


class AppException(HTTPException):
    """
    Custom application exception that includes error code for i18n support.
    """
    def __init__(
        self,
        error_code: ErrorCode,
        detail: Optional[str] = None,
        extra: Optional[dict] = None,
    ):
        self.error_code = error_code
        self.extra = extra
        
        # Map error codes to HTTP status codes
        status_code_map = {
            # 401 - Unauthorized
            ErrorCode.AUTH_TOKEN_EXPIRED: 401,
            ErrorCode.AUTH_TOKEN_INVALID: 401,
            ErrorCode.AUTH_CREDENTIALS_INVALID: 401,
            ErrorCode.AUTH_SESSION_EXPIRED: 401,
            ErrorCode.AUTH_USER_NOT_FOUND: 401,
            
            # 403 - Forbidden
            ErrorCode.FORBIDDEN_RESOURCE: 403,
            ErrorCode.FORBIDDEN_WORKSPACE: 403,
            ErrorCode.FORBIDDEN_PROJECT: 403,
            
            # 404 - Not Found
            ErrorCode.NOT_FOUND_USER: 404,
            ErrorCode.NOT_FOUND_PROJECT: 404,
            ErrorCode.NOT_FOUND_EPISODE: 404,
            ErrorCode.NOT_FOUND_CUT: 404,
            ErrorCode.NOT_FOUND_CHARACTER: 404,
            ErrorCode.NOT_FOUND_STYLE: 404,
            ErrorCode.NOT_FOUND_WORKSPACE: 404,
            ErrorCode.NOT_FOUND_SUGGESTION: 404,
            ErrorCode.NOT_FOUND_GENRE: 404,
            
            # 402 - Payment Required
            ErrorCode.PAYMENT_INSUFFICIENT_CREDITS: 402,
            ErrorCode.PAYMENT_REQUIRED: 402,
            
            # 400/422 - Validation
            ErrorCode.VALIDATION_INVALID_INPUT: 400,
            ErrorCode.VALIDATION_INVALID_UUID: 400,
            ErrorCode.VALIDATION_DUPLICATE_ENTRY: 400,
            ErrorCode.VALIDATION_MISSING_REQUIRED: 422,
            
            # 409 - Conflict
            ErrorCode.CONFLICT_DUPLICATE_NAME: 409,
            ErrorCode.CONFLICT_RESOURCE_EXISTS: 409,
            
            # 429 - Rate Limit
            ErrorCode.RATE_LIMIT_EXCEEDED: 429,
            
            # 500 - Server Errors
            ErrorCode.SERVER_INTERNAL_ERROR: 500,
            ErrorCode.SERVER_AI_SERVICE_ERROR: 500,
            ErrorCode.SERVER_STORAGE_ERROR: 500,
            ErrorCode.SERVER_DATABASE_ERROR: 500,
            
            # Custom business logic errors
            ErrorCode.GENERATION_FAILED: 500,
            ErrorCode.GENERATION_TIMEOUT: 504,
            ErrorCode.GENERATION_QUOTA_EXCEEDED: 402,
        }
        
        status_code = status_code_map.get(error_code, 500)
        
        # Default messages for each error code
        default_messages = {
            ErrorCode.AUTH_TOKEN_EXPIRED: "Authentication token has expired",
            ErrorCode.AUTH_TOKEN_INVALID: "Invalid authentication token",
            ErrorCode.AUTH_CREDENTIALS_INVALID: "Invalid email or password",
            ErrorCode.AUTH_SESSION_EXPIRED: "Session has expired. Please login again",
            ErrorCode.AUTH_USER_NOT_FOUND: "User not found",
            
            ErrorCode.FORBIDDEN_RESOURCE: "You don't have permission to access this resource",
            ErrorCode.FORBIDDEN_WORKSPACE: "You are not a member of this workspace",
            ErrorCode.FORBIDDEN_PROJECT: "You don't have access to this project",
            
            ErrorCode.NOT_FOUND_USER: "User not found",
            ErrorCode.NOT_FOUND_PROJECT: "Project not found",
            ErrorCode.NOT_FOUND_EPISODE: "Episode not found",
            ErrorCode.NOT_FOUND_CUT: "Cut not found",
            ErrorCode.NOT_FOUND_CHARACTER: "Character not found",
            ErrorCode.NOT_FOUND_STYLE: "Style not found",
            ErrorCode.NOT_FOUND_WORKSPACE: "Workspace not found",
            ErrorCode.NOT_FOUND_SUGGESTION: "Suggestion not found",
            ErrorCode.NOT_FOUND_GENRE: "Genre not found",
            
            ErrorCode.PAYMENT_INSUFFICIENT_CREDITS: "Insufficient credits. Please recharge",
            ErrorCode.PAYMENT_REQUIRED: "Payment required to continue",
            
            ErrorCode.VALIDATION_INVALID_INPUT: "Invalid input data",
            ErrorCode.VALIDATION_INVALID_UUID: "Invalid UUID format",
            ErrorCode.VALIDATION_DUPLICATE_ENTRY: "This entry already exists",
            ErrorCode.VALIDATION_MISSING_REQUIRED: "Missing required fields",
            
            ErrorCode.CONFLICT_DUPLICATE_NAME: "A resource with this name already exists",
            ErrorCode.CONFLICT_RESOURCE_EXISTS: "Resource already exists",
            
            ErrorCode.RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
            
            ErrorCode.SERVER_INTERNAL_ERROR: "An internal server error occurred",
            ErrorCode.SERVER_AI_SERVICE_ERROR: "AI service is temporarily unavailable",
            ErrorCode.SERVER_STORAGE_ERROR: "Storage service error",
            ErrorCode.SERVER_DATABASE_ERROR: "Database error occurred",
            
            ErrorCode.GENERATION_FAILED: "Failed to generate content",
            ErrorCode.GENERATION_TIMEOUT: "Generation timed out. Please try again",
            ErrorCode.GENERATION_QUOTA_EXCEEDED: "Generation quota exceeded",
        }
        
        final_detail = detail or default_messages.get(error_code, "An error occurred")
        
        super().__init__(status_code=status_code, detail=final_detail)


def raise_auth_error(error_code: ErrorCode = ErrorCode.AUTH_TOKEN_INVALID, detail: Optional[str] = None):
    """Raise authentication error with WWW-Authenticate header"""
    raise AppException(error_code=error_code, detail=detail)


def raise_not_found(resource: str, resource_id: Optional[str] = None):
    """Raise 404 error for various resources"""
    code_map = {
        "user": ErrorCode.NOT_FOUND_USER,
        "project": ErrorCode.NOT_FOUND_PROJECT,
        "episode": ErrorCode.NOT_FOUND_EPISODE,
        "cut": ErrorCode.NOT_FOUND_CUT,
        "character": ErrorCode.NOT_FOUND_CHARACTER,
        "style": ErrorCode.NOT_FOUND_STYLE,
        "workspace": ErrorCode.NOT_FOUND_WORKSPACE,
        "suggestion": ErrorCode.NOT_FOUND_SUGGESTION,
        "genre": ErrorCode.NOT_FOUND_GENRE,
    }
    error_code = code_map.get(resource.lower(), ErrorCode.NOT_FOUND_USER)
    extra = {"resource_id": resource_id} if resource_id else None
    raise AppException(error_code=error_code, extra=extra)


def raise_forbidden(resource: str = "resource"):
    """Raise 403 forbidden error"""
    code_map = {
        "workspace": ErrorCode.FORBIDDEN_WORKSPACE,
        "project": ErrorCode.FORBIDDEN_PROJECT,
        "resource": ErrorCode.FORBIDDEN_RESOURCE,
    }
    error_code = code_map.get(resource.lower(), ErrorCode.FORBIDDEN_RESOURCE)
    raise AppException(error_code=error_code)


def raise_payment_required(reason: str = "insufficient_credits"):
    """Raise 402 payment required error"""
    if reason == "insufficient_credits":
        raise AppException(error_code=ErrorCode.PAYMENT_INSUFFICIENT_CREDITS)
    else:
        raise AppException(error_code=ErrorCode.PAYMENT_REQUIRED)


def raise_validation_error(error_type: str = "invalid_input", detail: Optional[str] = None):
    """Raise validation error"""
    code_map = {
        "invalid_input": ErrorCode.VALIDATION_INVALID_INPUT,
        "invalid_uuid": ErrorCode.VALIDATION_INVALID_UUID,
        "duplicate": ErrorCode.VALIDATION_DUPLICATE_ENTRY,
        "missing_required": ErrorCode.VALIDATION_MISSING_REQUIRED,
    }
    error_code = code_map.get(error_type, ErrorCode.VALIDATION_INVALID_INPUT)
    raise AppException(error_code=error_code, detail=detail)


def raise_conflict(error_type: str = "duplicate_name", detail: Optional[str] = None):
    """Raise conflict error"""
    if error_type == "duplicate_name":
        raise AppException(error_code=ErrorCode.CONFLICT_DUPLICATE_NAME, detail=detail)
    else:
        raise AppException(error_code=ErrorCode.CONFLICT_RESOURCE_EXISTS, detail=detail)


def raise_server_error(error_type: str = "internal", detail: Optional[str] = None):
    """Raise server error"""
    code_map = {
        "internal": ErrorCode.SERVER_INTERNAL_ERROR,
        "ai_service": ErrorCode.SERVER_AI_SERVICE_ERROR,
        "storage": ErrorCode.SERVER_STORAGE_ERROR,
        "database": ErrorCode.SERVER_DATABASE_ERROR,
    }
    error_code = code_map.get(error_type, ErrorCode.SERVER_INTERNAL_ERROR)
    raise AppException(error_code=error_code, detail=detail)
