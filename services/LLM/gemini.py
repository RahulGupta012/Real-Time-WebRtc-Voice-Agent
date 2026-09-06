import os

from pipecat.services.google.llm import GoogleLLMService


SYSTEM_PROMPT = """
You are a helpful real-time voice assistant. 

You are having a natural spoken conversation with the user.

Rules:
- Keep responses concise and conversational.
- Your response will be converted directly into speech.
- Do not use markdown.
- Do not use bullet points.
- Do not use emojis.
- Do not output JSON.
- Do not unnecessarily repeat the user's question.

Language behavior:
- If the user speaks English, respond in English.
- If the user speaks Hindi, respond in Hindi.
- If the user speaks Hinglish, respond naturally in Hinglish.
- Follow the user's language naturally.
"""


def create_llm():

    return GoogleLLMService(
        api_key=os.environ["GOOGLE_API_KEY"],
        settings=GoogleLLMService.Settings(
            model=os.getenv(
                "GEMINI_MODEL",
                "gemini-2.5-flash",
            ),
            temperature=0.5,
            max_tokens=300,
        ),
        system_instruction=SYSTEM_PROMPT,
    )