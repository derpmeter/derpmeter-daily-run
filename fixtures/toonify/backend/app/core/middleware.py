"""
Middleware for request processing and logging.

This module provides middleware that:
- Extracts trace context from Cloud Run headers
- Generates request IDs for correlation
- Logs request/response information with elapsed time
- Provides Google Cloud Logging compatible httpRequest format
"""

import time
import uuid
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.logging import (
    get_logger,
    set_trace_context,
    set_request_id,
    set_user_id,
    parse_cloud_trace_header,
)

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that handles request logging and trace context propagation.
    
    Features:
    - Automatic X-Request-ID generation/propagation
    - Cloud Trace context extraction
    - Request/Response logging with elapsed time
    - Google Cloud Logging httpRequest format support
    """

    # Paths to exclude from detailed logging (health checks, etc.)
    EXCLUDE_PATHS = {"/health", "/", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip detailed logging for excluded paths
        path = str(request.url.path)
        should_log = path not in self.EXCLUDE_PATHS
        
        # Generate or extract request ID
        request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        set_request_id(request_id)

        # Extract Cloud Trace context
        trace_header = request.headers.get('X-Cloud-Trace-Context')
        trace_id, span_id = parse_cloud_trace_header(
            trace_header, 
            settings.GOOGLE_CLOUD_PROJECT
        )
        set_trace_context(trace_id, span_id)

        # Start timing
        start_time = time.time()
        
        # Get client info
        client_ip = None
        if request.client:
            client_ip = request.client.host
        # Check for forwarded IP (behind load balancer/proxy)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            client_ip = forwarded_for.split(',')[0].strip()
        
        # Get request size
        content_length = request.headers.get('Content-Length', '0')
        request_size = int(content_length) if content_length.isdigit() else 0
        
        if should_log:
            logger.info(
                "API Request",
                http_method=request.method,
                http_path=path,
                http_query=str(request.url.query) if request.url.query else None,
                client_ip=client_ip,
                user_agent=request.headers.get('User-Agent'),
                request_size=request_size,
                referer=request.headers.get('Referer'),
            )

        try:
            response = await call_next(request)
            
            # Calculate elapsed time
            elapsed_time_ms = (time.time() - start_time) * 1000
            elapsed_time_s = elapsed_time_ms / 1000

            # Get response size
            response_size = 0
            if 'Content-Length' in response.headers:
                response_size = int(response.headers['Content-Length'])

            if should_log:
                # Log with httpRequest format for Google Cloud Logging
                logger.info(
                    "API Response",
                    http_method=request.method,
                    http_path=path,
                    http_status=response.status_code,
                    elapsed_ms=round(elapsed_time_ms, 2),
                    elapsed_s=round(elapsed_time_s, 3),
                    client_ip=client_ip,
                    response_size=response_size,
                    # Google Cloud Logging httpRequest format
                    httpRequest={
                        "requestMethod": request.method,
                        "requestUrl": str(request.url),
                        "requestSize": str(request_size),
                        "status": response.status_code,
                        "responseSize": str(response_size),
                        "userAgent": request.headers.get('User-Agent', ''),
                        "remoteIp": client_ip,
                        "referer": request.headers.get('Referer', ''),
                        "latency": f"{elapsed_time_s:.3f}s",
                        "protocol": f"HTTP/{request.scope.get('http_version', '1.1')}",
                    }
                )

            # Add trace headers to response
            response.headers['X-Request-ID'] = request_id
            response.headers['X-Response-Time'] = f"{elapsed_time_ms:.2f}ms"
            if trace_id:
                response.headers['X-Trace-ID'] = trace_id

            return response

        except Exception as e:
            elapsed_time_ms = (time.time() - start_time) * 1000
            elapsed_time_s = elapsed_time_ms / 1000
            
            logger.error(
                "API Error",
                http_method=request.method,
                http_path=path,
                elapsed_ms=round(elapsed_time_ms, 2),
                elapsed_s=round(elapsed_time_s, 3),
                error=str(e),
                error_type=type(e).__name__,
                client_ip=client_ip,
                httpRequest={
                    "requestMethod": request.method,
                    "requestUrl": str(request.url),
                    "requestSize": str(request_size),
                    "status": 500,
                    "userAgent": request.headers.get('User-Agent', ''),
                    "remoteIp": client_ip,
                    "latency": f"{elapsed_time_s:.3f}s",
                    "protocol": f"HTTP/{request.scope.get('http_version', '1.1')}",
                }
            )
            raise
