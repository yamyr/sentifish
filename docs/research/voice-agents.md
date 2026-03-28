# Voice AI Agents

> **Last Updated:** March 2026 | **Research Depth:** Comprehensive | **Sources:** Vapi, LiveKit, Daily.co, Modal, OpenAI, Pipecat

---

## Overview

Voice AI agents are systems that can hold real-time spoken conversations with humans — listening to speech, processing it with AI, and responding with synthesized speech — all with latency low enough to feel natural (typically < 1 second response time).

The space exploded in 2024-2025 with:
- OpenAI launching its **Realtime API** (GPT-4o native audio)
- **LiveKit** becoming the leading open-source WebRTC infrastructure
- **Pipecat** emerging as the de-facto open-source voice agent framework
- **Vapi**, **Bland AI**, and **Retell AI** offering managed voice agent platforms

This document covers the architecture, building blocks, platforms, and optimization strategies for voice agents.

---

## Architecture Overview

### Classic Pipeline Architecture (3-Stage)

```
User Speech
     │
     ▼
┌──────────┐
│   STT    │  Speech-to-Text (Deepgram, AssemblyAI, Whisper)
└──────────┘
     │ transcript
     ▼
┌──────────┐
│   LLM    │  Language Model (GPT-4o, Claude, Llama)
└──────────┘
     │ text response
     ▼
┌──────────┐
│   TTS    │  Text-to-Speech (ElevenLabs, Cartesia, PlayHT, OpenAI TTS)
└──────────┘
     │ audio
     ▼
User Hears Response
```

**Typical latency breakdown:**
- STT: 200-400ms (streaming: first token ~100ms)
- LLM: 500-1500ms (to first token)
- TTS: 100-300ms (to first audio chunk)
- **Total: 800ms - 2200ms** (with streaming optimizations)

### Native Speech-to-Speech (OpenAI Realtime API)

OpenAI's Realtime API eliminates the STT + TTS stages, using a native audio model:

```
User Speech (audio)
     │
     ▼
┌──────────────────┐
│ GPT-4o Audio     │  Processes audio natively
│ (Realtime API)   │  Responds in audio
└──────────────────┘
     │ audio
     ▼
User Hears Response

Latency: ~300-500ms (vs 800-2200ms for pipeline)
```

**Official URL:** https://platform.openai.com/docs/guides/realtime

---

## The Voice Agent Stack

### Transport Layer

| Technology | Use Case | Latency | Cost |
|-----------|----------|---------|------|
| **WebRTC** | Browser-to-server, phone calls | Ultra-low (~50ms) | Infrastructure cost |
| **WebSockets** | Simple deployments, server-to-server | Low (~100ms) | Cheap |
| **gRPC streaming** | High-throughput microservices | Very low | Infrastructure |
| **PSTN/SIP** | Phone calls (Twilio, Vonage) | Variable | Per-minute fees |

### Speech-to-Text (STT) Options

| Provider | Latency | Accuracy | Cost | Notes |
|---------|---------|---------|------|-------|
| **Deepgram Nova-3** | ~100ms streaming | Excellent | ~$0.0043/min | Industry leader for real-time |
| **AssemblyAI** | ~200ms streaming | Excellent | ~$0.0065/min | Strong noise handling |
| **Whisper (self-hosted)** | 200-500ms | Good | Compute cost | Free, runs on GPU |
| **OpenAI Whisper API** | ~400ms | Good | $0.006/min | Not streaming |
| **Google STT** | ~150ms | Excellent | $0.016/min | Great for multiple languages |
| **Azure Cognitive Services** | ~150ms | Excellent | Variable | Enterprise-grade |

### Text-to-Speech (TTS) Options

| Provider | Latency (TTFB) | Voice Quality | Cost | Notes |
|---------|---------------|--------------|------|-------|
| **ElevenLabs** | ~300ms | Best-in-class | $0.30/1k chars | Most natural, many voices |
| **Cartesia** | ~100ms | Excellent | $0.15/1k chars | Fastest high-quality TTS |
| **OpenAI TTS** | ~200ms | Very good | $15/1M chars | Simple, reliable |
| **PlayHT** | ~250ms | Very good | Variable | Good voice cloning |
| **Azure TTS** | ~150ms | Good | $16/1M chars | Enterprise option |
| **Deepgram Aura** | ~80ms | Good | ~$0.015/1k chars | Ultra-fast, lower quality |

