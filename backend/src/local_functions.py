# backend/src/local_functions.py
import os
import requests
from supabase import create_client
from datetime import datetime

# =====================
# Provider configuration
# =====================
PROVIDERS = {
    "together": {
        "env_key": "TOGETHER_API_KEY",
        "base_url": "https://api.together.xyz/v1/chat/completions",
        "default_model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "free_trial": "1M tokens free/month"
    },
    "openai": {
        "env_key": "OPENAI_API_KEY",
        "base_url": "https://api.openai.com/v1/chat/completions",
        "default_model": "gpt-4o-mini",
        "free_trial": "$5 free credits (limited time)"
    },
    "deepinfra": {
        "env_key": "DEEPINFRA_API_KEY",
        "base_url": "https://api.deepinfra.com/v1/openai/chat/completions",
        "default_model": "mistralai/Mistral-7B-Instruct-v0.3",
        "free_trial": "50K tokens free/month"
    }
}


# =====================
# Auto-detect provider
# =====================
def detect_provider():
    """Detects which provider to use based on available API keys."""
    env_provider = os.getenv("MODEL_PROVIDER")
    env_model = os.getenv("MODEL_NAME")

    # If explicit provider/model is set in env, use that
    if env_provider and env_model:
        return env_provider.lower(), env_model

    # Otherwise auto-detect
    for provider, info in PROVIDERS.items():
        if os.getenv(info["env_key"]):
            return provider, info["default_model"]

    raise RuntimeError("No API keys found for supported providers.")


# =====================
# Create Supabase client
# =====================
def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("Missing Supabase configuration in environment variables.")
    return create_client(url, key)


# =====================
# Generate model output
# =====================
def generate_response(messages):
    provider, model_name = detect_provider()
    api_key = os.getenv(PROVIDERS[provider]["env_key"])
    base_url = PROVIDERS[provider]["base_url"]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": messages,
        "max_tokens": 500,
        "temperature": 0.7
    }

    response = requests.post(base_url, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"Error from {provider} API: {response.text}")

    data = response.json()

    # Different APIs may have slightly different response formats
    if "choices" in data and data["choices"]:
        return data["choices"][0]["message"]["content"]

    raise RuntimeError(f"Unexpected response format from {provider}: {data}")


# =====================
# Save debate to Supabase
# =====================
def save_debate_to_supabase(topic, side_a, side_b, responses):
    supabase = get_supabase_client()
    supabase.table("debates").insert({
        "topic": topic,
        "side_a": side_a,
        "side_b": side_b,
        "responses": responses,
        "created_at": datetime.utcnow().isoformat()
    }).execute()


"""
=====================
NOTES ON CHANGES
=====================
1. Removed all 'warm-up model' logic — backend starts instantly now.
2. Added PROVIDERS dict to store API base URL, env key, default model, and free trial info.
3. Added detect_provider() to automatically select provider if MODEL_PROVIDER/MODEL_NAME not set.
4. generate_response() now works with multiple providers.
5. Supabase storage kept same as before.
6. Together AI is the default if no provider explicitly set.
7. Easier to add more providers later — just append to PROVIDERS dict.
"""
"[Warm-up] No response")

""" it will all
call_model() dispatcher → decides which provider’s API to call

Added OpenAI + Together support

API keys are pulled from env vars (OPENAI_API_KEY, TOGETHER_API_KEY)

Prompt builder auto-handles either a debate or question request

Optional warm_up_model() just sends a short test prompt for connectivity — no heavy model loading

Removed old Ollama-specific warm-up (not needed anymore)
"""

