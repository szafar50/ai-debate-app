import requests
import psutil
import logging
import httpx


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WARMUP_MODELS = ["llama3", "mistral", "phi3:mini", "qwen:1.8b"]
OLLAMA_BASE_URL = "http://localhost:11434/api/generate"

async def warm_up_models(): # noqa: E501 --  Warm up Ollama models asynchronously.
    logger.info("🔥 Starting model warm-up...")
    async with httpx.AsyncClient(timeout=15) as client:
        for model in WARMUP_MODELS:
            try:
                logger.info(f"🔁 Warming up {model}...")
                response = await client.post(
                    OLLAMA_BASE_URL,
                    json={
                        "model": model,
                        "prompt": "hi",
                        "stream": False
                    }
                )
                if response.status_code == 200:
                    logger.info(f"✅ {model} is warm and ready!")
                else:
                    logger.warning(f"❌ {model} responded with status {response.status_code}")
            except httpx.ConnectError:
                logger.error(f"❌ Failed to connect to Ollama for {model}. Is Ollama running?")
            except httpx.ReadTimeout:
                logger.error(f"❌ {model} warm-up timed out")
            except Exception as e:
                logger.error(f"❌ Unexpected error for {model}: {e}")
    logger.info("🎉 Model warm-up complete!")

    logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.FileHandler("logs/app.log"), logging.StreamHandler()],
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)










def check_ollama_process():
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        cmdline = proc.info.get('cmdline') or []
        if any("ollama" in str(arg).lower() for arg in cmdline):
            print(f"✅ Ollama process found (PID: {proc.info['pid']})")
            return
    print("❌ Ollama process not found.")


def check_ollama_status():
    try:
        response = requests.get("http://localhost:11434")
        if response.status_code == 200:
            print("✅ Ollama is running.")
        else:
            print(f"⚠️ Ollama responded, but status code is {response.status_code}.")
    except requests.exceptions.ConnectionError:
        print("❌ Ollama is not running (connection failed).")

#check_ollama_status()    # it will be called later
#check_ollama_process()    # it will be called later