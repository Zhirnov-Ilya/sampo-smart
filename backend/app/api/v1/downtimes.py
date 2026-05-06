from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models import Downtime, Equipment, User, UserRole, Hypothesis
from app.schemas import DowntimeCreate, DowntimeRead, DowntimeUpdate


router = APIRouter(prefix="/api/v1", tags=["Downtimes"])


def calculate_duration_minutes(start_time, end_time) -> int:
    duration_seconds = (end_time - start_time).total_seconds()
    return int(duration_seconds // 60)

async def get_equipment_or_404(
    equipment_id: int,
    db: AsyncSession,
) -> Equipment:
    stmt = select(Equipment).where(Equipment.id == equipment_id)
    result = await db.execute(stmt)
    equipment = result.scalar_one_or_none()

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    return equipment


def check_equipment_access(
    equipment: Equipment,
    current_user: User,
) -> None:
    if current_user.role == UserRole.SUPER_ADMIN:
        return

    if current_user.enterprise_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no enterprise assigned",
        )

    if equipment.enterprise_id != current_user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )


def check_equipment_is_active(equipment: Equipment) -> None:
    if not equipment.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't create downtime for inactive equipment",
        )

@router.post(
    "/downtimes",
    response_model=DowntimeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_downtime(
    data: DowntimeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.ENTERPRISE_ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    if data.end_time <= data.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be greater than start_time",
        )

    equipment = await get_equipment_or_404(data.equipment_id, db)
    check_equipment_access(equipment, current_user)
    check_equipment_is_active(equipment)

    duration_minutes = calculate_duration_minutes(
        data.start_time,
        data.end_time,
    )

    downtime = Downtime(
        equipment_id=data.equipment_id,
        start_time=data.start_time,
        end_time=data.end_time,
        duration_minutes=duration_minutes,
        reason_category=data.reason_category,
        reason_details=data.reason_details,
        production_loss_units=data.production_loss_units,
        cost_impact_rub=data.cost_impact_rub,
        reported_by=data.reported_by,
    )

    db.add(downtime)
    await db.commit()
    await db.refresh(downtime)

    return downtime

@router.get(
    "/downtimes",
    response_model=list[DowntimeRead],
)
async def get_downtimes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    search: str | None = Query(default=None),
    equipment_id: int | None = Query(default=None),
    reason_category: str | None = Query(default=None),
    start_from: datetime | None = Query(default=None),
    start_to: datetime | None = Query(default=None),
    sort_order: Literal["newest", "oldest"] = Query(default="newest"),
):
    stmt = select(Downtime).join(Equipment, Downtime.equipment_id == Equipment.id)

    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.enterprise_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no enterprise assigned",
            )

        stmt = stmt.where(Equipment.enterprise_id == current_user.enterprise_id)

    if equipment_id is not None:
        stmt = stmt.where(Downtime.equipment_id == equipment_id)
    
    
    if reason_category:
        normalized_reason_category = reason_category.strip()

        if normalized_reason_category:
            stmt = stmt.where(
                Downtime.reason_category.ilike(
                    f"%{normalized_reason_category}%"
                )
            )
    
    if start_from is not None:
        stmt = stmt.where(Downtime.start_time >= start_from)
    
    if start_to is not None:
        stmt = stmt.where(Downtime.start_time <= start_to)

    if search:
        normalized_search = search.strip()

        if normalized_search:
            stmt = stmt.where(
                or_(
                    Equipment.name.ilike(f"%{normalized_search}%"),
                    Equipment.equipment_code.ilike(f"%{normalized_search}%"),
                    Downtime.reason_category.ilike(f"%{normalized_search}%"),
                    Downtime.reason_details.ilike(f"%{normalized_search}%"),
                    Downtime.reported_by.ilike(f"%{normalized_search}%"),
                )
            )

    if sort_order == "oldest":
        stmt = stmt.order_by(Downtime.start_time.asc(), Downtime.id.asc())
    else:
        stmt = stmt.order_by(Downtime.start_time.desc(), Downtime.id.desc())


    result = await db.execute(stmt)
    downtimes = result.scalars().all()

    return downtimes

@router.put(
    "/downtimes/{downtime_id}",
    response_model=DowntimeRead,
)
async def update_downtime(
    downtime_id: int,
    data: DowntimeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.ENTERPRISE_ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    if data.end_time <= data.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be greater than start_time",
        )

    stmt = select(Downtime).where(Downtime.id == downtime_id)
    result = await db.execute(stmt)
    downtime = result.scalar_one_or_none()

    if downtime is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Downtime not found",
        )

    current_equipment = await get_equipment_or_404(downtime.equipment_id, db)
    check_equipment_access(current_equipment, current_user)

    new_equipment = await get_equipment_or_404(data.equipment_id, db)
    check_equipment_access(new_equipment, current_user)
    check_equipment_is_active(new_equipment)

    downtime.equipment_id = data.equipment_id
    downtime.start_time = data.start_time
    downtime.end_time = data.end_time
    downtime.duration_minutes = calculate_duration_minutes(
        data.start_time,
        data.end_time,
    )
    downtime.reason_category = data.reason_category
    downtime.reason_details = data.reason_details
    downtime.production_loss_units = data.production_loss_units
    downtime.cost_impact_rub = data.cost_impact_rub
    downtime.reported_by = data.reported_by

    await db.commit()
    await db.refresh(downtime)

    return downtime

@router.get(
    "/downtimes/{downtime_id}",
    response_model=DowntimeRead,
)
async def get_downtime_by_id(
    downtime_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = (
        select(Downtime)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
        .where(Downtime.id == downtime_id)
    )

    result = await db.execute(stmt)
    downtime = result.scalar_one_or_none()

    if downtime is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Downtime not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        equipment_stmt = select(Equipment).where(Equipment.id == downtime.equipment_id)
        equipment_result = await db.execute(equipment_stmt)
        equipment = equipment_result.scalar_one_or_none()

        if equipment is None or equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return downtime


@router.delete(
    "/downtimes/{downtime_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_downtime(
    downtime_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.ENTERPRISE_ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    stmt = select(Downtime).where(Downtime.id == downtime_id)
    result = await db.execute(stmt)
    downtime = result.scalar_one_or_none()

    if downtime is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Downtime not found",
        )

    equipment = await get_equipment_or_404(downtime.equipment_id, db)
    check_equipment_access(equipment, current_user)

    hypothesis_stmt = select(Hypothesis.id).where(
        Hypothesis.downtime_id == downtime_id
    )
    hypothesis_result = await db.execute(hypothesis_stmt)
    hypothesis_id = hypothesis_result.scalar_one_or_none()

    if hypothesis_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Can't delete downtime with linked hypotheses",
        )

    await db.delete(downtime)
    await db.commit()

    return None