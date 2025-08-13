from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
import os
import uuid
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from dotenv import load_dotenv
from .local_functions import warm_up_models, call_model  # ✅ Updated import

load_dotenv()

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(warm_up_models())
    print("🚀 FastAPI app started. Warming up models in background...")
    yield

app = FastAPI(lifespan=lifespan)

# ... (keep all your other routes unchanged until /debate)

@app.post("/debate")
async def debate(data: DebateRequest):
    selected_models = data.models
    question = data.question or "Let's debate!"
    responses = []

    # ✅ Save user message FIRST
    if question:
        try:
            supabase.table("messages").insert({
                "id": str(uuid.uuid4()),
                "text": question,
                "sender": "user",
                "timestamp": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print(f"❌ Failed to save user message: {e}")

    # ✅ Fetch context
    try:
        messages_response = supabase.table("messages") \
            .select("sender, text, model") \
            .order("timestamp", desc=True) \
            .limit(6) \
            .execute()
        recent_messages = list(reversed(messages_response.data or []))
        context = "### Recent Debate\n"
        for msg in recent_messages:
            if msg["sender"] == "user":
                context += f'User: {msg["text"]}\n'
            else:
                context += f'{msg["model"]}: {msg["text"]}\n'
    except Exception as e:
        context = "(No recent context)"

    # ✅ Generate AI responses
    for model_name in selected_models:
        ollama_info = MODEL_MAPPING.get(model_name, {
            "use": os.getenv("MODEL_NAME", "gpt-4o-mini"),
            "style": "neutral",
            "tone": "serious"
        })
        model_to_use = ollama_info["use"]
        style = ollama_info["style"]
        tone = ollama_info.get("tone", "serious")

        prompt = f"""
You are {model_name}, in a debate.
Style: {style}, Tone: {tone}
Context: {context}
Question: "{question}"
Respond in 1-2 short sentences.
        """

        try:
            reply = call_model(prompt, model_to_use)  # ✅ Uses multi-provider
        except Exception as e:
            print(f"❌ {model_name} failed: {e}")
            reply = "Error: Could not generate response"

        # ✅ Save bot message
        try:
            message_id = str(uuid.uuid4())
            responses.append({"model": model_name, "response": reply})
            supabase.table("messages").insert({
                "id": message_id,
                "text": reply,
                "sender": "bot",
                "timestamp": datetime.now().isoformat(),
                "model": model_name
            }).execute()
        except Exception as e:
            print(f"❌ Failed to save bot message: {e}")

    return {"responses": responses}

# === CHANGE NOTES ===
# - Replaced Ollama hardcoded calls with call_model() from local_functions.py.
# - Default MODEL_NAME pulled from env if not in MODEL_MAPPING.
# - Now works with OpenAI, Together AI, DeepInfra, or Ollama by switching env vars.
