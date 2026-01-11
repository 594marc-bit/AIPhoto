"""
Pydantic models for request and response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any


# ==================== Request Models ====================

class LoginRequest(BaseModel):
    """Login request model."""
    username: str = Field(..., min_length=3, description="Username")
    password: str = Field(..., min_length=6, description="Password")


class RegisterRequest(BaseModel):
    """Registration request model."""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, max_length=100, description="Password")


class SaveSettingsRequest(BaseModel):
    """Save settings request model."""
    settings: Dict[str, Any] = Field(default_factory=dict, description="User settings")


# ==================== Response Models ====================

class UserResponse(BaseModel):
    """User response model."""
    id: str
    username: str
    email: str
    created_at: str
    last_login: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SettingsResponse(BaseModel):
    """Settings response model."""
    settings: Dict[str, Any] = Field(default_factory=dict)
    updated_at: Optional[str] = None


# ==================== Error Models ====================

class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None


# ==================== Common Models ====================

class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    success: bool = True
