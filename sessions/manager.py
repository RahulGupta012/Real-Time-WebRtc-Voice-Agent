import uuid

from sessions.models import VoiceSession


class SessionManager:
    def __init__(self, max_concurrent_sessions: int = 3):
        self.max_concurrent_sessions = max_concurrent_sessions
        self._sessions: dict[str, VoiceSession] = {}

    @property
    def active_count(self) -> int:
        return len(self._sessions)

    @property
    def is_full(self) -> bool:
        return self.active_count >= self.max_concurrent_sessions

    def create_session(self, connection) -> VoiceSession | None:
        if self.is_full:
            return None

        conversation_id = str(uuid.uuid4())

        session = VoiceSession(
            conversation_id=conversation_id,
            connection=connection,
        )

        self._sessions[conversation_id] = session

        return session

    def get_session(self, conversation_id: str) -> VoiceSession | None:
        return self._sessions.get(conversation_id)

    def remove_session(self, conversation_id: str) -> VoiceSession | None:
        return self._sessions.pop(conversation_id, None)

    def get_all_sessions(self) -> list[VoiceSession]:
        return list(self._sessions.values())