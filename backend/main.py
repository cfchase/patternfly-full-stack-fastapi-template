"""
Main entry point for running the application with uvicorn.
"""
import os

import uvicorn

from app.main import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)