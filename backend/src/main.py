# backend/src/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
import os
import uuid
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .local_functions import call_model  # <-- FIXED: relative import

load_dotenv()

# FastAPI app
app = FastAPI()

# Allow CORS for all origins (frontend calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Debate request model (models is now optional)
class DebateRequest(BaseModel):
    topic: Optional[str] = None
    side_a: Optional[str] = None
    side_b: Optional[str] = None
    question: Optional[str] = None
    models: Optional[List[str]] = None  # <-- optional now

# Health check
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "time": datetime.utcnow().isoformat(),
        "message": "AI Debate Backend is running smoothly",
        "models_loaded": ["Example"],
        "current_provider": os.getenv("MODEL_PROVIDER"),
        "current_model": os.getenv("MODEL_NAME")
    }

# Debate endpoint
@app.post("/debate")
async def debate(data: DebateRequest):
    models_to_use = data.models or [os.getenv("MODEL_NAME")]
    provider = os.getenv("MODEL_PROVIDER", "openai")

    responses = []
    for model in models_to_use:
        try:
            ai_response = call_model(provider, model, data)
            responses.append({"model": model, "response": ai_response})
        except Exception as e:
            responses.append({"model": model, "response": f"Error: {str(e)}"})

    try:
        supabase.table("debates").insert({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "topic": data.topic,
            "side_a": data.side_a,
            "side_b": data.side_b,
            "question": data.question,
            "responses": responses
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase insert error: {str(e)}")

    return {"responses": responses}
