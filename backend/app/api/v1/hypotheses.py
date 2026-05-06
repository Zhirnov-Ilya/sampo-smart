from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models import (
    Downtime,
    Enterprise,
    Equipment,
    EquipmentType,
    Hypothesis,
    HypothesisStatus,
    User,
    UserRole,
)
from app.schemas import HypothesisRead, HypothesisStatusUpdate
from app.services.hypothesis_generator import (
    HypothesisGenerationContext,
    HypothesisGenerator,
    RelatedDowntimeContext,
)
from app.services.yandex_provider import YandexAIProvider


router = APIRouter(prefix="/api/v1", tags=["Hypotheses"])


def check_equipment_access(
    equipment: Equipment,
    current_user: User,
    detail: str = "Access denied",
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
            detail=detail,
        )


async def get_downtime_with_equipment_or_404(
    downtime_id: int,
    db: AsyncSession,
) -> tuple[Downtime, Equipment]:
    stmt = (
        select(Downtime, Equipment)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
        .where(Downtime.id == downtime_id)
    )

    result = await db.execute(stmt)
    row = result.first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Downtime not found",
        )

    downtime, equipment = row

    return downtime, equipment


async def get_hypothesis_with_equipment_or_404(
    hypothesis_id: int,
    db: AsyncSession,
) -> tuple[Hypothesis, Equipment]:
    stmt = (
        select(Hypothesis, Equipment)
        .join(Downtime, Hypothesis.downtime_id == Downtime.id)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
        .where(Hypothesis.id == hypothesis_id)
    )

    result = await db.execute(stmt)
    row = result.first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hypothesis not found",
        )

    hypothesis, equipment = row

    return hypothesis, equipment

