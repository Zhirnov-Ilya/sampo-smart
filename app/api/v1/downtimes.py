from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models import Downtime, Equipment, User, UserRole
from app.schemas import DowntimeCreate, DowntimeRead


router = APIRouter(prefix="/api/v1", tags=["Downtimes"])


def calculate_duration_minutes(start_time, end_time) -> int:
    duration_seconds = (end_time - start_time).total_seconds()
    return int(duration_seconds // 60)


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

    stmt_equipment = select(Equipment).where(Equipment.id == data.equipment_id)
    result_equipment = await db.execute(stmt_equipment)
    equipment = result_equipment.scalar_one_or_none()

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        if equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create downtime for another enterprise",
            )

    duration_minutes = calculate_duration_minutes(data.start_time, data.end_time)

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
):
    stmt = select(Downtime).join(Equipment, Downtime.equipment_id == Equipment.id)

    if current_user.role != UserRole.SUPER_ADMIN:
        stmt = stmt.where(Equipment.enterprise_id == current_user.enterprise_id)

    stmt = stmt.order_by(Downtime.id)

    result = await db.execute(stmt)
    downtimes = result.scalars().all()

    return downtimes


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