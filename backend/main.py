"""
FastAPI backend server for AIPhoto user authentication and settings management.
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os
from pathlib import Path

from api.csv_storage import CSVStorage
from api.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token
)
from api.models import (
    LoginRequest,
    RegisterRequest,
    SaveSettingsRequest,
    UserResponse,
    TokenResponse,
    SettingsResponse,
    ErrorResponse,
    MessageResponse
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AIPhoto API",
    description="User authentication and settings management API",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", '["http://localhost:9000", "http://localhost:8080"]')
try:
    import json
    cors_origins = json.loads(cors_origins)
except:
    cors_origins = ["http://localhost:9000", "http://localhost:8080"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize storage
data_dir = os.path.abspath(os.getenv("DATA_DIR", "./data"))
print(f"Data directory: {data_dir}")
storage = CSVStorage(data_dir=data_dir)

# Security
security = HTTPBearer()


# ==================== Dependencies ====================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Get current user from JWT token."""
    token = credentials.credentials
    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user exists
    user = storage.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


# ==================== Health Check ====================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint for health check."""
    return {
        "status": "online",
        "service": "AIPhoto API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "storage": "csv",
        "data_dir": data_dir
    }


# ==================== Authentication Endpoints ====================

@app.post(
    "/auth/register",
    response_model=TokenResponse,
    responses={400: {"model": ErrorResponse}},
    tags=["Authentication"]
)
async def register(request: RegisterRequest):
    """
    Register a new user.

    - **username**: Unique username (min 3 characters)
    - **email**: Valid email address
    - **password**: Password (min 6 characters)
    """
    try:
        # Check if user already exists
        existing_user = storage.get_user_by_username(request.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        existing_user = storage.get_user_by_email(request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        password_hash = get_password_hash(request.password)
        user = storage.create_user(
            username=request.username,
            email=request.email,
            password_hash=password_hash
        )

        # Generate access token
        access_token = create_access_token(data={"sub": user.id})

        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                created_at=user.created_at,
                last_login=user.last_login
            )
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@app.post(
    "/auth/login",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse}},
    tags=["Authentication"]
)
async def login(request: LoginRequest):
    """
    Login with username and password.

    - **username**: Your username
    - **password**: Your password
    """
    # Find user by username
    user = storage.get_user_by_username(request.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    storage.update_user_last_login(user.id)

    # Generate access token
    access_token = create_access_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )


@app.get(
    "/auth/me",
    response_model=UserResponse,
    tags=["Authentication"]
)
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """
    Get current user information.
    Requires authentication.
    """
    user = storage.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        last_login=user.last_login
    )


# ==================== Settings Endpoints ====================

@app.get(
    "/settings",
    response_model=SettingsResponse,
    tags=["Settings"]
)
async def get_settings(user_id: str = Depends(get_current_user)):
    """
    Get user settings.
    Requires authentication.
    """
    settings = storage.get_user_settings(user_id)

    # Get updated_at from storage
    updated_at = None
    settings_records = []
    if os.path.exists(storage.settings_file):
        with open(storage.settings_file, 'r', encoding='utf-8') as f:
            import csv
            reader = csv.DictReader(f)
            for row in reader:
                if row['user_id'] == user_id:
                    updated_at = row.get('updated_at')
                    break

    return SettingsResponse(
        settings=settings or {},
        updated_at=updated_at
    )


@app.post(
    "/settings",
    response_model=MessageResponse,
    tags=["Settings"]
)
async def save_settings(
    request: SaveSettingsRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Save user settings.
    Requires authentication.

    - **settings**: JSON object with user settings
    """
    try:
        storage.save_user_settings(user_id, request.settings)
        return MessageResponse(
            message="Settings saved successfully",
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save settings: {str(e)}"
        )


@app.delete(
    "/settings",
    response_model=MessageResponse,
    tags=["Settings"]
)
async def delete_settings(user_id: str = Depends(get_current_user)):
    """
    Delete user settings.
    Requires authentication.
    """
    try:
        storage.delete_user_settings(user_id)
        return MessageResponse(
            message="Settings deleted successfully",
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete settings: {str(e)}"
        )


# ==================== Admin Endpoints ====================

@app.get(
    "/admin/users",
    response_model=list[UserResponse],
    tags=["Admin"]
)
async def get_all_users(user_id: str = Depends(get_current_user)):
    """
    Get all users (admin endpoint).
    Requires authentication.
    """
    users = storage.get_all_users()
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            last_login=user.last_login
        )
        for user in users
    ]


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="debug" if debug else "info"
    )