---

## Open-Source Framework: Pipecat

**What it is:** Open-source framework for building voice and multimodal conversational AI agents.

**Official URL:** https://github.com/pipecat-ai/pipecat  
**Docs:** https://docs.pipecat.ai

### Core Concepts

Pipecat uses a **pipeline** model where audio/text flows through processing nodes:

```
AudioInputTransport → VAD → STT → LLM → TTS → AudioOutputTransport
      ↑                                              ↓
    WebRTC/WebSocket                           WebRTC/WebSocket
```

**VAD (Voice Activity Detection):** Detects when user starts/stops speaking — critical for interruption handling.

### Quick Start Example

```python
import asyncio
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.deepgram import DeepgramSTTService, DeepgramTTSService
from pipecat.services.openai import OpenAILLMService
from pipecat.transports.services.daily import DailyParams, DailyTransport

async def main():
    # Transport (WebRTC via Daily.co)
    transport = DailyTransport(
        room_url="https://your-domain.daily.co/room",
        token="your-token",
        bot_name="Voice Agent",
        params=DailyParams(audio_in_enabled=True, audio_out_enabled=True)
    )
    
    # STT
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    
    # LLM
    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o")
    
    # TTS
    tts = DeepgramTTSService(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        voice="aura-asteria-en"
    )
    
    # System context
    context = OpenAILLMContext(
        messages=[{
            "role": "system",
            "content": "You are a friendly voice assistant. Keep responses brief (1-2 sentences). You are speaking in real-time."
        }]
    )
    context_aggregator = llm.create_context_aggregator(context)
    
    # Build pipeline
    pipeline = Pipeline([
        transport.input(),
        stt,
        context_aggregator.user(),
        llm,
        tts,
        transport.output(),
        context_aggregator.assistant(),
    ])
    
    task = PipelineTask(pipeline, PipelineParams(allow_interruptions=True))
    
    await PipelineRunner().run(task)

asyncio.run(main())
```

### Handling Interruptions

Interruptions are a key UX challenge in voice agents — user speaks while agent is still talking.

```python
from pipecat.processors.filters.function_filter import FunctionFilter

class InterruptionHandler:
    def __init__(self):
        self.agent_speaking = False
    
    async def on_user_speech_start(self):
        if self.agent_speaking:
            # Cancel current TTS output
            await self.cancel_tts()
            # Acknowledge interruption naturally
            await self.queue_response("Oh, go ahead.")
    
    async def on_tts_start(self):
        self.agent_speaking = True
    
    async def on_tts_end(self):
        self.agent_speaking = False

# Pipecat has built-in support
task = PipelineTask(
    pipeline,
    PipelineParams(
        allow_interruptions=True,         # Enable interruption handling
        enable_metrics=True,              # Track latency metrics
        enable_usage_metrics=True,        # Track token usage
    )
)
```

---

## Managed Platform: Vapi

**What it is:** Full-service voice AI platform — handles telephony, STT, LLM, TTS, and conversation management.

**Official URL:** https://vapi.ai  
**Docs:** https://docs.vapi.ai

### Key Features
- Inbound and outbound phone calling
- OpenAI Realtime API support (native speech-to-speech)
- Custom tools/functions integration
- Call recording and transcription
- Squad orchestration (transfer between AI agents)
- White-label options

### Quick Start: Creating a Voice Assistant

```python
import vapi

client = vapi.Vapi(token=os.getenv("VAPI_API_TOKEN"))

# Create an assistant
assistant = client.assistants.create(
    name="Customer Service Agent",
    model={
        "provider": "openai",
        "model": "gpt-4o",
        "messages": [{
            "role": "system",
            "content": "You are a friendly customer service representative for TechCorp. Help users with product questions and support issues. Keep responses brief and natural-sounding."
        }],
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "lookup_order",
                    "description": "Look up order status by order ID",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": {"type": "string", "description": "The order ID"}
                        },
                        "required": ["order_id"]
                    }
                }
            }
        ]
    },
    voice={
        "provider": "11labs",
        "voiceId": "21m00Tcm4TlvDq8ikWAM",  # ElevenLabs voice ID
        "stability": 0.5,
        "similarity_boost": 0.75
    },
    transcriber={
        "provider": "deepgram",
        "model": "nova-3",
        "language": "en",
    },
    first_message="Hello! Thank you for calling TechCorp. How can I help you today?"
)

# Make an outbound call
call = client.calls.create(
    assistant_id=assistant.id,
    customer={
        "number": "+15555551234",
        "name": "John Doe"
    },
    phone_number_id="your-phone-number-id"
)

print(f"Call started: {call.id}")
```

