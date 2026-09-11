/**
 * AI Voice Bot — themed to match portfolio
 * https://rahulgupta012.github.io/new_portfolio_prototype/
 *
 * Changes from v1:
 *  - Logo/Vox brand removed from header
 *  - Noise texture overlay added (exact portfolio SVG)
 *  - Cursor glow follows mouse (portfolio feature)
 *  - Orbit ring BG decorations
 *  - All class names updated to match new CSS
 *  - PipecatClient wiring unchanged
 */

import { PipecatClient }       from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import "./style.css";

// const SERVER_URL = "http://localhost:7860";
const SERVER_URL = "" ;

// =========================================================
// 1. RENDER HTML
// =========================================================

document.getElementById("root").innerHTML = `

<!-- Noise texture (exact portfolio technique) -->
<div class="noise"></div>

<!-- Cursor glow (acid-green, portfolio feature) -->
<div class="cursor-glow" id="cursor-glow"></div>

<!-- Decorative orbit ring backgrounds -->
<div class="bg-orbit bg-orbit-1"></div>
<div class="bg-orbit bg-orbit-2"></div>
<div class="bg-orbit bg-orbit-3"></div>

<!-- Soft background blobs -->
<div class="bg-blob-1"></div>
<div class="bg-blob-2"></div>

<div class="voice-app">

    <!-- ── Header (no logo) ── -->
    <header class="app-header">
        <div class="header-actions">
            <!-- Language toggle -->
            <div class="voice-pill" id="voice-pill" title="Switch language">
                <button class="voice-pill-btn active" id="englishVoice" data-lang="en" aria-pressed="true">EN</button>
                <button class="voice-pill-btn"         id="hindiVoice"   data-lang="hi" aria-pressed="false">HI</button>
            </div>

            <!-- Developer dashboard toggle -->
            <button class="dev-toggle-btn" id="dev-toggle" aria-expanded="false">Dev</button>
        </div>
    </header>

    <!-- ── Main Orb Scene ── -->
    <main class="main-scene">

        <!-- Orb -->
        <div class="orb-container orb--idle" data-state="idle" id="orb-container">
            <div class="orb-ring"></div>
            <div class="orb-ring"></div>
            <div class="orb-ring"></div>
            <div class="orb-glow" id="orb-glow"></div>
            <canvas id="orb-canvas"></canvas>
            <div class="orb-core" id="orb-core"></div>
        </div>

        <!-- State label + connection -->
        <div class="state-block">
            <div class="state-label" id="state-label">
                Ready<span class="state-asterisk">✦</span>
            </div>
            <div class="connection-indicator">
                <div class="conn-dot" id="conn-dot"></div>
                <span id="conn-label">Disconnected</span>
            </div>
        </div>

        <!-- Controls -->
        <div class="controls">
            <!-- Mic -->
            <div class="ctrl-group">
                <button class="ctrl-btn ctrl-btn--md ctrl-btn--mic" id="mic-btn" disabled title="Toggle microphone" aria-label="Toggle microphone">
                    <span>🎤</span>
                </button>
                <span class="ctrl-label" id="mic-label">Mic</span>
            </div>

            <!-- Connect / End (swaps visibility) -->
            <div class="ctrl-group">
                <button class="ctrl-btn ctrl-btn--lg ctrl-btn--connect" id="connect-btn" title="Start voice session" aria-label="Start">▶</button>
                <button class="ctrl-btn ctrl-btn--lg ctrl-btn--end hidden" id="end-btn" title="End voice session" aria-label="End">✕</button>
                <span class="ctrl-label" id="call-label">Start</span>
            </div>

            <!-- Speaker (display only) -->
            <div class="ctrl-group">
                <button class="ctrl-btn ctrl-btn--md ctrl-btn--mic" disabled style="opacity:0.25;pointer-events:none;" aria-hidden="true">
                    <span>🔊</span>
                </button>
                <span class="ctrl-label">Audio</span>
            </div>
        </div>

    </main>

    <!-- ── Developer / Advanced Dashboard ── -->
    <section class="dev-dashboard" id="dev-dashboard" aria-label="Developer Dashboard">

        <!-- Metrics -->
        <div>
            <div class="dev-section-title">Session Metrics</div>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-card-label">Session</div>
                    <div class="metric-card-value" id="m-session">00:00</div>
                    <div class="metric-card-unit">duration</div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">STT Latency</div>
                    <div class="metric-card-value" id="m-stt">—</div>
                    <div class="metric-card-unit">ms</div>
                    <div class="metric-card-bar"><div class="metric-card-bar-fill" id="m-stt-bar"></div></div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">LLM Latency</div>
                    <div class="metric-card-value" id="m-llm">—</div>
                    <div class="metric-card-unit">ms</div>
                    <div class="metric-card-bar"><div class="metric-card-bar-fill" id="m-llm-bar"></div></div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">TTS Latency</div>
                    <div class="metric-card-value" id="m-tts">—</div>
                    <div class="metric-card-unit">ms</div>
                    <div class="metric-card-bar"><div class="metric-card-bar-fill" id="m-tts-bar"></div></div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">E2E Latency</div>
                    <div class="metric-card-value" id="m-e2e">—</div>
                    <div class="metric-card-unit">ms</div>
                    <div class="metric-card-bar"><div class="metric-card-bar-fill" id="m-e2e-bar"></div></div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">Tokens Used</div>
                    <div class="metric-card-value" id="m-tokens">—</div>
                    <div class="metric-card-unit">in + out</div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">Transport</div>
                    <div class="metric-card-value" id="m-transport" style="font-size:13px;padding-top:5px;">WebRTC</div>
                    <div class="metric-card-unit">SmallWebRTC</div>
                </div>
                <div class="metric-card">
                    <div class="metric-card-label">Pipeline State</div>
                    <div class="metric-card-value" id="m-state" style="font-size:13px;padding-top:5px;">idle</div>
                    <div class="metric-card-unit">current</div>
                </div>
            </div>
        </div>

        <!-- Pipeline visualization -->
        <div>
            <div class="dev-section-title">Pipeline</div>
            <div class="pipeline-viz" id="pipeline-viz">
                <div class="pipeline-node" id="pnode-mic">
                    <div class="pipeline-node-icon"><span>🎤</span></div>
                    <div class="pipeline-node-label">Mic</div>
                </div>
                <div class="pipeline-connector" id="pconn-0"><div class="pipeline-connector-fill"></div></div>
                <div class="pipeline-node" id="pnode-stt">
                    <div class="pipeline-node-icon"><span>📝</span></div>
                    <div class="pipeline-node-label">STT</div>
                </div>
                <div class="pipeline-connector" id="pconn-1"><div class="pipeline-connector-fill"></div></div>
                <div class="pipeline-node" id="pnode-llm">
                    <div class="pipeline-node-icon"><span>🧠</span></div>
                    <div class="pipeline-node-label">LLM</div>
                </div>
                <div class="pipeline-connector" id="pconn-2"><div class="pipeline-connector-fill"></div></div>
                <div class="pipeline-node" id="pnode-tts">
                    <div class="pipeline-node-icon"><span>🔊</span></div>
                    <div class="pipeline-node-label">TTS</div>
                </div>
                <div class="pipeline-connector" id="pconn-3"><div class="pipeline-connector-fill"></div></div>
                <div class="pipeline-node" id="pnode-speaker">
                    <div class="pipeline-node-icon"><span>🎧</span></div>
                    <div class="pipeline-node-label">Speaker</div>
                </div>
            </div>
        </div>

        <!-- Events log -->
        <div>
            <div class="dev-section-title">Events</div>
            <div class="events-log" id="events-log">
                <div class="event-item">
                    <span class="event-time">00:00</span>
                    <span class="event-text ev--info">Dashboard ready. Connect to start.</span>
                </div>
            </div>
        </div>

    </section>
</div>
`;

