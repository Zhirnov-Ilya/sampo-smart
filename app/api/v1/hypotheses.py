from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models import Downtime, Equipment, Hypothesis, User, UserRole
from app.schemas import HypothesisRead, HypothesisStatusUpdate
from app.services.hypothesis_generator import HypothesisGenerator
from app.services.yandex_provider import YandexAIProvider


router = APIRouter(prefix="/api/v1", tags=["Hypotheses"])


@router.post(
    "/hypotheses/generate/{downtime_id}",
    response_model=HypothesisRead,
    status_code=status.HTTP_201_CREATED,
)
async def generate_hypothesis(
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

    equipment_stmt = select(Equipment).where(Equipment.id == downtime.equipment_id)
    equipment_result = await db.execute(equipment_stmt)
    equipment = equipment_result.scalar_one_or_none()

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        if equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot generate hypotheses for another enterprise",
            )

    provider = YandexAIProvider()
    generator = HypothesisGenerator(provider=provider)
    hypothesis = await generator.generate(downtime)

    duplicate_stmt = select(Hypothesis).where(
        Hypothesis.downtime_id == hypothesis.downtime_id,
        Hypothesis.title == hypothesis.title,
    )
    duplicate_result = await db.execute(duplicate_stmt)
    existing_hypothesis = duplicate_result.scalar_one_or_none()

    if existing_hypothesis is not None:
        return existing_hypothesis

    db.add(hypothesis)
    await db.commit()
    await db.refresh(hypothesis)

    return hypothesis


@router.get(
    "/hypotheses",
    response_model=list[HypothesisRead],
)
async def get_hypotheses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = (
        select(Hypothesis)
        .join(Downtime, Hypothesis.downtime_id == Downtime.id)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
    )

    if current_user.role != UserRole.SUPER_ADMIN:
        stmt = stmt.where(Equipment.enterprise_id == current_user.enterprise_id)

    stmt = stmt.order_by(Hypothesis.id)

    result = await db.execute(stmt)
    hypotheses = result.scalars().all()

    return hypotheses


@router.get(
    "/hypotheses/{hypothesis_id}",
    response_model=HypothesisRead,
)
async def get_hypothesis_by_id(
    hypothesis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = (
        select(Hypothesis)
        .join(Downtime, Hypothesis.downtime_id == Downtime.id)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
        .where(Hypothesis.id == hypothesis_id)
    )

    result = await db.execute(stmt)
    hypothesis = result.scalar_one_or_none()

    if hypothesis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hypothesis not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        downtime_stmt = select(Downtime).where(Downtime.id == hypothesis.downtime_id)
        downtime_result = await db.execute(downtime_stmt)
        downtime = downtime_result.scalar_one_or_none()

        if downtime is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Downtime not found",
            )

        equipment_stmt = select(Equipment).where(Equipment.id == downtime.equipment_id)
        equipment_result = await db.execute(equipment_stmt)
        equipment = equipment_result.scalar_one_or_none()

        if equipment is None or equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return hypothesis


@router.put(
    "/hypotheses/{hypothesis_id}/status",
    response_model=HypothesisRead,
)
async def update_hypothesis_status(
    hypothesis_id: int,
    data: HypothesisStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.ENTERPRISE_ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    stmt = (
        select(Hypothesis)
        .join(Downtime, Hypothesis.downtime_id == Downtime.id)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
        .where(Hypothesis.id == hypothesis_id)
    )

    result = await db.execute(stmt)
    hypothesis = result.scalar_one_or_none()

    if hypothesis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hypothesis not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        downtime_stmt = select(Downtime).where(Downtime.id == hypothesis.downtime_id)
        downtime_result = await db.execute(downtime_stmt)
        downtime = downtime_result.scalar_one_or_none()

        if downtime is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Downtime not found",
            )

        equipment_stmt = select(Equipment).where(Equipment.id == downtime.equipment_id)
        equipment_result = await db.execute(equipment_stmt)
        equipment = equipment_result.scalar_one_or_none()

        if equipment is None or equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    hypothesis.status = data.status

    await db.commit()
    await db.refresh(hypothesis)

    return hypothesis