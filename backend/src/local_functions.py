import os
import httpx

# Environment variables
MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "openai").lower()
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o-mini")
API_KEYS = {
    "openai": os.getenv("OPENAI_API_KEY"),
    "together": os.getenv("TOGETHER_API_KEY"),
    "deepinfra": os.getenv("DEEPINFRA_API_KEY"),
}

OLLAMA_BASE_URL = "http://localhost:11434/api/generate"

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
# - Removed warm_up_models() completely (not needed for hosted APIs like Together/OpenAI/DeepInfra)
# - Kept call_model() so debate endpoint still works
# - Ready for multi-provider use by changing env vars
