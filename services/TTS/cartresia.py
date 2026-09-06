import os

from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.transcriptions.language import Language


def create_tts():
    return CartesiaTTSService(
        api_key=os.environ["CARTESIA_API_KEY"],
        settings=CartesiaTTSService.Settings(
            voice=os.environ["CARTESIA_ENGLISH_VOICE_ID"],
            language=Language.EN,
        ),
    )