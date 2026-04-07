from app.models import Downtime, Hypothesis


def calculate_priority_score(
    duration_minutes: int,
    cost_impact_rub: float | None,
) -> float:
    score = 1.0

    if duration_minutes >= 180:
        score += 3.0
    elif duration_minutes >= 60:
        score += 2.0
    else:
        score += 1.0

    if cost_impact_rub:
        if cost_impact_rub >= 100000:
            score += 3.0
        elif cost_impact_rub >= 30000:
            score += 2.0
        else:
            score += 1.0

    return round(score, 2)


def generate_hypothesis_from_downtime(downtime: Downtime) -> Hypothesis:
    reason_category = (downtime.reason_category or "").lower()
    reason_details = downtime.reason_details or "Причина не указана"

    if "mechanical" in reason_category:
        title = "Снижение механических простоев за счёт профилактического обслуживания"
        root_cause = "Вероятный износ механических узлов или недостаточная профилактика"
        suggested_action = (
            "Пересмотреть график профилактического обслуживания, "
            "проверить критические механические узлы и усилить контроль состояния оборудования."
        )
    elif "electrical" in reason_category:
        title = "Снижение электрических простоев за счёт диагностики электросистем"
        root_cause = "Вероятные проблемы в электропитании или износ электрических компонентов"
        suggested_action = (
            "Провести диагностику электрических цепей, проверить соединения, "
            "нагрузку и состояние ключевых электрических компонентов."
        )
    elif "overheat" in reason_category or "temperature" in reason_category:
        title = "Снижение простоев из-за перегрева за счёт контроля охлаждения"
        root_cause = "Недостаточное охлаждение или несвоевременная очистка системы"
        suggested_action = (
            "Проверить систему охлаждения, очистить вентиляционные каналы, "
            "усилить контроль температуры и пересмотреть регламент профилактики."
        )
    else:
        title = "Снижение простоев за счёт дополнительного анализа причин и профилактики"
        root_cause = "Точная первопричина требует дополнительного анализа"
        suggested_action = (
            "Провести детальный разбор причин простоя, классифицировать повторяющиеся инциденты "
            "и внедрить профилактические мероприятия для наиболее частых сценариев."
        )

    expected_downtime_reduction_hours = round(downtime.duration_minutes / 60 * 4, 2)

    expected_cost_savings_rub = None
    if downtime.cost_impact_rub is not None:
        expected_cost_savings_rub = round(downtime.cost_impact_rub * 3, 2)

    implementation_cost_rub = 15000.0
    implementation_time_days = 7

    priority_score = calculate_priority_score(
        duration_minutes=downtime.duration_minutes,
        cost_impact_rub=downtime.cost_impact_rub,
    )

    risks = [
        "Недостаточная дисциплина исполнения профилактических мероприятий",
        "Эффект может быть ниже ожидаемого без дополнительного контроля",
    ]

    data_sources = [
        "Журнал простоев",
        "Данные о длительности простоя",
        "Категория причины простоя",
    ]

    similar_cases = [
        "CASE-MVP-001",
    ]

    return Hypothesis(
        downtime_id=downtime.id,
        title=title,
        problem_description=reason_details,
        root_cause=root_cause,
        suggested_action=suggested_action,
        expected_downtime_reduction_hours=expected_downtime_reduction_hours,
        expected_cost_savings_rub=expected_cost_savings_rub,
        implementation_cost_rub=implementation_cost_rub,
        implementation_time_days=implementation_time_days,
        priority_score=priority_score,
        risks=risks,
        data_sources=data_sources,
        similar_cases=similar_cases,
    )