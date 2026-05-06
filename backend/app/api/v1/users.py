from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Enterprise, User, UserRole
from app.schemas import UserCreate, UserRead, UserUpdate, UserPasswordReset
from app.security import hash_password
from app.api.v1.auth import require_roles


router = APIRouter(prefix="/api/v1", tags=["Users"])

async def get_enterprise_or_404(
    enterprise_id: int,
    db: AsyncSession,
) -> Enterprise:
    stmt = select(Enterprise).where(Enterprise.id == enterprise_id)
    result = await db.execute(stmt)
    enterprise = result.scalar_one_or_none()

    if enterprise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found",
        )

    return enterprise


def check_enterprise_is_active(enterprise: Enterprise) -> None:
    if not enterprise.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot use inactive enterprise",
        )

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
        check_enterprise_is_active(enterprise)

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
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN)
    ),
    search: str | None = Query(default=None),
    enterprise_id: int | None = Query(default=None),
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    sort_order: Literal["newest", "oldest"] = Query(default="newest"),
):
    stmt = select(User)

    if current_user.role == UserRole.SUPER_ADMIN:
        if enterprise_id is not None:
            stmt = stmt.where(User.enterprise_id == enterprise_id)
    else:
        if current_user.enterprise_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Enterprise admin has no enterprise assigned",
            )

        if enterprise_id is not None and enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        stmt = stmt.where(User.enterprise_id == current_user.enterprise_id)

    if role is not None:
        stmt = stmt.where(User.role == role)

    if is_active is not None:
        stmt = stmt.where(User.is_active.is_(is_active))

    if search:
        normalized_search = search.strip()

        if normalized_search:
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(f"%{normalized_search}%"),
                    User.email.ilike(f"%{normalized_search}%"),
                )
            )

    if sort_order == "oldest":
        stmt = stmt.order_by(User.created_at.asc(), User.id.asc())
    else:
        stmt = stmt.order_by(User.created_at.desc(), User.id.desc())

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
        check_enterprise_is_active(enterprise)

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


