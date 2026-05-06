from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user
from app.database import get_db
from app.models import Equipment, Downtime, Hypothesis, HypothesisStatus, User, UserRole
from app.schemas import AnalyticsSummaryRead


router = APIRouter(prefix="/api/v1", tags=["Analytics"])


@router.get(
    "/analytics/summary",
    response_model=AnalyticsSummaryRead,
)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.SUPER_ADMIN:
        equipment_count_result = await db.execute(
            select(func.count(Equipment.id))
        )
        equipment_count = equipment_count_result.scalar() or 0

        downtime_count_result = await db.execute(
            select(func.count(Downtime.id))
        )
        downtime_count = downtime_count_result.scalar() or 0

        hypothesis_count_result = await db.execute(
            select(func.count(Hypothesis.id))
        )
        hypothesis_count = hypothesis_count_result.scalar() or 0

        accepted_hypothesis_count_result = await db.execute(
            select(func.count(Hypothesis.id)).where(
                Hypothesis.status == HypothesisStatus.ACCEPTED
            )
        )
        accepted_hypothesis_count = accepted_hypothesis_count_result.scalar() or 0

        total_cost_impact_result = await db.execute(
            select(func.sum(Downtime.cost_impact_rub))
        )
        total_cost_impact_rub = total_cost_impact_result.scalar() or 0.0

    else:
        equipment_count_result = await db.execute(
            select(func.count(Equipment.id)).where(
                Equipment.enterprise_id == current_user.enterprise_id
            )
        )
        equipment_count = equipment_count_result.scalar() or 0

        downtime_count_result = await db.execute(
            select(func.count(Downtime.id))
            .join(Equipment, Downtime.equipment_id == Equipment.id)
            .where(Equipment.enterprise_id == current_user.enterprise_id)
        )
        downtime_count = downtime_count_result.scalar() or 0

        hypothesis_count_result = await db.execute(
            select(func.count(Hypothesis.id))
            .join(Downtime, Hypothesis.downtime_id == Downtime.id)
            .join(Equipment, Downtime.equipment_id == Equipment.id)
            .where(Equipment.enterprise_id == current_user.enterprise_id)
        )
        hypothesis_count = hypothesis_count_result.scalar() or 0

        accepted_hypothesis_count_result = await db.execute(
            select(func.count(Hypothesis.id))
            .join(Downtime, Hypothesis.downtime_id == Downtime.id)
            .join(Equipment, Downtime.equipment_id == Equipment.id)
            .where(
                Equipment.enterprise_id == current_user.enterprise_id,
                Hypothesis.status == HypothesisStatus.ACCEPTED,
            )
        )
        accepted_hypothesis_count = accepted_hypothesis_count_result.scalar() or 0

        total_cost_impact_result = await db.execute(
            select(func.sum(Downtime.cost_impact_rub))
            .join(Equipment, Downtime.equipment_id == Equipment.id)
            .where(Equipment.enterprise_id == current_user.enterprise_id)
        )
        total_cost_impact_rub = total_cost_impact_result.scalar() or 0.0

    return AnalyticsSummaryRead(
        equipment_count=equipment_count,
        downtime_count=downtime_count,
        hypothesis_count=hypothesis_count,
        accepted_hypothesis_count=accepted_hypothesis_count,
        total_cost_impact_rub=float(total_cost_impact_rub),
    )