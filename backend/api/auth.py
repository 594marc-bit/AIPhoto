"""
Authentication utilities for JWT token handling and password hashing.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets
from os import getenv


# JWT Configuration
SECRET_KEY = getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days default


def _hash_password(password: str, salt: str) -> str:
    """Hash password with salt using SHA-256."""
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        # Hash format: salt:hash
        parts = hashed_password.split(':')
        if len(parts) != 2:
            return False

        salt, stored_hash = parts
        computed_hash = _hash_password(plain_password, salt)
        return secrets.compare_digest(computed_hash, stored_hash)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Hash a password."""
    # Generate random salt
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    return f"{salt}:{password_hash}"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[str]:
    """
    Verify JWT token and return user_id if valid.
    Returns None if token is invalid or expired.
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    return user_id