### Webhook Handling (Tool Calls)

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/vapi-webhook", methods=["POST"])
def handle_vapi_webhook():
    data = request.json
    
    if data.get("type") == "tool-calls":
        tool_calls = data.get("toolCallList", [])
        results = []
        
        for tool_call in tool_calls:
            tool_name = tool_call.get("function", {}).get("name")
            tool_args = tool_call.get("function", {}).get("arguments", {})
            
            if tool_name == "lookup_order":
                order_id = tool_args.get("order_id")
                order_status = get_order_status(order_id)  # Your DB lookup
                results.append({
                    "toolCallId": tool_call.get("id"),
                    "result": f"Order {order_id}: {order_status}"
                })
        
        return jsonify({"results": results})
    
    return jsonify({"status": "ok"})
```

---

## Managed Platform: Bland AI

**What it is:** Enterprise-focused voice AI for phone calls at scale.

**Official URL:** https://www.bland.ai

### Key Differentiators
- Purpose-built for sales, customer service, healthcare scheduling
- Pathway-based conversation flows (no-code workflow builder)
- Human transfer capabilities
- High call volume (thousands of concurrent calls)
- HIPAA compliance option

### API Example

```python
import requests

# Send an outbound call with Bland AI
response = requests.post(
    "https://api.bland.ai/v1/calls",
    headers={"authorization": os.getenv("BLAND_API_KEY")},
    json={
        "phone_number": "+15555551234",
        "task": """You are scheduling a dental appointment reminder call.
        Remind the patient about their appointment on March 15th at 2pm.
        Ask if they can confirm or need to reschedule.
        Be friendly and brief.""",
        "voice": "alexa",
        "first_sentence": "Hello, may I speak with John?",
        "wait_for_greeting": True,
        "max_duration": 5,  # Max 5 minutes
        "answered_by_enabled": True,  # Detect voicemail
    }
)

call_id = response.json()["call_id"]
```

---

## Platform: LiveKit Agents

**What it is:** Open-source framework for building real-time voice agents on top of LiveKit's WebRTC infrastructure.

**Official URL:** https://docs.livekit.io/agents/  
**GitHub:** https://github.com/livekit/agents

### When to Use LiveKit vs Vapi/Bland

| Scenario | Use LiveKit | Use Vapi/Bland |
|---------|-------------|----------------|
| Custom ML pipeline | ✅ | ❌ |
| Fully self-hosted | ✅ | ❌ |
| Web browser integration | ✅ | ✅ |
| Phone calls (PSTN) | ⚠️ (via SIP) | ✅ (built-in) |
| No-code setup | ❌ | ✅ |
| Custom WebRTC client | ✅ | ❌ |
| Highest control | ✅ | ❌ |

### LiveKit Agent Example

```python
import asyncio
import logging
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import openai, deepgram, silero

logging.basicConfig(level=logging.INFO)

class MyVoiceAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are a helpful voice assistant. Be concise."
        )
    
    async def on_enter(self):
        await self.say("Hello! How can I help you today?")
    
    async def on_user_turn_completed(self, turn_ctx, new_message):
        # Access the conversation history
        await super().on_user_turn_completed(turn_ctx, new_message)

async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    
    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(voice="alloy"),
        vad=silero.VAD.load(),
        turn_detection=openai.realtime.RealtimeTurnDetection.SERVER_VAD,
    )
    
    await session.start(
        room=ctx.room,
        agent=MyVoiceAgent(),
        room_input_options=RoomInputOptions(video_enabled=False)
    )
    
    await ctx.wait_for_disconnect()

if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(entrypoint_fnc=entrypoint)
    )
```

---

## OpenAI Realtime API

**What it is:** Native speech-to-speech API using GPT-4o's multimodal audio capabilities.

**Official URL:** https://platform.openai.com/docs/guides/realtime  
**Status:** Generally available (late 2024 launch)

### Key Features
- Native audio input → audio output (no STT/TTS latency)
- ~300ms response latency vs 1-2 seconds for pipeline
- Built-in VAD (voice activity detection)
- Function calling support
- Conversation history management

### WebSocket-Based Implementation

```python
import asyncio
import json
import base64
import websockets
import sounddevice as sd
import numpy as np

