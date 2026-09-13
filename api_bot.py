import os

from dotenv import load_dotenv
from loguru import logger
import asyncio

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams

from pipecat.frames.frames import LLMRunFrame

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineParams, PipelineWorker

from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)

from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection

from pipecat.workers.runner import WorkerRunner

from services.STT.deepgram import create_stt
from services.LLM.gemini import create_llm
from services.TTS.cartresia import create_tts

from pipecat.frames.frames import (
    LLMRunFrame,
    TTSUpdateSettingsFrame,
)

from pipecat.processors.frameworks.rtvi import RTVIProcessor
from pipecat.transcriptions.language import Language

from sessions.models import VoiceSession

from contextvars import ContextVar

from sessions.logging import (
    start_session_logging,
    get_session_logger,
    stop_session_logging,
)


load_dotenv(override=True)


english_voice = os.environ["CARTESIA_ENGLISH_VOICE_ID"]
hindi_voice = os.environ["CARTESIA_HINDI_VOICE_ID"]

# conversation_id_context = ContextVar(
#     "conversation_id",
#     default=None,
# )

# _session_log_sinks = {}



async def run_bot(connection: SmallWebRTCConnection, session: VoiceSession):
    
    # session_token = conversation_id_context.set(
    # session.conversation_id
    # )   
    
    session_token = start_session_logging(
        session.conversation_id
    )

    session_logger = get_session_logger()

    session_logger.info("Starting voice bot")


    # -----------------------------------------------------
    # Transport
    # -----------------------------------------------------

    transport = SmallWebRTCTransport(
        webrtc_connection=connection,

        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,

            audio_in_sample_rate=16000,
            audio_out_sample_rate=24000,

            audio_in_channels=1,

            vad_analyzer=SileroVADAnalyzer(
                sample_rate=16000,

                params=VADParams(
                    confidence=0.7,
                    start_secs=0.1,
                    stop_secs=0.5,
                    min_volume=0.0,
                ),
            ),
        ),
    )

    # -----------------------------------------------------
    # AI SERVICES
    # -----------------------------------------------------

    stt = create_stt()

    llm = create_llm()

    tts = create_tts()

    # -----------------------------------------------------
    # Context
    # -----------------------------------------------------

    context = LLMContext()

    user_aggregator, assistant_aggregator = (
        LLMContextAggregatorPair(
            context,

            user_params=LLMUserAggregatorParams(
                vad_analyzer=SileroVADAnalyzer(
                    sample_rate=16000,

                    params=VADParams(
                        confidence=0.7,
                        start_secs=0.1,
                        stop_secs=0.5,
                    ),
                ),
            ),
        )
    )

    # -----------------------------------------------------
    # Pipeline
    # -----------------------------------------------------

    pipeline = Pipeline(
        [
            transport.input(),

            # Audio -> Deepgram
            stt,

            # Transcript -> context
            user_aggregator,

            # Context -> Gemini
            llm,

            # Gemini -> Cartesia
            tts,

            # Audio -> browser
            transport.output(),

            # Save assistant response
            assistant_aggregator,
        ]
    )

    # -----------------------------------------------------
    # Worker
    # -----------------------------------------------------

    worker = PipelineWorker(
        pipeline,

        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,

            allow_interruptions=True,

            enable_rtvi=True,

            audio_in_sample_rate=16000,
            audio_out_sample_rate=24000,
        ),
    )


    @worker.rtvi.event_handler("on_client_message")
    async def on_client_message(rtvi, msg):

        if msg.type != "voice_change":
            return

        language = (msg.data or {}).get("language")

        if language == "hi":
            await worker.queue_frame(
                TTSUpdateSettingsFrame(
                    delta=tts.Settings(
                        voice=hindi_voice,
                        language=Language.HI,
                    )
                )
            )

            logger.info("Switched TTS voice to Hindi")

        elif language == "en":
            await worker.queue_frame(
                TTSUpdateSettingsFrame(
                    delta=tts.Settings(
                        voice=english_voice,
                        language=Language.EN,
                    )
                )
            )

            logger.info("Switched TTS voice to English")
    # -----------------------------------------------------
    # Client connected
    # -----------------------------------------------------

    @transport.event_handler("on_client_connected")
    async def on_client_connected(
        transport,
        client,
    ):

        session_logger.info("Client connected")

        context.add_message(
            {
                "role": "user",
                "content": (
                    "Greet the user briefly and ask "
                    "how you can help."
                ),
            }
        )

        await worker.queue_frames(
            [
                LLMRunFrame(),
            ]
        )

    # -----------------------------------------------------
    # Client disconnected
    # -----------------------------------------------------

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(
        transport,
        client,
    ):

        session_logger.info("Client disconnected")

        await worker.cancel()

    # -----------------------------------------------------
    # Run
    # -----------------------------------------------------

        # -----------------------------------------------------
    # Run
    # -----------------------------------------------------

    # async def auto_end_call():
    #     await asyncio.sleep(120)

    #     logger.warning(
    #         f"Maximum call duration reached | "
    #         f"conversation_id={session.conversation_id}"
    #     )

    #     await worker.cancel()

    # timeout_task = asyncio.create_task(auto_end_call())
    try:
         runner = WorkerRunner()

         await runner.add_workers(worker)

         await runner.run()

    finally:
         timeout_task.cancel()

         stop_session_logging(
              session.conversation_id,
              session_token,
          )
