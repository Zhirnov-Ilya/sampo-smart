from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InspectionStatus(str, Enum):
    OK = "ok"
    WARNING = "warning"
    CRITICAL = "critical"


class HypothesisStatus(str, Enum):
    NEW = "new"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class EquipmentType(Base):
    __tablename__ = "equipment_types"

    type_name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)

    equipments: Mapped[list["Equipment"]] = relationship(
        back_populates="equipment_type",
        cascade="all, delete-orphan",
    )


class Equipment(Base):
    __tablename__ = "equipment"

    equipment_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    equipment_type_id: Mapped[int] = mapped_column(
        ForeignKey("equipment_types.id"),
        nullable=False,
    )

    equipment_type: Mapped["EquipmentType"] = relationship(
        back_populates="equipments",
    )

    downtimes: Mapped[list["Downtime"]] = relationship(
        back_populates="equipment",
        cascade="all, delete-orphan",
    )

    inspections: Mapped[list["Inspection"]] = relationship(
        back_populates="equipment",
        cascade="all, delete-orphan",
    )


class Downtime(Base):
    __tablename__ = "downtimes"

    equipment_id: Mapped[int] = mapped_column(
        ForeignKey("equipment.id"),
        nullable=False,
    )

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(nullable=False)

    reason_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reason_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    production_loss_units: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cost_impact_rub: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reported_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    equipment: Mapped["Equipment"] = relationship(
        back_populates="downtimes",
    )

    hypotheses: Mapped[list["Hypothesis"]] = relationship(
        back_populates="downtime",
        cascade="all, delete-orphan",
    )


class Inspection(Base):
    __tablename__ = "inspections"

    equipment_id: Mapped[int] = mapped_column(
        ForeignKey("equipment.id"),
        nullable=False,
    )

    inspector_name: Mapped[str] = mapped_column(String(100), nullable=False)
    check_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    status: Mapped[InspectionStatus] = mapped_column(
        SqlEnum(InspectionStatus, name="inspection_status", values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        nullable=False,
    )

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photos_urls: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)

    equipment: Mapped["Equipment"] = relationship(
        back_populates="inspections",
    )


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    downtime_id: Mapped[int] = mapped_column(
        ForeignKey("downtimes.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suggested_action: Mapped[str] = mapped_column(Text, nullable=False)

    expected_downtime_reduction_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expected_cost_savings_rub: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    implementation_cost_rub: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    implementation_time_days: Mapped[Optional[int]] = mapped_column(nullable=True)

    priority_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    status: Mapped[HypothesisStatus] = mapped_column(
        SqlEnum(HypothesisStatus, name="hypothesis_status",  values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        nullable=False,
        default=HypothesisStatus.NEW,
        server_default=HypothesisStatus.NEW.value,
    )

    risks: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    data_sources: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    similar_cases: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)

    downtime: Mapped["Downtime"] = relationship(
        back_populates="hypotheses",
    )

    
