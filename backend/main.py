
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os
import tempfile
import shutil
import uuid
from pathlib import Path
import logging
from typing import List, Dict, Any, Optional

# Import utility libraries for file processing
try:
    import fitz  # PyMuPDF
    import docx
    from docx2pdf import convert
    from PIL import Image
    import pytesseract
    import requests
    import json
    from io import BytesIO
except ImportError:
    print("Please install required libraries: pip install pymupdf python-docx docx2pdf pillow pytesseract requests")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Smart Study Tool API")

# Create temporary directory for uploads
UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample AI function to generate flashcards from text
def generate_flashcards_from_text(text: str) -> List[Dict[str, str]]:
    """
    This is a simple placeholder for a more sophisticated AI model.
    In a real application, this would call an external AI API like OpenAI.
    """
    # For demo purposes, we'll create some simple flashcards based on text
    # In a real app, this would call GPT or another AI API
    
    # Simple implementation to extract some content as flashcards
    flashcards = []
    paragraphs = text.split('\n\n')
    
    # Create simple Q&A pairs
    for i, para in enumerate(paragraphs):
        if len(para.strip()) < 10:  # Skip very short paragraphs
            continue
            
        # Create a simple question
        question = f"What is the key point from paragraph {i+1}?"
        answer = para[:200] + "..." if len(para) > 200 else para
        
        flashcards.append({
            "question": question,
            "answer": answer
        })
        
        # Create more specific questions if possible
        words = para.split()
        if len(words) > 5 and i % 2 == 0:  # Add variety to flashcards
            key_term = " ".join(words[:2])
            question = f"Explain the concept of {key_term}:"
            answer = para[:150] + "..." if len(para) > 150 else para
            flashcards.append({
                "question": question,
                "answer": answer
            })
    
        # Limit to 15 flashcards for demo
        if len(flashcards) >= 15:
            break
    
    # If we didn't get enough flashcards, add some generic ones
    if len(flashcards) < 5:
        flashcards.extend([
            {"question": "What are the main topics covered in this document?", 
             "answer": "The document covers " + text[:100] + "..."},
            {"question": "Summarize the key points from the document:", 
             "answer": "The key points include information about " + text[50:150] + "..."}
        ])
    
    return flashcards

# Function to extract text from PDF
def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        text = ""
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text from PDF: {str(e)}")

@app.post("/api/flashcards")
async def create_flashcards(file: UploadFile = File(...)):
    """Upload a PDF and convert it to flashcards"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
        
    # Create temporary file
    temp_file = UPLOAD_DIR / f"{uuid.uuid4()}.pdf"
    try:
        # Save uploaded file
        with open(temp_file, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Extract text from PDF
        text = extract_text_from_pdf(str(temp_file))
        
        # Generate flashcards from text
        flashcards = generate_flashcards_from_text(text)
        
        return {"flashcards": flashcards}
    
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        # Clean up
        try:
            os.unlink(temp_file)
        except:
            pass

@app.post("/api/convert")
async def convert_file(
    file: UploadFile = File(...),
    conversion_type: str = Form(...)
):
    """Convert files between different formats"""
    # Create a unique filename
    temp_dir = tempfile.mkdtemp(dir=UPLOAD_DIR)
    temp_in_path = Path(temp_dir) / file.filename
    
    try:
        # Save uploaded file
        with open(temp_in_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Handle different conversion types
        if conversion_type == "pdf-to-docx":
            # PDF to Word conversion
            output_path = Path(temp_dir) / f"{Path(file.filename).stem}.docx"
            # In a real application, use a PDF to DOCX converter
            # For demo, we'll just extract text and create a simple DOCX
            text = extract_text_from_pdf(str(temp_in_path))
            doc = docx.Document()
            doc.add_paragraph(text)
            doc.save(str(output_path))
            
            return FileResponse(
                path=output_path, 
                filename=f"{Path(file.filename).stem}.docx",
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            
        elif conversion_type == "docx-to-pdf":
            # Word to PDF conversion
            output_path = Path(temp_dir) / f"{Path(file.filename).stem}.pdf"
            convert(str(temp_in_path), str(output_path))
            
            return FileResponse(
                path=output_path, 
                filename=f"{Path(file.filename).stem}.pdf",
                media_type="application/pdf"
            )
            
        elif conversion_type == "jpg-to-png":
            output_path = Path(temp_dir) / f"{Path(file.filename).stem}.png"
            image = Image.open(temp_in_path)
            image.save(str(output_path), "PNG")
            
            return FileResponse(
                path=output_path, 
                filename=f"{Path(file.filename).stem}.png",
                media_type="image/png"
            )
            
        elif conversion_type == "png-to-jpg":
            output_path = Path(temp_dir) / f"{Path(file.filename).stem}.jpg"
            image = Image.open(temp_in_path)
            # Convert to RGB if necessary (for PNG with transparency)
            if image.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3])
                image = background
            image.save(str(output_path), "JPEG", quality=95)
            
            return FileResponse(
                path=output_path, 
                filename=f"{Path(file.filename).stem}.jpg",
                media_type="image/jpeg"
            )
            
        elif conversion_type == "image-to-text":
            # OCR image to text
            image = Image.open(temp_in_path)
            text = pytesseract.image_to_string(image)
            return {"text": text}
            
        elif conversion_type == "pdf-to-text":
            # PDF to text
            text = extract_text_from_pdf(str(temp_in_path))
            return {"text": text}
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported conversion type: {conversion_type}")
    
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

@app.get("/")
def read_root():
    """API health check endpoint"""
    return {"status": "OK", "message": "Smart Study Tool API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
