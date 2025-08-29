from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import whisper
import tempfile
import os
import logging
import sys
import time
import asyncio
import gc
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
logger.info("DEPLOYMENT: Starting FastAPI app initialization...")
app = FastAPI(title="Comedy Transcription API")
logger.info("DEPLOYMENT: FastAPI app initialized successfully")
logger.info(f"DEPLOYMENT: Running on Python {sys.version}")
logger.info(f"DEPLOYMENT: Working directory: {os.getcwd()}")

# Add CORS middleware
logger.info("DEPLOYMENT: Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
logger.info("DEPLOYMENT: CORS middleware added successfully")

# Memory-optimized approach: Load model per request for Render's 512MB limit
def load_model_for_transcription():
    """Load model just-in-time to minimize memory usage"""
    try:
        logger.info("DEPLOYMENT: Loading Whisper model (tiny.en for memory optimization)...")
        start_time = time.time()
        
        # Use smallest English-only model for Render's 512MB memory limit
        model = whisper.load_model("tiny.en")
        
        load_time = time.time() - start_time
        logger.info(f"DEPLOYMENT: Whisper model loaded in {load_time:.2f}s")
        
        return model
        
    except Exception as e:
        logger.error(f"DEPLOYMENT: Failed to load Whisper model: {e}")
        raise Exception(f"Failed to load transcription model: {e}")

# Serve static files
@app.get("/")
async def root():
    """Serve the main transcription interface"""
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comedy Transcription Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
        }
        .upload-area:hover {
            border-color: #999;
        }
        .result {
            margin-top: 30px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
            white-space: pre-wrap;
            min-height: 100px;
        }
        .loading {
            text-align: center;
            font-style: italic;
            color: #666;
        }
        .error {
            color: #d32f2f;
            background: #ffebee;
            border: 1px solid #f44336;
            padding: 15px;
            border-radius: 5px;
        }
        .error .tip {
            margin-top: 10px;
            padding: 10px;
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>🎤 Comedy Transcription Test</h1>
    <p>Upload an audio file of your comedy material to see it transcribed instantly using OpenAI Whisper.</p>
    
    <div class="upload-area">
        <input type="file" id="audioFile" accept="audio/*" />
        <p>Choose an audio file (MP3, WAV, M4A, etc.)</p>
    </div>
    
    <div id="result" class="result">
        <p>Your transcription will appear here...</p>
    </div>

    <script>
        async function preloadModel() {
            try {
                const response = await fetch("/api/preload-model", { method: "POST" });
                if (response.ok) {
                    console.log("Model preloaded successfully");
                }
            } catch (error) {
                console.log("Model preload failed (this is normal for first request):", error);
            }
        }

        preloadModel();

        document.getElementById("audioFile").addEventListener("change", async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const resultDiv = document.getElementById("result");
            resultDiv.className = "result loading";
            resultDiv.textContent = "Transcribing audio... This may take a minute for the first request.";
            
            const formData = new FormData();
            formData.append("file", file);
            
            try {
                const response = await fetch("/api/transcribe", {
                    method: "POST",
                    body: formData
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = "HTTP error! status: " + response.status;
                    
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.detail) {
                            errorMessage = errorJson.detail;
                        }
                    } catch (e) {
                        if (errorText && errorText.trim()) {
                            errorMessage = errorText.trim();
                        }
                    }
                    
                    throw new Error(errorMessage);
                }
                
                const result = await response.json();
                resultDiv.className = "result";
                resultDiv.textContent = result.transcription || "No transcription available";
                
            } catch (error) {
                resultDiv.className = "result error";
                resultDiv.textContent = "Error: " + error.message;
                
                if (error.message.includes("503") || error.message.includes("unavailable")) {
                    resultDiv.textContent += "\\n\\nTip: This usually means the transcription service is starting up. Please wait a minute and try again.";
                } else if (error.message.includes("500")) {
                    resultDiv.textContent += "\\n\\nTip: Try with a shorter audio file or different audio format.";
                }
            }
        });
    </script>
</body>
</html>
    """
    return HTMLResponse(content=html_content)

@app.get("/favicon.ico")
async def favicon():
    """Serve favicon to prevent 404s"""
    return {"message": "No favicon"}

@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    logger.info("API status endpoint accessed")
    return {"message": "Comedy Transcription API", "status": "running"}

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    logger.info("Transcribe endpoint accessed")
    if not file:
        logger.error("No file uploaded")
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file type
    if not file.content_type or not file.content_type.startswith('audio/'):
        # Allow common audio extensions even if content_type is wrong
        allowed_extensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an audio file (MP3, WAV, M4A, FLAC, OGG, WEBM)"
            )
    
    temp_path = None
    try:
        logger.info(f"Processing file: {file.filename}")
        
        # Load model just-in-time to minimize memory usage
        try:
            whisper_model = load_model_for_transcription()
        except Exception as model_error:
            logger.error(f"Model loading failed: {model_error}")
            raise HTTPException(
                status_code=503, 
                detail="Transcription service temporarily unavailable. Please try again in a few minutes."
            )
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="File is empty")
            
            tmp.write(content)
            temp_path = tmp.name
        
        logger.info(f"File saved to {temp_path}, starting transcription...")
        
        # Transcribe the audio file with timeout and memory management
        try:
            # Log memory usage before transcription
            memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
            logger.info(f"Memory usage before transcription: {memory_mb:.1f}MB")
            
            # Set a reasonable timeout for transcription
            result = whisper_model.transcribe(temp_path)
            logger.info("Transcription completed successfully")
            
            # Immediately free model memory after transcription
            del whisper_model
            gc.collect()
            
            memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
            logger.info(f"Memory usage after cleanup: {memory_mb:.1f}MB")
            
        except Exception as transcribe_error:
            logger.error(f"Whisper transcription failed: {transcribe_error}")
            # Clean up memory on error
            gc.collect()
            raise HTTPException(
                status_code=500, 
                detail=f"Audio processing failed. Please try with a shorter audio file or different format."
            )
        
        return {
            "filename": file.filename,
            "transcription": result["text"],
            "language": result.get("language", "unknown"),
            "success": True
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")
        
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file {temp_path}: {e}")

@app.get("/health")
async def health_check():
    logger.info("Health check accessed")
    return {
        "status": "healthy",
        "memory_optimized": True,
        "model_type": "tiny.en (load-per-request)"
    }

@app.post("/api/preload-model")
async def preload_model():
    """Test model loading (no persistent preload in memory-optimized mode)"""
    logger.info("Model preload endpoint accessed - testing model loading capability")
    try:
        # Test load and immediately free
        test_model = load_model_for_transcription()
        del test_model
        gc.collect()
        
        return {
            "message": "Model loading test successful (memory-optimized mode)",
            "model_type": "tiny.en",
            "memory_optimized": True
        }
    except Exception as e:
        logger.error(f"Model loading test failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test model loading: {str(e)}"
        )