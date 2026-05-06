# from app.models import Downtime, Hypothesis
# from app.schemas import HypothesisAIResponse
# from app.services.ai_provider import BaseAIProvider

# class HypothesisGenerator:

#     HYPOTHESIS_GENERATION_PROMPT_TEMPLATE = """
#         Ты AI-ассистент промышленной аналитики.
#         На основе данных о простое оборудования сформируй гипотезу по улучшению производственных показателей.

#         Требования к ответу:
#         1. Верни только JSON-объект.
#         2. Не используй markdown.
#         3. Не оборачивай ответ в ```json или ``` .
#         4. Не добавляй пояснений до или после JSON.
#         5. Используй строго следующие поля:
#         - title: string
#         - problem_description: string
#         - root_cause: string | null
#         - suggested_action: string
#         - expected_downtime_reduction_hours: number | null
#         - expected_cost_savings_rub: number | null
#         - implementation_cost_rub: number | null
#         - implementation_time_days: integer | null
#         - priority_score: number | null
#         - risks: array[string] | null
#         - data_sources: array[string] | null
#         - similar_cases: array[string] | null
#         6. Для числовых полей возвращай числа, а не строки.
#         7. Для risks, data_sources и similar_cases всегда возвращай массив строк или null.
#         8. Не добавляй никаких дополнительных полей.


#         Данные о простое:
#         - equipment_id: {equipment_id}
#         - start_time: {start_time}
#         - end_time: {end_time}
#         - duration_minutes: {duration_minutes}
#         - reason_category: {reason_category}
#         - reason_details: {reason_details}
#         - production_loss_units: {production_loss_units}
#         - cost_impact_rub: {cost_impact_rub}
#         - reported_by: {reported_by}
#         """.strip()

#     def __init__(self, provider: BaseAIProvider):
#         self.provider = provider

#     def build_prompt(self, downtime: Downtime) -> str:
#         return self.HYPOTHESIS_GENERATION_PROMPT_TEMPLATE.format(
#             equipment_id=downtime.equipment_id,
#             start_time=downtime.start_time,
#             end_time=downtime.end_time,
#             duration_minutes=downtime.duration_minutes,
#             reason_category=downtime.reason_category,
#             reason_details=downtime.reason_details,
#             production_loss_units=downtime.production_loss_units,
#             cost_impact_rub=downtime.cost_impact_rub,
#             reported_by=downtime.reported_by,
#         )

#     async def generate(self, downtime: Downtime) -> Hypothesis:
#         prompt = self.build_prompt(downtime)

#         raw_result = await self.provider.generate_hypothesis(prompt)
#         result = HypothesisAIResponse.model_validate(raw_result)

#         return Hypothesis(
#             downtime_id=downtime.id,
#             title=result.title,
#             problem_description=result.problem_description,
#             root_cause=result.root_cause,
#             suggested_action=result.suggested_action,
#             expected_downtime_reduction_hours=result.expected_downtime_reduction_hours,
#             expected_cost_savings_rub=result.expected_cost_savings_rub,
#             implementation_cost_rub=result.implementation_cost_rub,
#             implementation_time_days=result.implementation_time_days,
#             priority_score=result.priority_score,
#             risks=result.risks,
#             data_sources=result.data_sources,
#             similar_cases=result.similar_cases,
#         )

from dataclasses import dataclass
from pydantic import ValidationError

from app.models import Downtime, Hypothesis
from app.schemas import HypothesisAIResponse
from app.services.ai_provider import BaseAIProvider


@dataclass(slots=True)
class RelatedDowntimeContext:
    id: int
    start_time: str
    duration_minutes: int
    reason_category: str | None
    reason_details: str | None
    production_loss_units: float | None
    cost_impact_rub: float | None


