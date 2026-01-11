"""
Initialize default admin user for AIPhoto backend.
Run this script to create the default admin account.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from api.csv_storage import CSVStorage
from api.auth import get_password_hash


def create_default_admin():
    """Create default admin user if not exists."""
    # Initialize storage
    data_dir = os.getenv("DATA_DIR", "./data")
    storage = CSVStorage(data_dir=data_dir)

    # Default admin credentials
    admin_username = "admin"
    admin_email = "admin@aiphoto.local"
    admin_password = "admin123"  # Change this after first login!

    # Check if admin already exists
    existing_admin = storage.get_user_by_username(admin_username)
    if existing_admin:
        print(f"Admin user already exists: {admin_username}")
        return False

    # Create admin user
    try:
        password_hash = get_password_hash(admin_password)
        admin_user = storage.create_user(
            username=admin_username,
            email=admin_email,
            password_hash=password_hash
        )
        print(f"Admin user created successfully!")
        print(f"  Username: {admin_username}")
        print(f"  Password: {admin_password}")
        print(f"  Email: {admin_email}")
        print(f"\nIMPORTANT: Please change the admin password after first login!")
        return True
    except ValueError as e:
        print(f"Error creating admin user: {e}")
        return False


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    print("Initializing default admin user...")
    print("-" * 50)
    create_default_admin()
    print("-" * 50)
