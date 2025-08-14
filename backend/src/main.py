from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
import os
import uuid
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .local_functions import call_model  # ✅ No warm_up_models import

load_dotenv()

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DebateRequest(BaseModel):
    models: List[str]
    question: Optional[str] = None

MODEL_MAPPING = {
    "GPT-4": {"use": "llama3", "style": "logical, confident", "tone": "serious"},
    "Mistral": {"use": "mistral", "style": "fast, precise", "tone": "sharp"},
    "PaLM 2": {"use": "phi3:mini", "style": "neutral, factual", "tone": "calm"},
    "Qwen": {"use": "qwen:1.8b", "style": "creative, poetic", "tone": "genius"},
    "X": {"use": "llama3", "style": "mysterious", "tone": "friendly"},
}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "time": datetime.now().isoformat(),
        "message": "AI Debate Backend is running smoothly",
        "models_loaded": list(MODEL_MAPPING.keys()),
        "current_provider": os.getenv("MODEL_PROVIDER", "openai"),
        "current_model": os.getenv("MODEL_NAME", "gpt-4o-mini")
    }

@app.get("/models")
async def get_models():
    try:
        response = supabase.table("ai_models").select("*").execute()
        rows = response.data
        models = []
        for r in rows:
            member_since_str = "Unknown"
            if r["member_since"]:
                try:
                    date_obj = datetime.strptime(r["member_since"], "%Y-%m-%d")
                    member_since_str = date_obj.strftime("%b %Y")
                except:
                    member_since_str = r["member_since"]
            models.append({
                "name": r["name"],
                "displayName": r["display_name"],
                "avatar": r["avatar"],
                "description": r["description"],
                "memberSince": member_since_str,
                "debatesFinished": r["debates_finished"],
                "traits": {
                    "creativity": r["creativity"],
                    "logic": r["logic"],
                    "speed": r["speed"],
                    "ethics": r["ethics"]
                }
            })
        return {"models": models}
    except Exception as e:
        return {"error": str(e)}

@app.get("/messages")
async def get_messages():
    try:
        response = supabase.table("messages") \
            .select("*") \
            .order("timestamp", desc=True) \
            .limit(2) \
            .execute()
        messages_data = list(reversed(response.data or []))
        messages = [
            {
                "id": m["id"],
                "text": m["text"],
                "sender": m["sender"],
                "timestamp": m["timestamp"],
                "model": m.get("model")
            }
            for m in messages_data
        ]
        return {"messages": messages}
    except Exception as e:
        return {"error": str(e)}

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
            reply = call_model(prompt, model_to_use)
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
# - Removed warm_up_models() and lifespan startup to avoid startup errors
# - Now starts instantly for Together AI, OpenAI, DeepInfra
# - call_model() handles all API provider requests
# - /health shows current provider/model from env vars
