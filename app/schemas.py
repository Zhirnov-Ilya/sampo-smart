from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models import InspectionStatus, HypothesisStatus



# схемы для таблицы EquipmentType  
class EquipmentTypeBase(BaseModel):
    type_name: str


class EquipmentTypeCreate(EquipmentTypeBase):
    pass


class EquipmentTypeRead(EquipmentTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



# схемы для таблицы Equipment 
class EquipmentBase(BaseModel):
    equipment_code: str
    name: str
    location: Optional[str] = None
    equipment_type_id: int


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentRead(EquipmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



# схемы для таблицы Downtime 
class DowntimeBase(BaseModel):
    equipment_id: int
    start_time: datetime
    end_time: datetime
    reason_category: Optional[str] = None
    reason_details: Optional[str] = None
    production_loss_units: Optional[float] = None
    cost_impact_rub: Optional[float] = None
    reported_by: Optional[str] = None


class DowntimeCreate(DowntimeBase):
    pass


class DowntimeRead(DowntimeBase):
    id: int
    duration_minutes: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



# схемы для таблицы Inspection 
class InspectionBase(BaseModel):
    equipment_id: int
    inspector_name: str
    check_time: datetime
    status: InspectionStatus
    notes: Optional[str] = None
    photos_urls: Optional[list[str]] = None


class InspectionCreate(InspectionBase):
    pass


class InspectionRead(InspectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



# схемы для таблицы Hypothesis 
class HypothesisBase(BaseModel):
    downtime_id: int
    title: str
    problem_description: str
    root_cause: Optional[str] = None
    suggested_action: str
    expected_downtime_reduction_hours: Optional[float] = None
    expected_cost_savings_rub: Optional[float] = None
    implementation_cost_rub: Optional[float] = None
    implementation_time_days: Optional[int] = None
    priority_score: Optional[float] = None
    risks: Optional[list[str]] = None
    data_sources: Optional[list[str]] = None
    similar_cases: Optional[list[str]] = None


class HypothesisCreate(HypothesisBase):
    pass


class HypothesisRead(HypothesisBase):
    id: int
    status: HypothesisStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HypothesisStatusUpdate(BaseModel):
    status: HypothesisStatus