// =========================================================
// 2. CURSOR GLOW (portfolio feature)
// =========================================================

const cursorGlowEl = document.getElementById("cursor-glow");
document.addEventListener("mousemove", (e) => {
    cursorGlowEl.style.left = `${e.clientX}px`;
    cursorGlowEl.style.top  = `${e.clientY}px`;
});

// =========================================================
// 3. DOM REFS
// =========================================================

const orbContainer = document.getElementById("orb-container");
const orbCanvas    = document.getElementById("orb-canvas");
const stateLabel   = document.getElementById("state-label");
const connDot      = document.getElementById("conn-dot");
const connLabel    = document.getElementById("conn-label");

const connectBtn   = document.getElementById("connect-btn");
const endBtn       = document.getElementById("end-btn");
const micBtn       = document.getElementById("mic-btn");
const callLabel    = document.getElementById("call-label");
const micLabel     = document.getElementById("mic-label");

const devToggle    = document.getElementById("dev-toggle");
const devDashboard = document.getElementById("dev-dashboard");

// Metrics
const mSession  = document.getElementById("m-session");
const mStt      = document.getElementById("m-stt");
const mLlm      = document.getElementById("m-llm");
const mTts      = document.getElementById("m-tts");
const mE2e      = document.getElementById("m-e2e");
const mTokens   = document.getElementById("m-tokens");
const mStateEl  = document.getElementById("m-state");
const mSttBar   = document.getElementById("m-stt-bar");
const mLlmBar   = document.getElementById("m-llm-bar");
const mTtsBar   = document.getElementById("m-tts-bar");
const mE2eBar   = document.getElementById("m-e2e-bar");
const eventsLog = document.getElementById("events-log");