async def build_hypothesis_generation_context(
    downtime: Downtime,
    equipment: Equipment,
    db: AsyncSession,
) -> HypothesisGenerationContext:
    enterprise_stmt = select(Enterprise).where(
        Enterprise.id == equipment.enterprise_id
    )
    enterprise_result = await db.execute(enterprise_stmt)
    enterprise = enterprise_result.scalar_one_or_none()

    equipment_type_stmt = select(EquipmentType).where(
        EquipmentType.id == equipment.equipment_type_id
    )
    equipment_type_result = await db.execute(equipment_type_stmt)
    equipment_type = equipment_type_result.scalar_one_or_none()

    stats_stmt = select(
        func.count(Downtime.id),
        func.coalesce(func.sum(Downtime.duration_minutes), 0),
        func.avg(Downtime.duration_minutes),
        func.coalesce(func.sum(Downtime.cost_impact_rub), 0),
    ).where(Downtime.equipment_id == equipment.id)

    stats_result = await db.execute(stats_stmt)
    (
        total_downtime_count,
        total_downtime_minutes,
        average_downtime_minutes,
        total_cost_impact_rub,
    ) = stats_result.one()

    reason_stats_stmt = (
        select(
            Downtime.reason_category,
            func.count(Downtime.id),
            func.coalesce(func.sum(Downtime.duration_minutes), 0),
        )
        .where(Downtime.equipment_id == equipment.id)
        .group_by(Downtime.reason_category)
        .order_by(func.count(Downtime.id).desc())
        .limit(5)
    )

    reason_stats_result = await db.execute(reason_stats_stmt)
    reason_stats_rows = reason_stats_result.all()

    top_reason_categories = [
        (
            f"{reason_category or 'не указана'} — "
            f"{count} раз, суммарно {int(total_minutes or 0)} мин."
        )
        for reason_category, count, total_minutes in reason_stats_rows
    ]

    recent_downtimes_stmt = (
        select(Downtime)
        .where(
            Downtime.equipment_id == equipment.id,
            Downtime.id != downtime.id,
        )
        .order_by(Downtime.start_time.desc(), Downtime.id.desc())
        .limit(5)
    )

    recent_downtimes_result = await db.execute(recent_downtimes_stmt)
    recent_downtimes = recent_downtimes_result.scalars().all()

    recent_downtime_context = [
        RelatedDowntimeContext(
            id=item.id,
            start_time=str(item.start_time),
            duration_minutes=item.duration_minutes,
            reason_category=item.reason_category,
            reason_details=item.reason_details,
            production_loss_units=item.production_loss_units,
            cost_impact_rub=item.cost_impact_rub,
        )
        for item in recent_downtimes
    ]

    return HypothesisGenerationContext(
        equipment_name=equipment.name,
        equipment_code=equipment.equipment_code,
        equipment_location=equipment.location,
        equipment_type_name=equipment_type.type_name if equipment_type else None,
        enterprise_name=enterprise.name if enterprise else None,
        enterprise_industry=enterprise.industry if enterprise else None,
        equipment_total_downtime_count=int(total_downtime_count or 0),
        equipment_total_downtime_minutes=int(total_downtime_minutes or 0),
        equipment_average_downtime_minutes=(
            float(average_downtime_minutes)
            if average_downtime_minutes is not None
            else None
        ),
        equipment_total_cost_impact_rub=float(total_cost_impact_rub or 0),
        top_reason_categories=top_reason_categories,
        recent_downtimes=recent_downtime_context,
    )

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
    downtime, equipment = await get_downtime_with_equipment_or_404(
        downtime_id=downtime_id,
        db=db,
    )

    check_equipment_access(
        equipment=equipment,
        current_user=current_user,
        detail="You cannot generate hypotheses for another enterprise",
    )

    context = await build_hypothesis_generation_context(
        downtime=downtime,
        equipment=equipment,
        db=db,
    )

    provider = YandexAIProvider()
    generator = HypothesisGenerator(provider=provider)

    try:
        hypothesis = await generator.generate(
            downtime=downtime,
            context=context,
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Не удалось сгенерировать гипотезу. "
                "Проверь настройки AI-провайдера или попробуй позже."
            ),
        ) from error

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
    search: str | None = Query(default=None),
    hypothesis_status: HypothesisStatus | None = Query(
        default=None,
        alias="status",
    ),
    priority: Literal["high", "medium", "low"] | None = Query(default=None),
    downtime_id: int | None = Query(default=None),
    sort_order: Literal["newest", "oldest"] = Query(default="newest"),
):
    stmt = (
        select(Hypothesis)
        .join(Downtime, Hypothesis.downtime_id == Downtime.id)
        .join(Equipment, Downtime.equipment_id == Equipment.id)
    )

    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.enterprise_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no enterprise assigned",
            )

        stmt = stmt.where(Equipment.enterprise_id == current_user.enterprise_id)

    if search:
        normalized_search = search.strip()

        if normalized_search:
            stmt = stmt.where(
                or_(
                    Hypothesis.title.ilike(f"%{normalized_search}%"),
                    Hypothesis.problem_description.ilike(f"%{normalized_search}%"),
                    Hypothesis.root_cause.ilike(f"%{normalized_search}%"),
                    Hypothesis.suggested_action.ilike(f"%{normalized_search}%"),
                )
            )

    if hypothesis_status is not None:
        stmt = stmt.where(Hypothesis.status == hypothesis_status)

    if downtime_id is not None:
        stmt = stmt.where(Hypothesis.downtime_id == downtime_id)

    if priority == "high":
        stmt = stmt.where(Hypothesis.priority_score >= 8)
    elif priority == "medium":
        stmt = stmt.where(
            Hypothesis.priority_score >= 5,
            Hypothesis.priority_score < 8,
        )
    elif priority == "low":
        stmt = stmt.where(Hypothesis.priority_score < 5)

    if sort_order == "oldest":
        stmt = stmt.order_by(Hypothesis.created_at.asc(), Hypothesis.id.asc())
    else:
        stmt = stmt.order_by(Hypothesis.created_at.desc(), Hypothesis.id.desc())

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
    hypothesis, equipment = await get_hypothesis_with_equipment_or_404(
        hypothesis_id=hypothesis_id,
        db=db,
    )

    check_equipment_access(
        equipment=equipment,
        current_user=current_user,
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
    hypothesis, equipment = await get_hypothesis_with_equipment_or_404(
        hypothesis_id=hypothesis_id,
        db=db,
    )

    check_equipment_access(
        equipment=equipment,
        current_user=current_user,
    )

    hypothesis.status = data.status

    await db.commit()
    await db.refresh(hypothesis)

    return hypothesis


@router.delete(
    "/hypotheses/{hypothesis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_hypothesis(
    hypothesis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.ENTERPRISE_ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    hypothesis, equipment = await get_hypothesis_with_equipment_or_404(
        hypothesis_id=hypothesis_id,
        db=db,
    )

    check_equipment_access(
        equipment=equipment,
        current_user=current_user,
    )

    await db.delete(hypothesis)
    await db.commit()

    return None