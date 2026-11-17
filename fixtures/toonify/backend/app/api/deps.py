from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlmodel import Session
from app.core.config import settings
from app.core import security
from app.core.errors import AppException, ErrorCode
from app.core.logging import get_logger
from app.models import User

logger = get_logger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

from app.db.engine import engine

def get_session():
    with Session(engine) as session:
        yield session

def get_current_user_id(
    token: str = Depends(reusable_oauth2)
) -> str:
    try:
        payload = jwt.decode(
            token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload.get("sub")
    except (JWTError, ValidationError) as e:
        if settings.DEBUG:
            logger.warning("JWT validation error", error=str(e))
            raise AppException(
                error_code=ErrorCode.AUTH_TOKEN_INVALID,
                detail=f"Could not validate credentials: {e}"
            )
        raise AppException(error_code=ErrorCode.AUTH_TOKEN_INVALID)
    return token_data

def get_current_active_user(
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
) -> "User":
    from app.models import User
    user = session.get(User, user_id)
    if not user:
        raise AppException(error_code=ErrorCode.AUTH_USER_NOT_FOUND)
    # For now, we don't have is_active field, assuming all users are active
    return user
