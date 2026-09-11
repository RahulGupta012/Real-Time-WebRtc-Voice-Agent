import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from loguru import logger

from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)

from fastapi import BackgroundTasks, FastAPI, HTTPException

from sessions.manager import SessionManager
from pipecat.transports.smallwebrtc.connection import IceServer
from pipecat.transports.smallwebrtc.request_handler import SmallWebRTCRequestHandler

# from free_local_bot import run_bot
from api_bot import run_bot

from sessions.logging import setup_logging

load_dotenv(override=True)

setup_logging()


FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")

#session intilizing for multiple users
session_manager = SessionManager(max_concurrent_sessions=3)

class TURNWebRTCRequestHandler(SmallWebRTCRequestHandler):
    async def handle_web_request(self, request, webrtc_connection_callback):
        answer = await super().handle_web_request(
            request,
            webrtc_connection_callback,
        )

        if answer is not None:
            answer["iceConfig"] = {
                "iceServers": [
                    {
                        "urls": "stun:stun.l.google.com:19302",
                    },
                    {
                        "urls": "turn:34.118.204.173:3478",
                        "username":TURN_USERNAME,
                        "credential": TURN_PASSWORD,
                    },
                ]
            }

        return answer
# WebRTC handler

#small_webrtc_handler = SmallWebRTCRequestHandler()
#small_webrtc_handler = SmallWebRTCRequestHandler(
#    ice_servers=["stun:stun.l.google.com:19302"]
#)



small_webrtc_handler = TURNWebRTCRequestHandler(
    ice_servers=[
        IceServer(
            urls="stun:stun.l.google.com:19302"
        ),
        IceServer(
	    urls=f"turn:{TURN_SERVER_IP}:3478",
            username=TURN_USERNAME,
            credential=TURN_PASSWORD,
        ),
    ]
)
# FastAPI lifecycle

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting WebRTC server")

    yield

    logger.info("Closing WebRTC connections")

    await small_webrtc_handler.close()


app = FastAPI(
    title="Pipecat WebRTC Voice Bot",
    lifespan=lifespan,
)


# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check

@app.get("/health")
async def health():

    return {
        "status": "ok",
        "service": "pipecat-webrtc-voicebot",
    }


# WebRTC Offer
#session_manager = SessionManager(3)


@app.post("/api/offer")
async def offer(
    request: SmallWebRTCRequest,
    background_tasks: BackgroundTasks,
):
    # if session_manager.is_full:
    #     raise HTTPException(
    #         status_code=503,
    #         detail="Maximum concurrent calls reached. Please try again later.",
    #     )
        

    logger.info(
        f"Received WebRTC offer | active_sessions={session_manager.active_count}"
    )

    async def webrtc_connection_callback(connection):
        session = session_manager.create_session(connection)

        if session is None:
            logger.warning("Session limit reached while creating connection")
            return

        session.status = "connected"

        logger.info(
            f"Session started | conversation_id={session.conversation_id}"
        )

        async def run_session():
            try:
                await run_bot(
                    connection,
                    session,
                )
            except Exception:
                logger.exception(
                    f"Session failed | conversation_id={session.conversation_id}"
                )
            finally:
                session_manager.remove_session(
                    session.conversation_id
                )

                logger.info(
                    f"Session ended | conversation_id={session.conversation_id}"
                )

        background_tasks.add_task(run_session)

    answer = await small_webrtc_handler.handle_web_request(
        request=request,
        webrtc_connection_callback=webrtc_connection_callback,
    )

    return answer


# Trickle ICE

@app.patch("/api/offer")
async def ice_candidate(
    request: SmallWebRTCPatchRequest,
):

    await small_webrtc_handler.handle_patch_request(
        request
    )

    return {
        "status": "success",
    }


# Root

@app.get("/")
async def root():

    return {
        "service": "Pipecat WebRTC Voice Bot",
        "status": "running",
        "webrtc_endpoint": "/api/offer",
        "health": "/health",
    }


# Run

# if __name__ == "__main__":

#     uvicorn.run(
#         "server:app",
#         host="0.0.0.0",
#         port=7860,
#         reload=False,
#     )
    
if __name__ == "__main__":
    setup_logging()

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=7860,
        reload=False,
    )
