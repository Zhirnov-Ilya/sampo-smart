from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Downtime, Hypothesis
from app.schemas import HypothesisRead, HypothesisStatusUpdate
from app.services.hypothesis_service import generate_hypothesis_from_downtime


router = APIRouter(prefix="/api/v1", tags=["Hypotheses"])


@router.post(
    "/hypotheses/generate/{downtime_id}",
    response_model=HypothesisRead,
    status_code=status.HTTP_201_CREATED,
)
async def generate_hypothesis(
    downtime_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Downtime).where(Downtime.id == downtime_id)
    result = await db.execute(stmt)
    downtime = result.scalar_one_or_none()

    if downtime is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Downtime not found",
        )

    hypothesis = generate_hypothesis_from_downtime(downtime)

    db.add(hypothesis)
    await db.commit()
    await db.refresh(hypothesis)

    return hypothesis

@router.get(
    "/hypotheses",
    response_model = list[HypothesisRead],
)
async def get_hypotheses(
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Hypothesis).order_by(Hypothesis.id)
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
):
    stmt = select(Hypothesis).where(Hypothesis.id == hypothesis_id)
    result = await db.execute(stmt)
    hypothesis = result.scalar_one_or_none()

    if hypothesis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hypothesis not found",
        )
    
    return hypothesis

@router.put(
    "/hypotheses/{hypothesis_id}/status",
    response_model=HypothesisRead
)
async def update_hypothesis_status(
    hypothesis_id: int,
    data: HypothesisStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Hypothesis).where(Hypothesis.id == hypothesis_id)
    result = await db.execute(stmt)
    hypothesis = result.scalar_one_or_none()

    if hypothesis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hypothesis not found"
        )
    
    hypothesis.status = data.status
    await db.commit()
    await db.refresh(hypothesis)

    return hypothesis