// Pipeline
const pnodeMic    = document.getElementById("pnode-mic");
const pnodeStt    = document.getElementById("pnode-stt");
const pnodeLlm    = document.getElementById("pnode-llm");
const pnodeTts    = document.getElementById("pnode-tts");
const pnodeSpeaker= document.getElementById("pnode-speaker");
const pconn0      = document.getElementById("pconn-0");
const pconn1      = document.getElementById("pconn-1");
const pconn2      = document.getElementById("pconn-2");
const pconn3      = document.getElementById("pconn-3");

// =========================================================
// 4. STATE MACHINE
// =========================================================

let currentState = "idle";

const STATE_CONFIG = {
    idle:         { label: "Ready",          connText: "Disconnected", connClass: "",               prominent: false },
    connecting:   { label: "Connecting",     connText: "Connecting",   connClass: "dot--connecting", prominent: true  },
    listening:    { label: "Listening",      connText: "Connected",    connClass: "dot--connected",  prominent: true  },
    thinking:     { label: "Thinking",       connText: "Connected",    connClass: "dot--connected",  prominent: true  },
    speaking:     { label: "Speaking",       connText: "Connected",    connClass: "dot--connected",  prominent: true  },
    error:        { label: "Error",          connText: "Error",        connClass: "dot--error",      prominent: true  },
    reconnecting: { label: "Reconnecting",   connText: "Reconnecting", connClass: "dot--connecting", prominent: true  },
};

function setState(state) {
    if (currentState === state) return;
    currentState = state;

    const cfg = STATE_CONFIG[state] || STATE_CONFIG.idle;

    // Orb
    orbContainer.className   = `orb-container orb--${state}`;
    orbContainer.dataset.state = state;

    // Label — preserve the asterisk element
    stateLabel.innerHTML = `${cfg.label}<span class="state-asterisk">✦</span>`;
    stateLabel.classList.toggle("prominent", cfg.prominent);

    // Connection indicator
    connDot.className        = `conn-dot ${cfg.connClass}`;
    connLabel.textContent    = cfg.connText;

    // Dashboard
    mStateEl.textContent     = state;
    updatePipelineForState(state);
    logEvent(cfg.label, stateClassForEvent(state));
}

function stateClassForEvent(state) {
    if (state === "listening")  return "ev--listening";
    if (state === "speaking")   return "ev--speaking";
    if (state === "error")      return "ev--error";
    return "ev--info";
}

// =========================================================
// 5. PIPELINE VISUALIZER
// =========================================================

function clearPipeline() {
    [pnodeMic, pnodeStt, pnodeLlm, pnodeTts, pnodeSpeaker].forEach(n => n.classList.remove("active"));
    [pconn0, pconn1, pconn2, pconn3].forEach(c => c.classList.remove("active"));
}

