import os

from pipecat.services.deepgram.stt import DeepgramSTTService


def create_stt():

    language = os.getenv("LANGUAGE", "auto")

    # Deepgram language configuration
    # "multi" gives multilingual support.
    if language == "auto":
        deepgram_language = "multi"
    elif language == "hi":
        deepgram_language = "hi"
    else:
        deepgram_language = "en"

    return DeepgramSTTService(
        api_key=os.environ["DEEPGRAM_API_KEY"],
        settings=DeepgramSTTService.Settings(
            model="nova-3-general",
            language=deepgram_language,
            interim_results=True,
            punctuate=True,
            smart_format=True,
            endpointing=300,
        ),
    )