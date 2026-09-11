import contextvars
import logging
from pathlib import Path

from loguru import logger


conversation_id_context = contextvars.ContextVar(
    "conversation_id",
    default=None,
)

session_sinks = {}


class InterceptHandler(logging.Handler):

    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        logger.bind(
            conversation_id=conversation_id_context.get()
        ).opt(
            exception=record.exc_info
        ).log(
            level,
            record.getMessage(),
        )


def setup_logging():

    logging.basicConfig(
        handlers=[InterceptHandler()],
        level=logging.INFO,
        force=True,
    )

#    for name in (
#        "websockets",
#        "websockets.client",
#        "websockets.server",
#        "aiortc",
#        "aioice",
#    ):
#        logging.getLogger(name).setLevel(logging.WARNING)

    for name in (
        "websockets",
        "websockets.client",
        "websockets.server",
    ):
        logging.getLogger(name).setLevel(logging.WARNING)

    for name in ("aiortc", "aioice"):
        logging.getLogger(name).setLevel(logging.DEBUG)

def start_session_logging(conversation_id: str):

    log_dir = Path("logs/sessions")
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / f"{conversation_id}.log"

    token = conversation_id_context.set(conversation_id)

    sink_id = logger.add(
        log_file,
        level="DEBUG",
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS} | "
            "{level} | "
            "{name}:{function}:{line} | "
            "{message}"
        ),
        filter=lambda record: (
            conversation_id_context.get() == conversation_id
            or record["extra"].get("conversation_id") == conversation_id
        ),
    )

    session_sinks[conversation_id] = sink_id

    return token


def get_session_logger():

    conversation_id = conversation_id_context.get()

    if conversation_id is None:
        return logger

    return logger.bind(
        conversation_id=conversation_id
    )


def stop_session_logging(
    conversation_id: str,
    token,
):

    sink_id = session_sinks.pop(
        conversation_id,
        None,
    )

    if sink_id is not None:
        logger.remove(sink_id)

    conversation_id_context.reset(token)
