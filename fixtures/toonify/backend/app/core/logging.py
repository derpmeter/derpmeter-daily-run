"""
Structured Logging for Google Cloud Logging

This module provides a standardized logging setup that outputs JSON-formatted logs
compatible with Google Cloud Logging. It includes:
- Automatic trace ID extraction from Cloud Run headers
- Standardized log attributes (severity, labels, etc.)
- Request context propagation
"""

import logging
import json
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Any, Optional
from functools import wraps

# Context variables for request-scoped data
_trace_id: ContextVar[Optional[str]] = ContextVar('trace_id', default=None)
_span_id: ContextVar[Optional[str]] = ContextVar('span_id', default=None)
_user_id: ContextVar[Optional[str]] = ContextVar('user_id', default=None)
_request_id: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


def get_trace_id() -> Optional[str]:
    """Get the current trace ID from context."""
    return _trace_id.get()


def get_span_id() -> Optional[str]:
    """Get the current span ID from context."""
    return _span_id.get()


def get_user_id() -> Optional[str]:
    """Get the current user ID from context."""
    return _user_id.get()


def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return _request_id.get()


def set_trace_context(trace_id: Optional[str], span_id: Optional[str] = None):
    """Set the trace context for the current request."""
    _trace_id.set(trace_id)
    _span_id.set(span_id)


def set_user_id(user_id: Optional[str]):
    """Set the user ID for the current request."""
    _user_id.set(user_id)


def set_request_id(request_id: Optional[str]):
    """Set the request ID for the current request."""
    _request_id.set(request_id)


def parse_cloud_trace_header(header_value: Optional[str], project_id: str) -> tuple[Optional[str], Optional[str]]:
    """
    Parse the X-Cloud-Trace-Context header.
    
    Format: TRACE_ID/SPAN_ID;o=TRACE_TRUE
    Returns: (full_trace_resource, span_id)
    """
    if not header_value:
        return None, None
    
    try:
        parts = header_value.split(';')[0]  # Remove ;o=TRACE_TRUE part
        if '/' in parts:
            trace_id, span_id = parts.split('/', 1)
            # Format for Cloud Logging: projects/[PROJECT_ID]/traces/[TRACE_ID]
            full_trace = f"projects/{project_id}/traces/{trace_id}"
            return full_trace, span_id
        else:
            full_trace = f"projects/{project_id}/traces/{parts}"
            return full_trace, None
    except Exception:
        return None, None


class CloudLoggingFormatter(logging.Formatter):
    """
    Custom formatter that outputs JSON in Google Cloud Logging format.
    
    See: https://cloud.google.com/logging/docs/structured-logging
    """
    
    # Map Python log levels to Google Cloud Logging severity levels
    SEVERITY_MAP = {
        logging.DEBUG: 'DEBUG',
        logging.INFO: 'INFO',
        logging.WARNING: 'WARNING',
        logging.ERROR: 'ERROR',
        logging.CRITICAL: 'CRITICAL',
    }
    
    def __init__(self, project_id: str = ""):
        super().__init__()
        self.project_id = project_id
    
    def format(self, record: logging.LogRecord) -> str:
        # Base log entry
        log_entry: dict[str, Any] = {
            'severity': self.SEVERITY_MAP.get(record.levelno, 'DEFAULT'),
            'message': record.getMessage(),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        }
        
        # Add source location for debugging
        log_entry['logging.googleapis.com/sourceLocation'] = {
            'file': record.pathname,
            'line': str(record.lineno),
            'function': record.funcName,
        }
        
        # Add trace context if available
        trace_id = get_trace_id()
        if trace_id:
            log_entry['logging.googleapis.com/trace'] = trace_id
        
        span_id = get_span_id()
        if span_id:
            log_entry['logging.googleapis.com/spanId'] = span_id
        
        # Add labels (custom attributes)
        labels: dict[str, str] = {}
        
        request_id = get_request_id()
        if request_id:
            labels['request_id'] = request_id
        
        user_id = get_user_id()
        if user_id:
            labels['user_id'] = user_id
        
        # Add logger name as label
        labels['logger'] = record.name
        
        if labels:
            log_entry['logging.googleapis.com/labels'] = labels
        
        # Add extra fields from the log record
        if hasattr(record, 'extra_data') and isinstance(record.extra_data, dict):
            log_entry['jsonPayload'] = record.extra_data
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry, ensure_ascii=False, default=str)


class StructuredLogger:
    """
    A wrapper around the standard logger that provides structured logging capabilities.
    """
    
    def __init__(self, name: str, logger: logging.Logger):
        self.name = name
        self._logger = logger
    
    def _log(self, level: int, message: str, **kwargs):
        """Internal log method that handles extra data."""
        extra = {'extra_data': kwargs} if kwargs else {}
        self._logger.log(level, message, extra=extra)
    
    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log(logging.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        self._log(logging.CRITICAL, message, **kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log an exception with traceback."""
        self._logger.exception(message, extra={'extra_data': kwargs} if kwargs else {})


# Global configuration
_is_configured = False
_project_id = ""


def configure_logging(project_id: str = "", debug: bool = False):
    """
    Configure the logging system for Google Cloud Logging.
    
    Args:
        project_id: Google Cloud project ID for trace correlation
        debug: If True, set log level to DEBUG
    """
    global _is_configured, _project_id
    
    if _is_configured:
        return
    
    _project_id = project_id
    
    # Create root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add structured JSON handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(CloudLoggingFormatter(project_id))
    root_logger.addHandler(handler)
    
    # Suppress noisy loggers
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    logging.getLogger('google').setLevel(logging.WARNING)
    
    _is_configured = True


def get_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (typically __name__)
    
    Returns:
        StructuredLogger instance
    """
    return StructuredLogger(name, logging.getLogger(name))
