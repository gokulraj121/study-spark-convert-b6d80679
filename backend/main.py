
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
    
    # ... keep existing code (generate flashcards logic)
    
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

# Function to compress images
def compress_image(image_path: str, output_path: str, quality: int = 70):
    try:
        img = Image.open(image_path)
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3] if len(img.split()) > 3 else None)
            img = background
        
        # Save with specified quality
        img.save(output_path, optimize=True, quality=quality)
        return output_path
    except Exception as e:
        logger.error(f"Error compressing image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compress image: {str(e)}")

# Function to compress PDF
def compress_pdf(pdf_path: str, output_path: str, quality: int = 70):
    try:
        # Open the PDF
        pdf = fitz.open(pdf_path)
        
        # Create a new PDF
        new_pdf = fitz.open()
        
        # Process each page
        for page_num in range(len(pdf)):
            page = pdf.load_page(page_num)
            
            # Render page to pixmap with compression
            compression_factor = max(0.2, quality / 100)  # Map 10-100 to 0.2-1.0
            dpi = int(72 * compression_factor)  # Lower DPI for more compression
            
            # Render page to pixmap
            pix = page.get_pixmap(matrix=fitz.Matrix(compression_factor, compression_factor))
            
            # Create a new page in the output PDF
            new_page = new_pdf.new_page(width=page.rect.width, height=page.rect.height)
            
            # Convert pixmap to image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Create a temporary image file
            temp_img_path = f"{output_path}.temp.jpg"
            img.save(temp_img_path, "JPEG", quality=quality)
            
            # Insert image into the PDF page
            new_page.insert_image(new_page.rect, filename=temp_img_path)
            
            # Clean up temporary image
            os.remove(temp_img_path)
        
        # Save the compressed PDF
        new_pdf.save(output_path, deflate=True, garbage=3)
        new_pdf.close()
        pdf.close()
        
        return output_path
    except Exception as e:
        logger.error(f"Error compressing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compress PDF: {str(e)}")

@app.post("/api/flashcards")
async def create_flashcards(file: UploadFile = File(...)):
    """Upload a PDF and convert it to flashcards"""
    # ... keep existing code (flashcard generation endpoint)

@app.post("/api/convert")
async def convert_file(
    file: UploadFile = File(...),
    conversion_type: str = Form(...),
    compression_level: int = Form(70)  # Default to 70% quality
):
    """Convert files between different formats or compress them"""
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
            
        elif conversion_type == "image-compress":
            # Image compression
            output_path = Path(temp_dir) / f"{Path(file.filename).stem}-compressed.jpg"
            compress_image(str(temp_in_path), str(output_path), compression_level)
            
            return FileResponse(
                path=output_path, 
                filename=f"{Path(file.filename).stem}-compressed.jpg",
                media_type="image/jpeg"
            )
            
        elif conversion_type == "pdf-compress":
            # PDF compression
            output_path = Path(temp_dir) / f"{Path(file.filename).stem}-compressed.pdf"
            compress_pdf(str(temp_in_path), str(output_path), compression_level)
            
            return FileResponse(
                path=output_path, 
                filename=f"{Path(file.filename).stem}-compressed.pdf",
                media_type="application/pdf"
            )
            
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
