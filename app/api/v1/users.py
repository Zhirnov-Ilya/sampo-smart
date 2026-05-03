from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Enterprise, User, UserRole
from app.schemas import UserCreate, UserRead, UserUpdate, UserPasswordReset
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
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN)),
):
    stmt = select(User).order_by(User.created_at.desc())

    if (current_user.role != UserRole.SUPER_ADMIN):
        stmt = select(User).where(User.enterprise_id == current_user.enterprise_id).order_by(User.id)
    
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


@router.put(
    "/users/{user_id}",
    response_model=UserRead,
)
async def update_user(
    user_id: int,
    data: UserUpdate,
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

    duplicate_stmt = select(User).where(
        User.email == data.email,
        User.id != user_id,
    )
    duplicate_result = await db.execute(duplicate_stmt)
    duplicate_user = duplicate_result.scalar_one_or_none()

    if duplicate_user:
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

    user.full_name = data.full_name
    user.email = data.email
    user.role = data.role
    user.is_active = data.is_active
    user.enterprise_id = data.enterprise_id

    await db.commit()
    await db.refresh(user)

    return user

@router.patch(
    "/users/{user_id}/deactivate",
    response_model=UserRead,
)
async def deactivate_user(
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

    user.is_active = False

    await db.commit()
    await db.refresh(user)

    return user

@router.patch(
    "/users/{user_id}/activate",
    response_model=UserRead,
)
async def activate_user(
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

    user.is_active = True

    await db.commit()
    await db.refresh(user)

    return user

@router.post(
    "/users/{user_id}/reset-password",
    response_model=UserRead
)
async def reset_user_password(
    user_id: int,
    data: UserPasswordReset,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN)),
):

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    target_user = result.scalar_one_or_none()

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if current_user.role == UserRole.SUPER_ADMIN:
        if target_user.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="SUPER_ADMIN password cannot be reset through this endpoint",
            )
    elif current_user.role == UserRole.ENTERPRISE_ADMIN:
        if current_user.enterprise_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Enterprise admin has no enterprise assigned"
            )
        
        if target_user.role in {UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot reset password for this user"
            )
        
        if target_user.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can reset password only for users in your enterprise",
            )
    
    target_user.hashed_password = hash_password(data.new_password)

    await db.commit()
    await db.refresh(target_user)

    return target_user


