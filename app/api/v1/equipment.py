from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_active_user, require_roles
from app.database import get_db
from app.models import Enterprise, EquipmentType, Equipment, User, UserRole
from app.schemas import (
    EquipmentTypeCreate,
    EquipmentTypeRead,
    EquipmentTypeUpdate,
    EquipmentCreate,
    EquipmentRead,
    EquipmentUpdate,
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
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
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
    current_user: User = Depends(get_current_active_user),
    is_active: bool | None = None,
):
    stmt = select(EquipmentType).where(EquipmentType.is_active == is_active).order_by(EquipmentType.id)
    result = await db.execute(stmt)
    equipment_types = result.scalars().all()

    return equipment_types

@router.put(
    "/equipment-types/{equipment_type_id}",
    response_model = EquipmentTypeRead,
)
async def put_equipment_type(
    equipment_type_id: int,
    data: EquipmentTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(EquipmentType).where(EquipmentType.id == equipment_type_id)
    result = await db.execute(stmt)
    equipment_type = result.scalar_one_or_none()

    if (equipment_type is None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment-type not found",
        )
    
    stmt = select(EquipmentType).where(
        EquipmentType.type_name == data.type_name,
        EquipmentType.id != equipment_type_id)
    result = await db.execute(stmt)
    existing_type = result.scalar_one_or_none()

    if existing_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment-type with this name already exists",
        )

    equipment_type.type_name = data.type_name
    equipment_type.is_active = data.is_active

    await db.commit()
    await db.refresh(equipment_type)

    return equipment_type

@router.patch(
    "/equipment-types/{equipment_type_id}/activate",
    response_model=EquipmentTypeRead,
)

async def activate_equipment_type(
    equipment_type_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(EquipmentType).where(EquipmentType.id == equipment_type_id)
    result = await db.execute(stmt)
    equipment_type = result.scalar_one_or_none()

    if equipment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment-type not found",
        )
    
    equipment_type.is_active = True
    
    await db.commit()
    await db.refresh(equipment_type)

    return equipment_type

@router.patch(
    "/equipment-types/{equipment_type_id}/deactivate",
    response_model=EquipmentTypeRead,
)
async def deactivate_equipment_type(
    equipment_type_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    stmt = select(EquipmentType).where(EquipmentType.id == equipment_type_id)
    result = await db.execute(stmt)
    equipment_type = result.scalar_one_or_none()

    if equipment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment-type not found",
        )
    
    equipment_type.is_active = False
    
    await db.commit()
    await db.refresh(equipment_type)

    return equipment_type


@router.post(
    "/equipment",
    response_model=EquipmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_equipment(
    data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.ENTERPRISE_ADMIN,
        )
    ),
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

    stmt_enterprise = select(Enterprise).where(Enterprise.id == data.enterprise_id)
    result_enterprise = await db.execute(stmt_enterprise)
    enterprise = result_enterprise.scalar_one_or_none()

    if enterprise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.enterprise_id != data.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create equipment for another enterprise",
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
        enterprise_id=data.enterprise_id,
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
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(Equipment)

    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.role == UserRole.ENTERPRISE_ADMIN:
            stmt = stmt.where(Equipment.enterprise_id == current_user.enterprise_id)
        elif current_user.role == UserRole.MANAGER:
            stmt = stmt.where(
                Equipment.enterprise_id == current_user.enterprise_id,
                Equipment.is_active == True,
                )

    stmt = stmt.order_by(Equipment.id)

    result = await db.execute(stmt)
    equipment_list = result.scalars().all()

    return equipment_list


@router.get(
    "/equipment/{equipment_id}",
    response_model=EquipmentRead,
)
async def get_equipment_by_id(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(Equipment).where(
        Equipment.id == equipment_id,
        Equipment.is_active == True
    )
    result = await db.execute(stmt)
    equipment = result.scalar_one_or_none()

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        if equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    return equipment

@router.put(
    "/equipment/{equipment_id}",
    response_model=EquipmentRead,
)
async def update_equipment(
    equipment_id: int,
    data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN)),
):
    stmt = select(Equipment).where(Equipment.id == equipment_id)
    result = await db.execute(stmt)
    equipment = result.scalar_one_or_none()

    if (equipment is None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    
    if (current_user.role != UserRole.SUPER_ADMIN):
        if equipment.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        
        if data.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can't move equipment to another enterprise",
            )
    
    stmt_type = select(EquipmentType).where(
        EquipmentType.id == data.equipment_type_id
    )
    result_type = await db.exceute(stmt_type)
    equipment_type = result_type.scalar_one_or_none()

    if (equipment_type is None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment type not found",
        )
    
    stmt_enterprise = select(Enterprise).where(Enterprise.id == data.enterprise_id)
    result_enterprise = await db.execute(stmt_enterprise)
    enterprise = result_enterprise.scalar_one_or_none()

    if (enterprise is None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found",
        )
    
    duplicate_stmt = select(Equipment).where(
        Equipment.equipment_code == data.equipment_code,
        Equipment.id != equipment_id,
    )
    duplicate_result = await db.execute(duplicate_stmt)
    duplicate_equipment = duplicate_result.scalar_one_or_none()

    if duplicate_equipment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this code already exists",
        )
    
    equipment.equipment_code = data.equipment_code
    equipment.name = data.name
    equipment.location = data.location
    equipment.enterprise_id = data.enterprise_id
    equipment.equipment_type_id = data.equipment_type_id
    equipment.is_active = data.is_active

    await db.commit()
    await db.refresh(equipment)

    return equipment

@router.patch(
    "/equipment/{equipment_id}/deactivate",
    response_model=EquipmentRead,
)
async def deactivate_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN))
):
    stmt = select(Equipment).where(Equipment.id == equipment_id)
    result = await db.execute(stmt)
    equipmnet = result.scalar_one_or_none()

    if (equipment is None):
        raise HTTPException(
            status=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    
    if (current_user.role != UserRole.SUPER_ADMIN):
        if (current_user.enterprise_id != equipmnet.enterprise_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
    
    equipment.is_active = False

    await db.commit()
    await db.refresh(equipmnet)

    return equipmnet
    
@router.patch(
    "equipment/{equipment_id}/activate",
    response_model=EquipmentRead,
)
async def activate_equipment(
    equipment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN)),
):
    stmt = select(Equipment).where(Equipment.id == equipment_id)
    result = await db.execute(stmt)
    equipment = result.scalar_one_or_none()

    if (equipment is None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    
    if (current_user.role != UserRole.SUPER_ADMIN):
        if (current_user.enterprise_id != equipment.enterprise_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    equipment.is_active = True

    await db.commit()
    await db.refresh(equipment)

    return equipment