@dataclass(slots=True)
class HypothesisGenerationContext:
    equipment_name: str
    equipment_code: str
    equipment_location: str | None
    equipment_type_name: str | None
    enterprise_name: str | None
    enterprise_industry: str | None

    equipment_total_downtime_count: int
    equipment_total_downtime_minutes: int
    equipment_average_downtime_minutes: float | None
    equipment_total_cost_impact_rub: float

    top_reason_categories: list[str]
    recent_downtimes: list[RelatedDowntimeContext]


class HypothesisGenerator:
    HYPOTHESIS_GENERATION_PROMPT_TEMPLATE = """
        Ты AI-ассистент промышленной аналитики для системы мониторинга оборудования.

        Твоя задача — сформировать конкретную инженерно-управленческую гипотезу
        по снижению простоев оборудования и/или финансового ущерба.

        Гипотеза должна быть полезна инженеру, руководителю производства или техническому специалисту.
        Она должна быть связана именно с переданным простоем, оборудованием и историей его простоев.

        Не пиши общие рекомендации вроде:
        - "провести диагностику";
        - "улучшить контроль";
        - "обучить персонал";
        - "провести техническое обслуживание";
        - "проверить оборудование";
        - "усилить мониторинг".

        Такие фразы допустимы только если ты подробно объясняешь:
        - что именно проверить;
        - какой узел, систему или параметр оборудования проверить;
        - почему это связано с текущим простоем;
        - какие работы выполнить;
        - кто должен выполнить работы;
        - какие показатели контролировать после внедрения;
        - по каким признакам понять, что гипотеза подтвердилась.

        Основные правила:
        - Опирайся только на переданные данные.
        - Не выдумывай точные факты, которых нет в данных.
        - Если данных недостаточно, формулируй осторожно: "возможная причина", "требуется проверить", "вероятно".
        - Учитывай историю прошлых простоев этого оборудования.
        - Если в истории простоев повторяется одна и та же категория причины, отрази это в гипотезе.
        - Если простой единичный и истории мало, предложи диагностический план.
        - Числовые оценки должны быть реалистичными и умеренными.
        - Не завышай ожидаемую экономию и снижение простоя без оснований.
        - priority_score должен быть числом от 1 до 10:
        1-4 — низкий приоритет,
        5-7 — средний приоритет,
        8-10 — высокий приоритет.

        Верни только JSON-объект.
        Не используй markdown.
        Не оборачивай ответ в ```json или ```.
        Не добавляй пояснений до или после JSON.
        Не добавляй дополнительных полей.

        Строго используй поля:
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

        Требования к полям:

        title:
        - короткое и конкретное название гипотезы;
        - должно отражать суть предлагаемого улучшения;
        - не используй слишком общие названия вроде "Оптимизация оборудования".

        problem_description:
        - опиши проблему на основе выбранного простоя;
        - упомяни оборудование, длительность простоя, категорию причины и ущерб, если они переданы;
        - если есть похожие прошлые простои, укажи, что проблема может быть повторяющейся.

        root_cause:
        - укажи наиболее вероятную корневую причину;
        - если точной причины недостаточно, сформулируй вероятную причину;
        - не пиши просто "неисправность оборудования";
        - причина должна быть связана с переданными признаками: категорией, описанием, историей простоев, длительностью, ущербом.

        suggested_action:
        - это самое важное поле;
        - верни подробный нумерованный план действий внутри одной строки;
        - план должен содержать 4-6 шагов;
        - каждый шаг начинай с номера: "1.", "2.", "3." и так далее;
        - в плане обязательно укажи:
        1) какие узлы, системы или параметры проверить;
        2) кто должен выполнить работы: инженер ТОиР, механик, оператор, энергетик или ответственный специалист;
        3) какие работы выполнить;
        4) какие показатели контролировать после внедрения;
        5) по каким признакам считать гипотезу подтверждённой;
        - не ограничивайся словами "проверить", "провести диагностику", "оптимизировать";
        - объясняй, почему эти действия связаны с текущим простоем и историей простоев;
        - если данных недостаточно, составь диагностический план, а не уверенное утверждение.

        expected_downtime_reduction_hours:
        - оцени возможное снижение простоя в часах;
        - значение должно быть реалистичным относительно длительности текущего и прошлых простоев;
        - если оценить невозможно, верни null.

        expected_cost_savings_rub:
        - оцени возможную экономию в рублях;
        - учитывай переданный финансовый ущерб и историю простоев;
        - если оценить невозможно, верни null.

        implementation_cost_rub:
        - оцени примерную стоимость внедрения;
        - если действие требует только проверки или изменения регламента, стоимость может быть небольшой;
        - если требуется замена узлов, датчиков или обслуживание, стоимость должна быть выше;
        - если оценить невозможно, верни null.

        implementation_time_days:
        - оцени срок внедрения в днях;
        - учитывай сложность работ;
        - если оценить невозможно, верни null.

        priority_score:
        - оцени приоритет от 1 до 10;
        - высокий приоритет ставь при повторяющихся простоях, большом ущербе, длительном простое или риске повторения;
        - средний приоритет ставь при ограниченном ущербе или недостатке данных;
        - низкий приоритет ставь только если простой короткий, единичный и без серьёзного ущерба.

        risks:
        - массив из 2-4 рисков;
        - риски должны быть связаны с внедрением предложенного действия;
        - не пиши слишком общие риски вроде "возможны сложности";
        - примеры хороших рисков: "неверная диагностика причины", "остановка оборудования на время проверки", "дополнительные затраты на замену узлов".

        data_sources:
        - массив источников данных, на которые ты опирался;
        - укажи конкретные источники из переданного контекста;
        - например: "данные выбранного простоя", "история простоев оборудования", "категория причины", "описание причины", "суммарный ущерб по оборудованию", "частые категории простоев".

        similar_cases:
        - массив из 1-3 похожих кейсов или сценариев;
        - каждый элемент должен быть полноценным описанием ситуации;
        - запрещено указывать только downtime_id;
        - downtime_id можно упоминать только как дополнительную ссылку в конце описания;
        - каждый похожий кейс должен содержать:
        1) причину или категорию простоя;
        2) чем он похож на текущий случай;
        3) длительность, ущерб или признак повторяемости, если эти данные есть;
        - плохой пример: "downtime_id: 8";
        - хороший пример: "Повторный простой пресса из-за падения давления в гидросистеме: похож на текущий случай по категории причины и признакам перегрева масла, что указывает на возможную системную проблему обслуживания гидравлики."

        Данные выбранного простоя:
        - downtime_id: {downtime_id}
        - start_time: {start_time}
        - end_time: {end_time}
        - duration_minutes: {duration_minutes}
        - reason_category: {reason_category}
        - reason_details: {reason_details}
        - production_loss_units: {production_loss_units}
        - cost_impact_rub: {cost_impact_rub}
        - reported_by: {reported_by}

        Данные оборудования:
        - equipment_name: {equipment_name}
        - equipment_code: {equipment_code}
        - equipment_type: {equipment_type_name}
        - equipment_location: {equipment_location}
        - enterprise_name: {enterprise_name}
        - enterprise_industry: {enterprise_industry}

        Историческая статистика по этому оборудованию:
        - total_downtime_count: {equipment_total_downtime_count}
        - total_downtime_minutes: {equipment_total_downtime_minutes}
        - average_downtime_minutes: {equipment_average_downtime_minutes}
        - total_cost_impact_rub: {equipment_total_cost_impact_rub}

        Самые частые категории причин простоев:
        {top_reason_categories}

        Последние простои этого же оборудования:
        {recent_downtimes}

        Важно для suggested_action:
        - поле suggested_action не должно быть коротким абзацем;
        - поле suggested_action должно быть похоже на практический план работ;
        - минимальный объём suggested_action — 4 подробных шага;
        - плохой пример: "Провести диагностику гидравлической системы и заменить фильтры";
        - хороший пример: "1. Инженеру ТОиР проверить уровень и состояние гидравлического масла... 2. Механику проверить фильтры, насос и клапаны... 3. После обслуживания выполнить тестовый запуск..."
        """.strip()

    RETRY_PROMPT_PREFIX = """
        Предыдущий ответ был недостаточно качественным или не соответствовал схеме.

        Сгенерируй ответ заново.

        Особенно важно:
        - вернуть только валидный JSON;
        - не использовать markdown;
        - не добавлять пояснения вне JSON;
        - не добавлять дополнительных полей;
        - сделать гипотезу конкретной и связанной с переданным простоем;
        - не использовать общие фразы без объяснения;
        - suggested_action должен быть подробным нумерованным планом из 4-6 шагов;
        - каждый шаг suggested_action должен начинаться с номера: "1.", "2.", "3.";
        - в suggested_action должны быть указаны объекты проверки, ответственные специалисты, последовательность работ, контрольные показатели и критерий подтверждения гипотезы;
        - similar_cases должны быть описательными, а не состоять только из ID простоев;
        - risks должны быть конкретными рисками внедрения;
        - data_sources должны ссылаться на переданные данные;
        - priority_score должен быть числом от 1 до 10;
        - числовые оценки не должны быть отрицательными;
        - если данных недостаточно, сформулируй осторожную диагностическую гипотезу.

        Исходная задача:
        """.strip()

    def __init__(self, provider: BaseAIProvider):
        self.provider = provider

    def format_recent_downtimes(
        self,
        recent_downtimes: list[RelatedDowntimeContext],
    ) -> str:
        if not recent_downtimes:
            return "- нет данных о предыдущих простоях"

        lines = []

        for item in recent_downtimes:
            lines.append(
                (
                    f"- downtime_id: {item.id}; "
                    f"start_time: {item.start_time}; "
                    f"duration_minutes: {item.duration_minutes}; "
                    f"reason_category: {item.reason_category or 'не указана'}; "
                    f"reason_details: {item.reason_details or 'не указано'}; "
                    f"production_loss_units: "
                    f"{item.production_loss_units if item.production_loss_units is not None else 'не указаны'}; "
                    f"cost_impact_rub: "
                    f"{item.cost_impact_rub if item.cost_impact_rub is not None else 'не указан'}"
                )
            )

        return "\n".join(lines)

    def format_top_reason_categories(self, categories: list[str]) -> str:
        if not categories:
            return "- нет данных по категориям причин"

        return "\n".join(f"- {category}" for category in categories)

    def build_prompt(
        self,
        downtime: Downtime,
        context: HypothesisGenerationContext,
    ) -> str:
        return self.HYPOTHESIS_GENERATION_PROMPT_TEMPLATE.format(
            downtime_id=downtime.id,
            start_time=downtime.start_time,
            end_time=downtime.end_time,
            duration_minutes=downtime.duration_minutes,
            reason_category=downtime.reason_category or "не указана",
            reason_details=downtime.reason_details or "не указано",
            production_loss_units=(
                downtime.production_loss_units
                if downtime.production_loss_units is not None
                else "не указаны"
            ),
            cost_impact_rub=(
                downtime.cost_impact_rub
                if downtime.cost_impact_rub is not None
                else "не указан"
            ),
            reported_by=downtime.reported_by or "не указан",
            equipment_name=context.equipment_name,
            equipment_code=context.equipment_code,
            equipment_type_name=context.equipment_type_name or "не указан",
            equipment_location=context.equipment_location or "не указана",
            enterprise_name=context.enterprise_name or "не указано",
            enterprise_industry=context.enterprise_industry or "не указана",
            equipment_total_downtime_count=context.equipment_total_downtime_count,
            equipment_total_downtime_minutes=context.equipment_total_downtime_minutes,
            equipment_average_downtime_minutes=(
                round(context.equipment_average_downtime_minutes, 2)
                if context.equipment_average_downtime_minutes is not None
                else "нет данных"
            ),
            equipment_total_cost_impact_rub=round(
                context.equipment_total_cost_impact_rub,
                2,
            ),
            top_reason_categories=self.format_top_reason_categories(
                context.top_reason_categories
            ),
            recent_downtimes=self.format_recent_downtimes(
                context.recent_downtimes
            ),
        )

    def build_retry_prompt(self, original_prompt: str) -> str:
        return f"{self.RETRY_PROMPT_PREFIX}\n\n{original_prompt}"

    def validate_ai_response_quality(self, result: HypothesisAIResponse) -> None:
        if not result.title or len(result.title.strip()) < 8:
            raise RuntimeError("AI returned weak title")

        if (
            not result.problem_description
            or len(result.problem_description.strip()) < 30
        ):
            raise RuntimeError("AI returned weak problem_description")

        if not result.suggested_action or len(result.suggested_action.strip()) < 120:
            raise RuntimeError("AI returned weak suggested_action")

        if result.priority_score is not None:
            if result.priority_score < 1 or result.priority_score > 10:
                raise RuntimeError("AI returned invalid priority_score")

        if result.expected_downtime_reduction_hours is not None:
            if result.expected_downtime_reduction_hours < 0:
                raise RuntimeError(
                    "AI returned negative expected_downtime_reduction_hours"
                )

        if result.expected_cost_savings_rub is not None:
            if result.expected_cost_savings_rub < 0:
                raise RuntimeError("AI returned negative expected_cost_savings_rub")

        if result.implementation_cost_rub is not None:
            if result.implementation_cost_rub < 0:
                raise RuntimeError("AI returned negative implementation_cost_rub")

        if result.implementation_time_days is not None:
            if result.implementation_time_days < 0:
                raise RuntimeError("AI returned negative implementation_time_days")

        if not result.risks:
            raise RuntimeError("AI returned empty risks")

        if not result.data_sources:
            raise RuntimeError("AI returned empty data_sources")

        if not result.similar_cases:
            raise RuntimeError("AI returned empty similar_cases")

    def build_hypothesis_from_ai_response(
        self,
        downtime: Downtime,
        result: HypothesisAIResponse,
    ) -> Hypothesis:
        return Hypothesis(
            downtime_id=downtime.id,
            title=result.title.strip(),
            problem_description=result.problem_description.strip(),
            root_cause=result.root_cause.strip() if result.root_cause else None,
            suggested_action=result.suggested_action.strip(),
            expected_downtime_reduction_hours=(
                result.expected_downtime_reduction_hours
            ),
            expected_cost_savings_rub=result.expected_cost_savings_rub,
            implementation_cost_rub=result.implementation_cost_rub,
            implementation_time_days=result.implementation_time_days,
            priority_score=result.priority_score,
            risks=result.risks,
            data_sources=result.data_sources,
            similar_cases=result.similar_cases,
        )

    async def generate_once(self, prompt: str) -> HypothesisAIResponse:
        raw_result = await self.provider.generate_hypothesis(prompt)

        try:
            result = HypothesisAIResponse.model_validate(raw_result)
        except ValidationError as error:
            raise RuntimeError("AI response does not match hypothesis schema") from error

        self.validate_ai_response_quality(result)

        return result

    async def generate(
        self,
        downtime: Downtime,
        context: HypothesisGenerationContext,
    ) -> Hypothesis:
        prompt = self.build_prompt(downtime, context)

        try:
            result = await self.generate_once(prompt)
        except RuntimeError:
            retry_prompt = self.build_retry_prompt(prompt)
            result = await self.generate_once(retry_prompt)

        return self.build_hypothesis_from_ai_response(
            downtime=downtime,
            result=result,
        )