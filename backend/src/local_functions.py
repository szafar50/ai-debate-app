import os
import httpx
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "openai").lower()
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o-mini")
API_KEYS = {
    "openai": os.getenv("OPENAI_API_KEY"),
    "together": os.getenv("TOGETHER_API_KEY"),
    "deepinfra": os.getenv("DEEPINFRA_API_KEY"),
}

# Warm-up model list
WARMUP_MODELS = {
    "ollama": ["llama3", "mistral", "phi3:mini", "qwen:1.8b"],
    "openai": [MODEL_NAME],
    "together": [MODEL_NAME],
    "deepinfra": [MODEL_NAME],
}
OLLAMA_BASE_URL = "http://localhost:11434/api/generate"

async def warm_up_models():
    """
    Warm up models based on provider.
    """
    logger.info(f"[INFO] Starting model warm-up for provider '{MODEL_PROVIDER}'...")

    models_to_warm = WARMUP_MODELS.get(MODEL_PROVIDER, [MODEL_NAME])

    async with httpx.AsyncClient(timeout=15.0) as client:
        for model in models_to_warm:
            try:
                logger.info(f"[INFO] Warming up {model}...")

                if MODEL_PROVIDER == "ollama":
                    response = await client.post(
                        OLLAMA_BASE_URL,
                        json={"model": model, "prompt": "hi", "stream": False}
                    )

                elif MODEL_PROVIDER in ["openai", "together"]:
                    url = (
                        "https://api.openai.com/v1/chat/completions"
                        if MODEL_PROVIDER == "openai"
                        else "https://api.together.xyz/v1/chat/completions"
                    )
                    headers = {"Authorization": f"Bearer {API_KEYS[MODEL_PROVIDER]}"}
                    payload = {
                        "model": model,
                        "messages": [{"role": "user", "content": "hi"}]
                    }
                    response = await client.post(url, headers=headers, json=payload)

                elif MODEL_PROVIDER == "deepinfra":
                    url = f"https://api.deepinfra.com/v1/inference/{model}"
                    headers = {"Authorization": f"Bearer {API_KEYS['deepinfra']}"}
                    payload = {"input": "hi"}
                    response = await client.post(url, headers=headers, json=payload)

                else:
                    logger.warning(f"[WARN] Unknown provider: {MODEL_PROVIDER}")
                    continue

                if response.status_code == 200:
                    logger.info(f"[OK] {model} is warm and ready!")
                else:
                    logger.warning(f"[WARN] {model} responded with status {response.status_code}")

            except Exception as e:
                logger.error(f"[ERROR] {model} warm-up failed: {e}")

    logger.info("[INFO] Model warm-up complete!")

def call_model(prompt, model):
    """
    Call AI model based on the selected provider.
    """
    if MODEL_PROVIDER == "ollama":
        r = httpx.post(
            OLLAMA_BASE_URL,
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=60
        )
        r.raise_for_status()
        return r.json().get("response", "").strip()

    elif MODEL_PROVIDER in ["openai", "together"]:
        url = (
            "https://api.openai.com/v1/chat/completions"
            if MODEL_PROVIDER == "openai"
            else "https://api.together.xyz/v1/chat/completions"
        )
        headers = {"Authorization": f"Bearer {API_KEYS[MODEL_PROVIDER]}"}
        payload = {"model": model, "messages": [{"role": "user", "content": prompt}]}
        r = httpx.post(url, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

    elif MODEL_PROVIDER == "deepinfra":
        url = f"https://api.deepinfra.com/v1/inference/{model}"
        headers = {"Authorization": f"Bearer {API_KEYS['deepinfra']}"}
        payload = {"input": prompt}
        r = httpx.post(url, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()["results"][0]["generated_text"].strip()

    else:
        raise ValueError(f"Unknown MODEL_PROVIDER: {MODEL_PROVIDER}")

# === CHANGE NOTES ===
# - Added multi-provider support (OpenAI default, Together AI, DeepInfra, Ollama).
# - Added MODEL_PROVIDER, MODEL_NAME, and API_KEYS from environment variables.
# - warm_up_models now adapts to provider.
# - Added call_model() for unified model calls from main.py.
