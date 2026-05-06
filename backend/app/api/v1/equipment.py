from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
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


async def get_equipment_type_or_404(
    equipment_type_id: int,
    db: AsyncSession,
) -> EquipmentType:
    stmt = select(EquipmentType).where(EquipmentType.id == equipment_type_id)
    result = await db.execute(stmt)
    equipment_type = result.scalar_one_or_none()

    if equipment_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment type not found",
        )

    return equipment_type


def check_enterprise_is_active(enterprise: Enterprise) -> None:
    if not enterprise.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot use inactive enterprise",
        )


def check_equipment_type_is_active(equipment_type: EquipmentType) -> None:
    if not equipment_type.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot use inactive equipment type",
        )

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
    search: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    sort_order: Literal["newest", "oldest"] = Query(default="newest"),
):
    stmt = select(EquipmentType)

    if current_user.role == UserRole.SUPER_ADMIN:
        if is_active is not None:
            stmt = stmt.where(EquipmentType.is_active.is_(is_active))
    else:
        stmt = stmt.where(EquipmentType.is_active.is_(True))

    if search:
        normalized_search = search.strip()

        if normalized_search:
            stmt = stmt.where(
                EquipmentType.type_name.ilike(f"%{normalized_search}%")
            )

    if sort_order == "oldest":
        stmt = stmt.order_by(EquipmentType.created_at.asc(), EquipmentType.id.asc())
    else:
        stmt = stmt.order_by(EquipmentType.created_at.desc(), EquipmentType.id.desc())

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
    if current_user.role == UserRole.ENTERPRISE_ADMIN:
        if current_user.enterprise_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no enterprise assigned",
            )

        if data.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    enterprise = await get_enterprise_or_404(data.enterprise_id, db)
    equipment_type = await get_equipment_type_or_404(data.equipment_type_id, db)

    check_enterprise_is_active(enterprise)
    check_equipment_type_is_active(equipment_type)

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
    search: str | None = Query(default=None),
    enterprise_id: int | None = Query(default=None),
    equipment_type_id: int | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    sort_order: Literal["newest", "oldest"] = Query(default="newest"),
):
    stmt = select(Equipment)

    if current_user.role == UserRole.SUPER_ADMIN:
        if enterprise_id is not None:
            stmt = stmt.where(Equipment.enterprise_id == enterprise_id)
    else:
        if current_user.enterprise_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no enterprise assigned",
            )

        if enterprise_id is not None and enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        stmt = stmt.where(Equipment.enterprise_id == current_user.enterprise_id)

        if current_user.role in {UserRole.MANAGER, UserRole.ANALYST}:
            stmt = stmt.where(Equipment.is_active.is_(True))

    if equipment_type_id is not None:
        stmt = stmt.where(Equipment.equipment_type_id == equipment_type_id)
    
    if is_active is not None:
        stmt = stmt.where(Equipment.is_active.is_(is_active))

    if search:
        normalized_search = search.strip()

        if normalized_search:
            stmt = stmt.where(
                Equipment.name.ilike(f"%{normalized_search}%")
            )

    if sort_order == "oldest":
        stmt = stmt.order_by(Equipment.created_at.asc(), Equipment.id.asc())
    else:
        stmt = stmt.order_by(Equipment.created_at.desc(), Equipment.id.desc())

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
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN)
    ),
):
    stmt = select(Equipment).where(Equipment.id == equipment_id)
    result = await db.execute(stmt)
    equipment = result.scalar_one_or_none()

    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    if current_user.role == UserRole.ENTERPRISE_ADMIN:
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

        if data.enterprise_id != current_user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

    enterprise = await get_enterprise_or_404(data.enterprise_id, db)
    equipment_type = await get_equipment_type_or_404(data.equipment_type_id, db)

    if data.enterprise_id != equipment.enterprise_id:
        check_enterprise_is_active(enterprise)

    if data.equipment_type_id != equipment.equipment_type_id:
        check_equipment_type_is_active(equipment_type)

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
    
    equipment.is_active = False

    await db.commit()
    await db.refresh(equipment)

    return equipment
    
@router.patch(
    "/equipment/{equipment_id}/activate",
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
