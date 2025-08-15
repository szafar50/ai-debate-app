# backend/src/local_functions.py

import os
import requests
import logging

# Logging config
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === Provider Call Functions ===

def call_openai(model: str, prompt: str) -> str:
    """Call OpenAI API for a given model and prompt."""
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")

    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        logger.error(f"OpenAI call failed: {e}")
        return f"Error: {e}"

def call_together(model: str, prompt: str) -> str:
    """Call Together API for a given model and prompt."""
    api_key = os.getenv("TOGETHER_API_KEY")
    url = "https://api.together.xyz/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"Together API call failed: {e}")
        return f"Error: {e}"

# === Main call dispatcher ===

def call_model(provider: str, model: str, data) -> str:
    """
    Dispatch to the correct provider call.
    `data` is DebateRequest with topic/question/side_a/side_b.
    """
    prompt = build_prompt(data)

    if provider.lower() == "openai":
        return call_openai(model, prompt)
    elif provider.lower() == "together":
        return call_together(model, prompt)
    else:
        return f"Error: Provider '{provider}' not supported."

# === Prompt Builder ===

def build_prompt(data) -> str:
    """Generate a debate or Q&A prompt based on request data."""
    if data.topic and data.side_a and data.side_b:
        return f"Debate Topic: {data.topic}\nSide A: {data.side_a}\nSide B: {data.side_b}\nProvide an insightful debate."
    elif data.question:
        return f"Question: {data.question}\nProvide a detailed, balanced answer."
    else:
        return "Please provide a topic and sides for debate or a question."

# === Optional: Warm-up Check ===

def warm_up_model(provider: str, model: str):
    """Optional warm-up call to verify provider connectivity."""
    logger.info(f"[Warm-up] Checking {provider} - {model}...")
    test_prompt = "Briefly introduce yourself."
    resp = call_model(provider, model, type("obj", (object,), {"topic": None, "side_a": None, "side_b": None, "question": test_prompt}))
    logger.info(f"[Warm-up Response] {resp[:60]}..." if resp else "[Warm-up] No response")
