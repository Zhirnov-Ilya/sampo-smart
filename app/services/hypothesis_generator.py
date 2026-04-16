from app.models import Downtime, Hypothesis
from app.schemas import HypothesisAIResponse
from app.services.ai_provider import BaseAIProvider

class HypothesisGenerator:

    HYPOTHESIS_GENERATION_PROMPT_TEMPLATE = """
        Ты AI-ассистент промышленной аналитики.
        На основе данных о простое оборудования сформируй гипотезу по улучшению производственных показателей.

        Требования к ответу:
        1. Верни только JSON-объект.
        2. Не используй markdown.
        3. Не оборачивай ответ в ```json или ``` .
        4. Не добавляй пояснений до или после JSON.
        5. Используй строго следующие поля:
        - title: string
        - problem_description: string
        - root_cause: string | null
        - suggested_action: string
        - expected_downtime_reduction_hours: number | null
        - expected_cost_savings_rub: number | null
        - implementation_cost_rub: number | null
        - implementation_time_days: integer | null
        - priority_score: number | null
        - risks: array[string] | null
        - data_sources: array[string] | null
        - similar_cases: array[string] | null
        6. Для числовых полей возвращай числа, а не строки.
        7. Для risks, data_sources и similar_cases всегда возвращай массив строк или null.
        8. Не добавляй никаких дополнительных полей.


        Данные о простое:
        - equipment_id: {equipment_id}
        - start_time: {start_time}
        - end_time: {end_time}
        - duration_minutes: {duration_minutes}
        - reason_category: {reason_category}
        - reason_details: {reason_details}
        - production_loss_units: {production_loss_units}
        - cost_impact_rub: {cost_impact_rub}
        - reported_by: {reported_by}
        """.strip()

    def __init__(self, provider: BaseAIProvider):
        self.provider = provider

    def build_prompt(self, downtime: Downtime) -> str:
        return self.HYPOTHESIS_GENERATION_PROMPT_TEMPLATE.format(
            equipment_id=downtime.equipment_id,
            start_time=downtime.start_time,
            end_time=downtime.end_time,
            duration_minutes=downtime.duration_minutes,
            reason_category=downtime.reason_category,
            reason_details=downtime.reason_details,
            production_loss_units=downtime.production_loss_units,
            cost_impact_rub=downtime.cost_impact_rub,
            reported_by=downtime.reported_by,
        )

    async def generate(self, downtime: Downtime) -> Hypothesis:
        prompt = self.build_prompt(downtime)

        raw_result = await self.provider.generate_hypothesis(prompt)
        result = HypothesisAIResponse.model_validate(raw_result)

        return Hypothesis(
            downtime_id=downtime.id,
            title=result.title,
            problem_description=result.problem_description,
            root_cause=result.root_cause,
            suggested_action=result.suggested_action,
            expected_downtime_reduction_hours=result.expected_downtime_reduction_hours,
            expected_cost_savings_rub=result.expected_cost_savings_rub,
            implementation_cost_rub=result.implementation_cost_rub,
            implementation_time_days=result.implementation_time_days,
            priority_score=result.priority_score,
            risks=result.risks,
            data_sources=result.data_sources,
            similar_cases=result.similar_cases,
        )