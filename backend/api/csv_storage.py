"""
CSV-based data storage for users and settings.
Simple implementation for small-scale applications.
"""
import csv
import os
import hashlib
from datetime import datetime
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, asdict
import json
import threading


@dataclass
class User:
    """User data model."""
    id: str
    username: str
    email: str
    password_hash: str
    created_at: str
    last_login: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class UserSettings:
    """User settings data model."""
    user_id: str
    settings_json: str
    updated_at: str

    def get_settings(self) -> Dict[str, Any]:
        return json.loads(self.settings_json) if self.settings_json else {}

    def set_settings(self, settings: Dict[str, Any]):
        self.settings_json = json.dumps(settings, ensure_ascii=False)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class CSVStorage:
    """CSV-based storage manager with thread-safe operations."""

    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, "users.csv")
        self.settings_file = os.path.join(data_dir, "user_settings.csv")
        self.locks = {
            'users': threading.RLock(),  # Use RLock for reentrant locking
            'settings': threading.RLock()  # Use RLock for reentrant locking
        }
        self._init_storage()

    def _init_storage(self):
        """Initialize CSV files with headers if they don't exist."""
        os.makedirs(self.data_dir, exist_ok=True)

        # Initialize users.csv
        if not os.path.exists(self.users_file):
            with open(self.users_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['id', 'username', 'email', 'password_hash', 'created_at', 'last_login'])

        # Initialize user_settings.csv
        if not os.path.exists(self.settings_file):
            with open(self.settings_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['user_id', 'settings_json', 'updated_at'])

    # ==================== User Operations ====================

    def create_user(self, username: str, email: str, password_hash: str) -> User:
        """Create a new user."""
        with self.locks['users']:
            # Check if username or email already exists
            if self.get_user_by_username(username):
                raise ValueError(f"Username '{username}' already exists")
            if self.get_user_by_email(email):
                raise ValueError(f"Email '{email}' already exists")

            # Generate unique ID
            user_id = self._generate_id(username)

            # Create user
            user = User(
                id=user_id,
                username=username,
                email=email,
                password_hash=password_hash,
                created_at=datetime.utcnow().isoformat()
            )

            # Save to CSV
            self._append_user(user)
            return user

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        with self.locks['users']:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['username'] == username:
                        return User(
                            id=row['id'],
                            username=row['username'],
                            email=row['email'],
                            password_hash=row['password_hash'],
                            created_at=row['created_at'],
                            last_login=row.get('last_login')
                        )
            return None

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        with self.locks['users']:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['email'] == email:
                        return User(
                            id=row['id'],
                            username=row['username'],
                            email=row['email'],
                            password_hash=row['password_hash'],
                            created_at=row['created_at'],
                            last_login=row.get('last_login')
                        )
            return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        with self.locks['users']:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['id'] == user_id:
                        return User(
                            id=row['id'],
                            username=row['username'],
                            email=row['email'],
                            password_hash=row['password_hash'],
                            created_at=row['created_at'],
                            last_login=row.get('last_login')
                        )
            return None

    def update_user_last_login(self, user_id: str):
        """Update user's last login time."""
        with self.locks['users']:
            users = []
            with open(self.users_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['id'] == user_id:
                        row['last_login'] = datetime.utcnow().isoformat()
                    users.append(row)

            with open(self.users_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['id', 'username', 'email', 'password_hash', 'created_at', 'last_login'])
                writer.writeheader()
                writer.writerows(users)

    def get_all_users(self) -> List[User]:
        """Get all users."""
        with self.locks['users']:
            users = []
            with open(self.users_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    users.append(User(
                        id=row['id'],
                        username=row['username'],
                        email=row['email'],
                        password_hash=row['password_hash'],
                        created_at=row['created_at'],
                        last_login=row.get('last_login')
                    ))
            return users

    # ==================== Settings Operations ====================

    def get_user_settings(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user settings."""
        with self.locks['settings']:
            if not os.path.exists(self.settings_file):
                return None

            with open(self.settings_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['user_id'] == user_id:
                        return json.loads(row['settings_json']) if row['settings_json'] else {}
            return None

    def save_user_settings(self, user_id: str, settings: Dict[str, Any]) -> None:
        """Save or update user settings."""
        with self.locks['settings']:
            settings_records = []

            # Read existing records
            if os.path.exists(self.settings_file):
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        settings_records.append(row)

            # Update or add settings
            updated = False
            for record in settings_records:
                if record['user_id'] == user_id:
                    record['settings_json'] = json.dumps(settings, ensure_ascii=False)
                    record['updated_at'] = datetime.utcnow().isoformat()
                    updated = True
                    break

            if not updated:
                settings_records.append({
                    'user_id': user_id,
                    'settings_json': json.dumps(settings, ensure_ascii=False),
                    'updated_at': datetime.utcnow().isoformat()
                })

            # Write back to file
            with open(self.settings_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['user_id', 'settings_json', 'updated_at'])
                writer.writeheader()
                writer.writerows(settings_records)

    def delete_user_settings(self, user_id: str) -> None:
        """Delete user settings."""
        with self.locks['settings']:
            if not os.path.exists(self.settings_file):
                return

            settings_records = []
            with open(self.settings_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['user_id'] != user_id:
                        settings_records.append(row)

            with open(self.settings_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['user_id', 'settings_json', 'updated_at'])
                writer.writeheader()
                writer.writerows(settings_records)

    # ==================== Helper Methods ====================

    def _generate_id(self, username: str) -> str:
        """Generate unique user ID."""
        timestamp = str(int(datetime.utcnow().timestamp() * 1000))
        unique_hash = hashlib.md5(f"{username}{timestamp}".encode()).hexdigest()[:8]
        return f"user_{timestamp}_{unique_hash}"

    def _append_user(self, user: User) -> None:
        """Append user to CSV file."""
        with open(self.users_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'username', 'email', 'password_hash', 'created_at', 'last_login'])
            writer.writerow(user.to_dict())
