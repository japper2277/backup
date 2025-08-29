from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Comedy Transcription API")

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
            color: red;
            background: #ffe6e6;
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
        document.getElementById('audioFile').addEventListener('change', async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const resultDiv = document.getElementById('result');
            resultDiv.className = 'result loading';
            resultDiv.textContent = 'Transcribing audio... This may take a minute.';
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                resultDiv.className = 'result';
                resultDiv.textContent = result.transcription || 'No transcription available';
                
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.textContent = `Error: ${error.message}`;
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
    """Mock transcription for testing - returns dummy text"""
    logger.info(f"Mock transcribe endpoint accessed with file: {file.filename}")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Mock transcription response for testing
    return {
        "filename": file.filename,
        "transcription": f"This is a mock transcription of your audio file '{file.filename}'. In production, this would be processed by OpenAI Whisper AI model.",
        "language": "en",
        "success": True
    }