# backend/src/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os

from local_functions import detect_provider, generate_response, save_debate_to_supabase

# =====================
# FastAPI app
# =====================
app = FastAPI(title="AI Debate Backend")

# Allow all origins (for testing; restrict later in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# Request Models
# =====================
class DebateRequest(BaseModel):
    topic: Optional[str] = None
    side_a: Optional[str] = None
    side_b: Optional[str] = None
    question: Optional[str] = None
    models: Optional[list] = None  # Optional now


# =====================
# Routes
# =====================

@app.get("/health")
def health_check():
    provider, model_name = detect_provider()
    return {
        "status": "ok",
        "time": datetime.utcnow().isoformat(),
        "message": "AI Debate Backend is running smoothly",
        "current_provider": provider,
        "current_model": model_name
    }


@app.post("/debate")
def debate(request: DebateRequest):
    try:
        # Build messages for the AI model
        if request.topic and request.side_a and request.side_b:
            prompt = f"Debate Topic: {request.topic}\nSide A: {request.side_a}\nSide B: {request.side_b}\nProvide an insightful debate."
        elif request.question:
            prompt = f"Question: {request.question}\nProvide a detailed, balanced answer."
        else:
            raise HTTPException(status_code=400, detail="Please provide either a topic with sides or a question.")

        messages = [{"role": "user", "content": prompt}]

        # If specific models are given, try each (currently only one provider/model supported at a time)
        if request.models:
            provider, model_name = detect_provider()  # Still use env key detection
            results = []
            for _ in request.models:  # In future could map models to providers
                output = generate_response(messages)
                results.append({"model": model_name, "response": output})
        else:
            provider, model_name = detect_provider()
            output = generate_response(messages)
            results = [{"model": model_name, "response": output}]

        # Save debate to Supabase
        save_debate_to_supabase(
            topic=request.topic or request.question,
            side_a=request.side_a,
            side_b=request.side_b,
            responses=results
        )

        return {"responses": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


"""
=====================
NOTES ON CHANGES
=====================
1. Removed Ollama + warm-up code.
2. "models" in DebateRequest is now optional.
3. Uses detect_provider() from local_functions.py to auto-pick provider/model.
4. Works with Together AI or
"""
