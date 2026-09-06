from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class VoiceSession:
    conversation_id: str
    connection: Any
    worker: Any = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    timeout_task: Any = None
    status: str = "starting"