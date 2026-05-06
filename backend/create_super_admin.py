import asyncio
import os

from sqlalchemy import select

from app.database import async_session_maker
from app.models import User, UserRole
from app.security import hash_password


def get_required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(f"Environment variable {name} is required")

    return value


async def create_super_admin() -> None:
    email = get_required_env("SUPER_ADMIN_EMAIL")
    password = get_required_env("SUPER_ADMIN_PASSWORD")
    full_name = os.getenv("SUPER_ADMIN_FULL_NAME", "Главный администратор")

    async with async_session_maker() as session:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            existing_user.full_name = full_name
            existing_user.hashed_password = hash_password(password)
            existing_user.role = UserRole.SUPER_ADMIN
            existing_user.is_active = True
            existing_user.enterprise_id = None

            await session.commit()

            print("SUPER_ADMIN already existed. Password and role were updated.")
            print(f"Email: {email}")
            return

        user = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            enterprise_id=None,
        )

        session.add(user)
        await session.commit()

        print("SUPER_ADMIN was created successfully.")
        print(f"Email: {email}")


if __name__ == "__main__":
    asyncio.run(create_super_admin())