SAMPLE_RATE = 24000
CHANNELS = 1

async def realtime_voice_agent():
    url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"
    
    async with websockets.connect(
        url,
        extra_headers={
            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
            "OpenAI-Beta": "realtime=v1"
        }
    ) as ws:
        # Configure session
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "model": "gpt-4o-realtime-preview-2024-12-17",
                "modalities": ["text", "audio"],
                "instructions": "You are a helpful voice assistant. Keep responses brief.",
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {"model": "whisper-1"},
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 200,
                },
                "tools": [
                    {
                        "type": "function",
                        "name": "get_weather",
                        "description": "Get current weather for a location",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "location": {"type": "string"}
                            }
                        }
                    }
                ]
            }
        }))
        
        # Start recording and streaming audio
        async def stream_audio():
            with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, dtype='int16') as stream:
                while True:
                    audio_chunk, _ = stream.read(4096)
                    audio_bytes = audio_chunk.tobytes()
                    audio_b64 = base64.b64encode(audio_bytes).decode()
                    
                    await ws.send(json.dumps({
                        "type": "input_audio_buffer.append",
                        "audio": audio_b64
                    }))
                    await asyncio.sleep(0)
        
        # Handle incoming events
        async def handle_events():
            audio_buffer = b""
            async for message in ws:
                event = json.loads(message)
                
                if event["type"] == "response.audio.delta":
                    audio_data = base64.b64decode(event["delta"])
                    audio_buffer += audio_data
                
                elif event["type"] == "response.audio.done":
                    # Play the audio
                    audio_array = np.frombuffer(audio_buffer, dtype=np.int16)
                    sd.play(audio_array, samplerate=SAMPLE_RATE)
                    audio_buffer = b""
                
                elif event["type"] == "response.function_call_arguments.done":
                    # Handle tool call
                    tool_name = event.get("name")
                    tool_args = json.loads(event.get("arguments", "{}"))
                    
                    if tool_name == "get_weather":
                        result = get_weather(tool_args["location"])
                        await ws.send(json.dumps({
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": event["call_id"],
                                "output": str(result)
                            }
                        }))
                        await ws.send(json.dumps({"type": "response.create"}))
        
        await asyncio.gather(stream_audio(), handle_events())

asyncio.run(realtime_voice_agent())
```

---

## Latency Optimization Techniques

### 1. Response Start Time (TTFB)

The most impactful metric is "Time to First Byte" of audio response.

```python
# Technique: Start TTS immediately from first LLM token (streaming)
# Instead of waiting for full LLM response, pipe tokens directly to TTS

async def streaming_voice_response(user_input: str, tts_client, audio_sink):
    """Stream LLM tokens directly to TTS for lower latency"""
    
    sentence_buffer = ""
    
    async for token in llm.astream(user_input):
        sentence_buffer += token
        
        # Trigger TTS when we have a complete sentence
        if sentence_buffer.endswith((".", "!", "?", ":", ";")):
            # Start speaking this sentence immediately
            asyncio.create_task(
                tts_client.synthesize_and_play(sentence_buffer, audio_sink)
            )
            sentence_buffer = ""
    
    # Handle remaining buffer
    if sentence_buffer.strip():
        await tts_client.synthesize_and_play(sentence_buffer, audio_sink)
```

### 2. Connection Pooling

```python
import aiohttp

class VoiceAgentPool:
    def __init__(self):
        # Keep persistent connections to STT/TTS services
        self.stt_session = aiohttp.ClientSession()
        self.tts_session = aiohttp.ClientSession()
        self.llm_client = openai.AsyncOpenAI()  # Reuses connection pool
    
    # Avoid creating new connections per request
    # gRPC with bidirectional streaming is ideal for voice pipelines
```

### 3. Parallel Processing

```python
import asyncio