function updatePipelineForState(state) {
    clearPipeline();
    if (state === "listening") {
        pnodeMic.classList.add("active");
        pconn0.classList.add("active");
        pnodeStt.classList.add("active");
    } else if (state === "thinking") {
        pconn1.classList.add("active");
        pnodeLlm.classList.add("active");
    } else if (state === "speaking") {
        pconn2.classList.add("active");
        pnodeTts.classList.add("active");
        pconn3.classList.add("active");
        pnodeSpeaker.classList.add("active");
    }
}

// =========================================================
// 6. EVENTS LOG
// =========================================================

let sessionStartTime = null;

function sessionTime() {
    if (!sessionStartTime) return "00:00";
    const s = Math.floor((Date.now() - sessionStartTime) / 1000);
    return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

function logEvent(text, cls = "ev--info") {
    const item = document.createElement("div");
    item.className = "event-item";
    item.innerHTML = `<span class="event-time">${sessionTime()}</span><span class="event-text ${cls}">${text}</span>`;
    eventsLog.appendChild(item);
    eventsLog.scrollTop = eventsLog.scrollHeight;
    while (eventsLog.children.length > 80) eventsLog.removeChild(eventsLog.firstChild);
}

// =========================================================
// 7. SESSION TIMER
// =========================================================

let sessionTimerInterval = null;

function startSessionTimer() {
    sessionStartTime = Date.now();
    sessionTimerInterval = setInterval(() => { mSession.textContent = sessionTime(); }, 1000);
}

function stopSessionTimer() {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
    mSession.textContent = "00:00";
    sessionStartTime     = null;
}

// =========================================================
// 8. METRICS
// =========================================================

const LATENCY_MAX = { stt: 600, llm: 3000, tts: 800, e2e: 4000 };

function updateLatencyCard(valueEl, barEl, ms, key) {
    valueEl.textContent   = Math.round(ms);
    const pct             = Math.min(100, (ms / LATENCY_MAX[key]) * 100);
    barEl.style.width     = `${pct}%`;
    // Use ink colour; rely on the clean monochrome palette
    barEl.style.background = pct < 50
        ? "#171614"
        : pct < 80 ? "#ff7654" : "#ff4422";
}

function handleMetrics(data) {
    if (!data) return;
    const metrics = Array.isArray(data) ? data : [data];
    let stt = null, llm = null, tts = null;

    metrics.forEach(m => {
        const type = (m.type || "").toLowerCase();
        const val  = m.value ?? m.processing_time ?? m.ttfb ?? null;
        if (type.includes("stt") && val != null) stt = val * 1000;
        if (type.includes("llm") && val != null) llm = val * 1000;
        if (type.includes("tts") && val != null) tts = val * 1000;
        if (m.prompt_tokens != null || m.completion_tokens != null) {
            const total = (m.prompt_tokens||0) + (m.completion_tokens||0);
            if (total > 0) {
                const cur = parseInt(mTokens.textContent) || 0;
                mTokens.textContent = cur + total;
            }
        }
    });

    if (stt != null) updateLatencyCard(mStt, mSttBar, stt, "stt");
    if (llm != null) updateLatencyCard(mLlm, mLlmBar, llm, "llm");
    if (tts != null) updateLatencyCard(mTts, mTtsBar, tts, "tts");
    if (stt != null && llm != null && tts != null) updateLatencyCard(mE2e, mE2eBar, stt+llm+tts, "e2e");
    logEvent("Metrics updated", "ev--info");
}

// =========================================================
// 9. AUDIO VISUALIZER (WebAudio)
// =========================================================

let audioCtx       = null;
let botAnalyser    = null;
let userAnalyser   = null;
let botAudioEl     = null;
let animFrameId    = null;
let userStream     = null;
let userSrcNode    = null;
const FFT_SIZE     = 256;

function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

function mountBotAudioTrack(track) {
    if (!botAudioEl) {
        botAudioEl = document.createElement("audio");
        botAudioEl.autoplay = true;
        botAudioEl.playsInline = true;
        document.body.appendChild(botAudioEl);
    }
    const stream = new MediaStream([track]);
    botAudioEl.srcObject = stream;
    botAudioEl.play().catch(e => console.error("[VoiceBot] Audio error:", e));

    try {
        const ctx   = ensureAudioCtx();
        const src   = ctx.createMediaStreamSource(stream);
        botAnalyser = ctx.createAnalyser();
        botAnalyser.fftSize = FFT_SIZE;
        botAnalyser.smoothingTimeConstant = 0.80;
        src.connect(botAnalyser);
    } catch(e) { console.warn("[VoiceBot] Bot analyser error:", e); }
}

async function mountUserAnalyser() {
    try {
        const ctx  = ensureAudioCtx();
        userStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        userSrcNode = ctx.createMediaStreamSource(userStream);
        userAnalyser = ctx.createAnalyser();
        userAnalyser.fftSize = FFT_SIZE;
        userAnalyser.smoothingTimeConstant = 0.85;
        userSrcNode.connect(userAnalyser);
    } catch(e) { console.warn("[VoiceBot] User analyser error:", e); }
}

function teardownAudio() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (userSrcNode) { userSrcNode.disconnect(); userSrcNode = null; }
    if (userStream)  { userStream.getTracks().forEach(t => t.stop()); userStream = null; }
    botAnalyser = null; userAnalyser = null;
    if (botAudioEl) botAudioEl.srcObject = null;
}

