#!/usr/bin/env python3
"""
VVA — Test NVIDIA NIM API Connectivity
Validates API credentials and model accessibility without running full report.
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        return False

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


def test_connection(api_key=None, model=None):
    # Dynamically find .env in current directory or VVA root
    vva_root = Path(__file__).resolve().parent.parent
    if (Path.cwd() / ".env").is_file():
        load_dotenv(Path.cwd() / ".env", override=False)
    if (vva_root / ".env").is_file():
        load_dotenv(vva_root / ".env", override=False)

    effective_key = api_key or os.getenv("NVIDIA_API_KEY")
    effective_model = model or os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")
    base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")

    print("=== NVIDIA NIM API Connectivity Test ===")
    print(f"Base URL: {base_url}")
    print(f"Target Model: {effective_model}")

    if not effective_key or effective_key.strip() in ("", "your_nvidia_api_key_here", "nvapi-your-key-here"):
        print("\n\x1b[31m[FAILED] NVIDIA_API_KEY is missing or contains placeholder.\x1b[0m")
        print("Please configure your API key in .env or via environment variable:")
        print("  export NVIDIA_API_KEY=nvapi-...")
        print("Sign up for free at https://build.nvidia.com")
        sys.exit(1)

    masked_key = effective_key[:8] + "..." + effective_key[-4:] if len(effective_key) > 12 else "***"
    print(f"API Key:  {masked_key} (Present)")

    if OpenAI is None:
        print("\n\x1b[31m[FAILED] 'openai' package is not installed.\x1b[0m")
        print("Run 'vva init' to create the Python virtual environment and install dependencies.")
        sys.exit(1)

    try:
        print("\nSending probe test request to NVIDIA NIM API...")
        client = OpenAI(base_url=base_url, api_key=effective_key, timeout=30.0)

        response = client.chat.completions.create(
            model=effective_model,
            messages=[
                {
                    "role": "user",
                    "content": "Reply with 'VVA_API_READY' and nothing else."
                }
            ],
            max_tokens=20,
            temperature=0.1,
        )

        reply = response.choices[0].message.content.strip()
        print("\x1b[32m[SUCCESS] NVIDIA NIM API is reachable and authenticated!\x1b[0m")
        print(f"Response: {reply}")
        sys.exit(0)

    except Exception as exc:
        print(f"\n\x1b[31m[FAILED] API Request Error: {exc}\x1b[0m")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Test NVIDIA NIM API Connection")
    parser.add_argument("--api-key", default=None)
    parser.add_argument("--model", default=None)
    args = parser.parse_args()
    test_connection(args.api_key, args.model)


if __name__ == "__main__":
    main()
