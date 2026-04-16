from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Enterprise, User, UserRole
from app.schemas import UserCreate, UserRead
from app.security import hash_password
from app.api.v1.auth import require_roles


router = APIRouter(prefix="/api/v1", tags=["Users"])


@router.post(
    "/users",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(User).where(User.email == data.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    if data.role != UserRole.SUPER_ADMIN and data.enterprise_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="enterprise_id is required for non-super-admin users",
        )

    if data.enterprise_id is not None:
        stmt_enterprise = select(Enterprise).where(Enterprise.id == data.enterprise_id)
        result_enterprise = await db.execute(stmt_enterprise)
        enterprise = result_enterprise.scalar_one_or_none()

        if enterprise is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enterprise not found",
            )

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        is_active=data.is_active,
        enterprise_id=data.enterprise_id,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.get(
    "/users",
    response_model=list[UserRead],
)
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(User).order_by(User.id)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return users


@router.get(
    "/users/{user_id}",
    response_model=UserRead,
)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user