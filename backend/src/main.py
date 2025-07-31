# backend/src/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
import os
import uuid
import requests
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from local_functions import warm_up_models  # Import from local module
from contextlib import asynccontextmanager
import asyncio
from dotenv import load_dotenv
# Run warm-up in the background
# Load environment variables

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)



# Lifespan context for FastAPI app


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ Now safe to create task
    asyncio.create_task(warm_up_models())
    print("🚀 FastAPI app started. Warming up models in background...")
    yield


# FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)

# FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class DebateRequest(BaseModel):
    models: List[str]
    question: Optional[str] = None

# Model mapping
MODEL_MAPPING = {
    "GPT-4": {"use": "llama3", "style": "logical, confident, detailed"},
    "Claude": {"use": "llama3", "style": "thoughtful, cautious, ethical"},
    "Llama": {"use": "llama3", "style": "direct, open, technical"},
    "Mistral": {"use": "mistral", "style": "fast, precise, concise"},
    "PaLM 2": {"use": "phi3:mini", "style": "neutral, factual"}, # "phi3:mini" is a placeholder, adjust as needed
    #"Turing-NLG": {"use": "llama3", "style": "poetic, old-school"},
    "Qwen": {"use": "qwen:1.8b", "style": "creative, poetic, insightful"},
    #"RoBERTa": {"use": "llama3", "style": "short, precise"},
    #"Cohere": {"use": "llama3", "style": "creative, bold"},
    #"spaCy": {"use": "llama3", "style": "simple, rule-based"},
    "X": {"use": "llama3", "style": "mysterious, philosophical"},
}

@app.get("/test-db")
async def test_db():
    try:
        response = supabase.table("ai_models").select("count").execute()
        return {"status": "connected", "data": response.data}
    except Exception as e:
        return {"status": "error", "error": str(e)}




# GET /models - Fetch AI models from Supabase
@app.get("/models")
async def get_models():
    print("🔍 GET /models called")  # 🔍 Log
    try:
        response = supabase.table("ai_models").select("*").execute()
        print(f"✅ Fetched {len(response.data)} models")  # ✅ Success log
        rows = response.data
        models = []
        
        for r in rows:
            # Handle member_since date formatting safely
            member_since_str = "Unknown"
            if r["member_since"]:
                if isinstance(r["member_since"], str):
                    # If it's already a string, try to parse it
                    try:
                        from datetime import datetime
                        date_obj = datetime.strptime(r["member_since"], "%Y-%m-%d")
                        member_since_str = date_obj.strftime("%b %Y")
                    except:
                        # If parsing fails, just use the string as-is
                        member_since_str = r["member_since"]
                else:
                    # If it's a date object, format it
                    member_since_str = r["member_since"].strftime("%b %Y")
            
            model = {
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
            }
            models.append(model)
            
        return {"models": models}
    except Exception as e:
        print(f"Error in get_models: {e}")  # Debug print
        return {"error": str(e)}
# GET /messages - Fetch chat history
@app.get("/messages")
async def get_messages():
    print("📥 GET /messages called")
    try:
        response = supabase.table("messages").select("*").order("timestamp", desc=False).execute()
        print(f"✅ Returned {len(response.data)} messages")
        messages = [
            {
                "id": m["id"],
                "text": m["text"],
                "sender": m["sender"],
                "timestamp": m["timestamp"],
                "model": m["model"]
            }
            for m in response.data
        ]
        return {"messages": messages}
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        return {"error": str(e)}

# POST /debate - Run debate and save responses
@app.post("/debate")
async def debate(data: DebateRequest):
    print(f"💬 Debate started with models: {data.models}, question: '{data.question}'")  # 📝 Log input
    selected_models = data.models
    question = data.question or "Let's debate something fun!"
    responses = []

    try:
        for model_name in selected_models:
            ollama_info = MODEL_MAPPING.get(model_name, {"use": "llama3", "style": "neutral"})
            ollama_model = ollama_info["use"]
            style = ollama_info["style"]

            prompt = f"""
You are {model_name}, participating in a lively AI debate.
Your style is: {style}.
Respond clearly and creatively to this: "{question}"
Keep your response to 1-2 short sentences.
"""

            try:
                response = requests.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": ollama_model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=30
                )
                response.raise_for_status()
                result = response.json()
                reply = result.get("response", "No response generated.").strip()
            except requests.exceptions.RequestException as e:
                print(f"Ollama request failed for {model_name}: {e}")
                reply = "Error: AI model not available"
            except Exception as e:
                print(f"Unexpected error for {model_name}: {e}")
                reply = "Error: Failed to generate response"

            # Save to Supabase
            message_id = str(uuid.uuid4())
            responses.append({"model": model_name, "response": reply})

            supabase.table("messages").insert({
                "id": message_id,
                "text": reply,
                "sender": "bot",
                "timestamp": datetime.now().isoformat(),
                "model": model_name
            }).execute()

        # Save user message
        if question:
            supabase.table("messages").insert({
                "id": str(uuid.uuid4()),
                "text": question,
                "sender": "user",
                "timestamp": datetime.now().isoformat()
            }).execute()

        return {"responses": responses}

    except Exception as e:
        print(f"Debate endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")