async def process_with_overlap(audio_chunk: bytes):
    """Run STT and LLM planning in parallel when possible"""
    
    # Start STT immediately
    stt_task = asyncio.create_task(stt.transcribe(audio_chunk))
    
    # Meanwhile, pre-warm TTS connection
    tts_warmup_task = asyncio.create_task(tts.ping())
    
    # Wait for transcription
    transcript = await stt_task
    await tts_warmup_task  # Ensure TTS is ready
    
    # Stream LLM response directly to TTS
    await streaming_voice_response(transcript, tts, audio_output)
```

### 4. Edge Deployment

```python
# Deploy voice agents close to users for lower network latency
# Using Modal for serverless edge deployment

import modal
from pipecat.pipeline.pipeline import Pipeline

app = modal.App("voice-agent")

@app.function(
    gpu="T4",
    image=modal.Image.debian_slim().pip_install("pipecat-ai[full]"),
    allow_concurrent_inputs=100,
)
async def voice_agent_handler(audio_input: bytes) -> bytes:
    # Process locally on GPU (Whisper for STT, local TTS)
    transcript = await local_whisper.transcribe(audio_input)
    response_text = await llm.complete(transcript)
    audio_output = await local_tts.synthesize(response_text)
    return audio_output
```

### Latency Benchmarks by Architecture

| Architecture | TTFR (Time to First Response) | Notes |
|-------------|-------------------------------|-------|
| OpenAI Realtime API | 200-400ms | Native audio, best latency |
| Deepgram STT + GPT-4o + Cartesia TTS | 600-900ms | Good pipeline |
| Deepgram STT + GPT-4o + ElevenLabs | 800-1200ms | Natural voice, slower |
| Whisper (local) + Llama 3 + Local TTS | 500-800ms | Self-hosted, GPU required |
| Full cloud pipeline (cold start) | 2000-4000ms | Unacceptable for UX |

*TTFR = Time from end of user speech to start of agent audio*

---

## Comparison: Voice Agent Platforms

| Platform | Open Source | Phone Support | Pricing | Best For |
|---------|------------|--------------|---------|----------|
| **Vapi** | ❌ | ✅ (built-in) | $0.05/min + usage | Production phone agents |
| **Bland AI** | ❌ | ✅ (built-in) | $0.09/min | Enterprise outbound calling |
| **Retell AI** | ❌ | ✅ (built-in) | $0.07/min | Custom voice agents |
| **LiveKit Agents** | ✅ | ⚠️ (via SIP) | Infrastructure only | Custom web/app agents |
| **Pipecat** | ✅ | ⚠️ (via Daily) | Free (pay infra) | Developer customization |
| **Daily.co** | ❌ | ✅ (via SIP) | $0.004/min | WebRTC infrastructure |

---

## Pros and Cons

### OpenAI Realtime API
✅ Lowest latency (native audio)  
✅ Simplified architecture (no STT/TTS)  
✅ Built-in VAD and interruption handling  
❌ OpenAI lock-in  
❌ More expensive than pipeline  
❌ Less voice variety than dedicated TTS  

### Pipecat (Open Source)
✅ Maximum flexibility and customization  
✅ Self-hostable  
✅ Supports any STT/LLM/TTS provider  
❌ Requires significant infrastructure work  
❌ No built-in phone support  

### Vapi (Managed Platform)
✅ Quick to production (minutes not days)  
✅ Built-in phone system  
✅ Many integrations out-of-box  
❌ Vendor lock-in  
❌ Less control over quality/latency  
❌ Per-minute pricing adds up  

---

## Official Resources

- **OpenAI Realtime API:** https://platform.openai.com/docs/guides/realtime
- **Pipecat:** https://github.com/pipecat-ai/pipecat | Docs: https://docs.pipecat.ai
- **LiveKit Agents:** https://docs.livekit.io/agents/
- **Vapi:** https://vapi.ai | Docs: https://docs.vapi.ai
- **Bland AI:** https://www.bland.ai
- **Retell AI:** https://www.retellai.com
- **Deepgram (STT):** https://deepgram.com
- **ElevenLabs (TTS):** https://elevenlabs.io
- **Cartesia (TTS):** https://cartesia.ai
- **Modal voice agent tutorial:** https://modal.com/blog/low-latency-voice-bot
- **Daily.co voice AI guide:** https://www.daily.co/blog/advice-on-building-voice-ai-in-june-2025/

---

*Research compiled March 2026. Voice AI infrastructure is one of the fastest-moving areas in the AI space. Check platform release notes for current pricing, capabilities, and supported models.*
