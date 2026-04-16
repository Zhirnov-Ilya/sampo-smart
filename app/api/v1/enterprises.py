from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models import Enterprise, User, UserRole
from app.schemas import EnterpriseCreate, EnterpriseRead


router = APIRouter(prefix="/api/v1", tags=["Enterprises"])


@router.post(
    "/enterprises",
    response_model=EnterpriseRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_enterprise(
    data: EnterpriseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(Enterprise).where(Enterprise.name == data.name)
    result = await db.execute(stmt)
    existing_enterprise = result.scalar_one_or_none()

    if existing_enterprise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enterprise with this name already exists",
        )

    enterprise = Enterprise(
        name=data.name,
        industry=data.industry,
        contact_email=data.contact_email,
        is_active=data.is_active,
    )

    db.add(enterprise)
    await db.commit()
    await db.refresh(enterprise)

    return enterprise


@router.get(
    "/enterprises",
    response_model=list[EnterpriseRead],
)
async def get_enterprises(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(Enterprise).order_by(Enterprise.id)
    result = await db.execute(stmt)
    enterprises = result.scalars().all()

    return enterprises


@router.get(
    "/enterprises/{enterprise_id}",
    response_model=EnterpriseRead,
)
async def get_enterprise_by_id(
    enterprise_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(Enterprise).where(Enterprise.id == enterprise_id)
    result = await db.execute(stmt)
    enterprise = result.scalar_one_or_none()

    if enterprise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found",
        )

    return enterprise