// Canvas render loop — warm paper palette for the visualizer
function startVisualizer() {
    const canvas = orbCanvas;
    const dpr    = window.devicePixelRatio || 1;
    // Read CSS var for orb size
    const cssSize = getComputedStyle(document.documentElement).getPropertyValue("--orb-size");
    const size    = parseInt(cssSize) || 220;

    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, r = size / 2;

    function draw() {
        animFrameId = requestAnimationFrame(draw);
        ctx.clearRect(0, 0, size, size);

        const state    = currentState;
        const isActive = ["listening", "thinking", "speaking"].includes(state);
        if (!isActive) return;

        const levels = new Uint8Array(FFT_SIZE / 2);

        if (state === "speaking" && botAnalyser) {
            // Circular frequency bars — ink colour, paper palette
            botAnalyser.getByteFrequencyData(levels);
            const bars   = 48;
            const innerR = r * 0.50;
            const outerMax = r * 0.84;
            const angleStep = (Math.PI * 2) / bars;

            for (let i = 0; i < bars; i++) {
                const idx  = Math.floor((i / bars) * levels.length * 0.65);
                const val  = levels[idx] / 255;
                const barH = innerR + val * (outerMax - innerR);
                const angle = i * angleStep - Math.PI / 2;

                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
                ctx.lineTo(cx + Math.cos(angle) * barH,   cy + Math.sin(angle) * barH);
                // Ink with val-driven alpha; accent bar every 6th
                const isAccent = i % 6 === 0;
                if (isAccent && val > 0.2) {
                    ctx.strokeStyle = `rgba(215,244,90,${0.4 + val * 0.6})`;  // acid
                } else {
                    ctx.strokeStyle = `rgba(23,22,20,${0.15 + val * 0.65})`; // ink
                }
                ctx.lineWidth = isAccent ? 3 : 2;
                ctx.lineCap   = "round";
                ctx.stroke();
            }

        } else if (state === "listening" && userAnalyser) {
            // Concentric rings driven by mic amplitude — blue tones
            userAnalyser.getByteFrequencyData(levels);
            const rings = 3;
            for (let ri = 0; ri < rings; ri++) {
                const bs = Math.floor((ri / rings) * levels.length);
                const be = Math.floor(((ri+1) / rings) * levels.length);
                const bandAvg = levels.slice(bs, be).reduce((a,b)=>a+b,0) / (be-bs) / 255;
                const baseR = r * (0.35 + ri * 0.18);
                const bump  = bandAvg * r * 0.10;
                const alpha = 0.12 + bandAvg * 0.50;

                ctx.beginPath();
                ctx.arc(cx, cy, baseR + bump, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(150,182,255,${alpha})`;  // portfolio blue
                ctx.lineWidth   = 1.5 + bandAvg * 2.5;
                ctx.stroke();
            }

        } else if (state === "thinking") {
            // Rotating orbital arc — editorial look
            const t   = Date.now() / 1000;
            const arc = Math.PI * 1.3 + Math.sin(t * 0.6) * 0.4;
            const rot = t * 1.1;

            const grad = ctx.createLinearGradient(
                cx + Math.cos(rot) * r * 0.58, cy + Math.sin(rot) * r * 0.58,
                cx + Math.cos(rot + arc) * r * 0.58, cy + Math.sin(rot + arc) * r * 0.58
            );
            grad.addColorStop(0,   "rgba(23,22,20,0)");
            grad.addColorStop(0.5, "rgba(23,22,20,0.6)");
            grad.addColorStop(1,   "rgba(23,22,20,0.05)");

            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.58, rot, rot + arc);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 2.5;
            ctx.lineCap     = "round";
            ctx.stroke();

            // Orbiting dot — acid
            const dotX = cx + Math.cos(rot + arc) * r * 0.58;
            const dotY = cy + Math.sin(rot + arc) * r * 0.58;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(215,244,90,0.9)";
            ctx.fill();
        }
    }

    draw();
}

// =========================================================
// 10. UI HELPERS
// =========================================================

let micMuted = false;

function setConnectedUI(connected) {
    if (connected) {
        connectBtn.classList.add("hidden");
        endBtn.classList.remove("hidden");
        callLabel.textContent = "End";
        micBtn.disabled       = false;
    } else {
        connectBtn.classList.remove("hidden");
        endBtn.classList.add("hidden");
        callLabel.textContent = "Start";
        micBtn.disabled       = true;
        micMuted              = false;
        micBtn.classList.remove("muted");
        micBtn.querySelector("span").textContent = "🎤";
        micLabel.textContent  = "Mic";
    }
}

function toggleMicUI() {
    micMuted = !micMuted;
    micBtn.classList.toggle("muted", micMuted);
    micBtn.querySelector("span").textContent = micMuted ? "🔇" : "🎤";
    micLabel.textContent = micMuted ? "Muted" : "Mic";
    logEvent(micMuted ? "Microphone muted" : "Microphone unmuted");
}

// =========================================================
// 11. PIPECAT CLIENT (original wiring — unchanged)
// =========================================================

let client = null;
let selectedLanguage = "en";

function createClient() {
//const transport = new SmallWebRTCTransport();

	const transport = new SmallWebRTCTransport({
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
        {
            urls: "turn:34.118.204.173:3478",
            username: "voicebot",
            credential: "StrongTurnPassword123",
        },
    ],
});

    client = new PipecatClient({
        transport,
        enableMic: true,
        enableCam: false,

        callbacks: {
            onConnected: () => {
                setState("listening");
                setConnectedUI(true);
                startSessionTimer();
                logEvent("Connected to voice pipeline", "ev--info");
            },

            onDisconnected: () => {
                setState("idle");
                setConnectedUI(false);
                stopSessionTimer();
                teardownAudio();
                logEvent("Disconnected");
            },

            onTransportStateChanged: (state) => {
                const s = (state || "").toLowerCase();
                if (s === "connecting" || s === "new" || s === "checking") setState("connecting");
                else if (s === "failed" || s === "closed") { setState("error"); setConnectedUI(false); stopSessionTimer(); }
                else if (s === "disconnected") setState("reconnecting");
                logEvent(`Transport: ${state}`, "ev--info");
            },

            onError: (error) => {
                setState("error");
                logEvent(`Error: ${error?.message || error}`, "ev--error");
            },

            onTrackStarted: (track) => {
                mountBotAudioTrack(track);
            },

            onTrackStopped: () => {
                if (botAudioEl) botAudioEl.srcObject = null;
            },

            onBotStartedSpeaking: () => {
                setState("speaking");
            },

            onBotStoppedSpeaking: () => {
                if (["speaking", "thinking"].includes(currentState)) setState("listening");
            },

            onUserStartedSpeaking: () => {
                if (["speaking", "thinking"].includes(currentState)) logEvent("User interrupted", "ev--listening");
                setState("listening");
            },

            onUserStoppedSpeaking: () => {
                if (currentState === "listening") setState("thinking");
            },

            onUserTranscript: (data) => {
                if (data?.final && data?.text) logEvent(`You: "${data.text}"`, "ev--listening");
            },

            onBotTranscript: (data) => {
                if (data?.text) logEvent(`Bot: "${data.text}"`, "ev--speaking");
            },

            onBotTtsText: (data) => {
                console.log("[VoiceBot] TTS:", data);
            },

            onMetrics: (data) => {
                handleMetrics(data);
            },
        },
    });

    return client;
}

// =========================================================
// 12. CONNECT / DISCONNECT / MIC
// =========================================================

// async function connect() {
//     try {
//         setState("connecting");
//         connectBtn.disabled = true;
//         if (!client) createClient();
//         await mountUserAnalyser();
//         await client.connect({ connection_url: `${SERVER_URL}/api/offer` });
//     } catch (err) {
//         setState("error");
//         connectBtn.disabled = false;
//         logEvent(`Connection failed: ${err?.message || err}`, "ev--error");
//     }
// }
async function connect() {
    try {
        setState("connecting");
        connectBtn.disabled = true;

        if (!client) createClient();

        await mountUserAnalyser();

        await client.connect({
            connection_url: `${SERVER_URL}/api/offer`
        });

        // Apply language selected before connection
        client.sendClientMessage(
            "voice_change",
            { language: selectedLanguage }
        );

    } catch (err) {
        setState("error");
        connectBtn.disabled = false;
        logEvent(
            `Connection failed: ${err?.message || err}`,
            "ev--error"
        );
    }
}


async function disconnect() {
    if (!client) return;
    try { await client.disconnect(); }
    catch (err) { logEvent(`Disconnect error: ${err?.message || err}`, "ev--error"); }
}

async function toggleMic() {
    if (!client) return;
    try {
        client.isMicEnabled ? await client.enableMic(false) : await client.enableMic(true);
        toggleMicUI();
    } catch(e) { console.error("[VoiceBot] Mic error:", e); }
}

// =========================================================
// 13. EVENT LISTENERS
// =========================================================

connectBtn.addEventListener("click", connect);
endBtn.addEventListener("click", disconnect);
micBtn.addEventListener("click", toggleMic);

// Language toggle (preserves voice_change message exactly)

// document.getElementById("voice-pill").addEventListener("click", (e) => {
//     const btn = e.target.closest(".voice-pill-btn");
//     if (!btn) return;
//     const lang = btn.dataset.lang;
//     document.querySelectorAll(".voice-pill-btn").forEach(b => {
//         b.classList.toggle("active", b === btn);
//         b.setAttribute("aria-pressed", b === btn ? "true" : "false");
//     });
//     if (client) {
//         client.sendClientMessage("voice_change", { language: lang });
//         logEvent(`Voice → ${lang === "en" ? "English" : "Hindi"}`, "ev--info");
//     }
// });


document.getElementById("voice-pill").addEventListener("click", (e) => {
    const btn = e.target.closest(".voice-pill-btn");
    if (!btn) return;

    const lang = btn.dataset.lang;

    selectedLanguage = lang;

    document.querySelectorAll(".voice-pill-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute(
            "aria-pressed",
            b === btn ? "true" : "false"
        );
    });

    if (client) {
        client.sendClientMessage(
            "voice_change",
            { language: lang }
        );
    }

    logEvent(
        `Voice → ${lang === "en" ? "English" : "Hindi"}`,
        "ev--info"
    );
});

// Dev dashboard toggle
devToggle.addEventListener("click", () => {
    const vis = devDashboard.classList.toggle("visible");
    devToggle.classList.toggle("active", vis);
    devToggle.setAttribute("aria-expanded", vis ? "true" : "false");
});

// =========================================================
// 14. BOOT
// =========================================================

setState("idle");
setConnectedUI(false);
startVisualizer();

window.addEventListener("resize", () => {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    startVisualizer();
});
