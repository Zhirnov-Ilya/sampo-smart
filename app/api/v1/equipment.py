from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import EquipmentType, Equipment
from app.schemas import (
    EquipmentTypeCreate,
    EquipmentTypeRead,
    EquipmentCreate,
    EquipmentRead,
)


router = APIRouter(prefix="/api/v1", tags=["Equipment"])


@router.post(
    "/equipment-types",
    response_model=EquipmentTypeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_equipment_type(
    data: EquipmentTypeCreate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EquipmentType).where(EquipmentType.type_name == data.type_name)
    result = await db.execute(stmt)
    existing_type = result.scalar_one_or_none()

    if existing_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment type with this name already exists",
        )

    equipment_type = EquipmentType(type_name=data.type_name)
    db.add(equipment_type)
    await db.commit()
    await db.refresh(equipment_type)

    return equipment_type


@router.get(
    "/equipment-types",
    response_model=list[EquipmentTypeRead],
)
async def get_equipment_types(
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EquipmentType).order_by(EquipmentType.id)
    result = await db.execute(stmt)
    equipment_types = result.scalars().all()

    return equipment_types


@router.post(
    "/equipment",
    response_model=EquipmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_equipment(
    data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
):
    stmt_type = select(EquipmentType).where(
        EquipmentType.id == data.equipment_type_id
    )
    result_type = await db.execute(stmt_type)
    equipment_type = result_type.scalar_one_or_none()

    if equipment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment type not found",
        )

    stmt_equipment = select(Equipment).where(
        Equipment.equipment_code == data.equipment_code
    )
    result_equipment = await db.execute(stmt_equipment)
    existing_equipment = result_equipment.scalar_one_or_none()

    if existing_equipment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this code already exists",
        )

    equipment = Equipment(
        equipment_code=data.equipment_code,
        name=data.name,
        location=data.location,
        equipment_type_id=data.equipment_type_id,
    )

    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)

    return equipment


@router.get(
    "/equipment",
    response_model=list[EquipmentRead],
)
async def get_equipment_list(
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Equipment).order_by(Equipment.id)
    result = await db.execute(stmt)
    equipment_list = result.scalars().all()

    return equipment_list