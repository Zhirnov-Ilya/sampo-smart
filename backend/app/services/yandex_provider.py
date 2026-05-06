import json
import logging

import httpx

from app.config import settings
from app.services.ai_provider import BaseAIProvider


logger = logging.getLogger(__name__)

def clean_json_text(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    return text


def normalize_ai_result(result: dict) -> dict:
    list_fields = ["risks", "data_sources", "similar_cases"]

    for field in list_fields:
        value = result.get(field)
        if isinstance(value, str):
            result[field] = [value]

    return result

class YandexAIProvider(BaseAIProvider):
    async def generate_hypothesis(self, prompt: str) -> dict:
        url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

        headers = {
            "Authorization": f"Api-Key {settings.YANDEX_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "modelUri": f"gpt://{settings.YANDEX_FOLDER_ID}/{settings.YANDEX_MODEL_NAME}",
            "completionOptions": {
                "stream": False,
                "temperature": settings.YANDEX_TEMPERATURE,
                "maxTokens": str(settings.YANDEX_MAX_TOKENS),
            },
            "messages": [
                {
                    "role": "system",
                    "text": (
                        "Ты AI-ассистент промышленной аналитики. "
                        "Всегда возвращай только валидный JSON без markdown, без пояснений и без лишнего текста."
                    ),
                },
                {
                    "role": "user",
                    "text":  prompt
                },
            ],
        }


        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)

            if response.status_code != 200:
                logger.error("Yandex AI error: %s", response.text)
                raise RuntimeError("Yandex AI request failed")

            data = response.json()

            try:
                text_result = data["result"]["alternatives"][0]["message"]["text"]

            except (KeyError, IndexError) as e:
                logger.exception("Unexpected Yandex AI response format")
                raise RuntimeError("Invalid Yandex AI response format") from e


            try:
                cleaned_text = clean_json_text(text_result)
                result =  json.loads(cleaned_text)
                result = normalize_ai_result(result)
                return result

            except json.JSONDecodeError as e:
                logger.exception("Model returned invalid JSON: %s", text_result)
                raise RuntimeError("Model did not return valid JSON") from e
        
