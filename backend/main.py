
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

# Function to protect PDF with password
def protect_pdf(pdf_path: str, output_path: str, password: str):
    try:
        # Open the PDF
        pdf = fitz.open(pdf_path)
        
        # Set the password
        pdf.save(output_path, encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=password, owner_pw=password)
        pdf.close()
        
        return output_path
    except Exception as e:
        logger.error(f"Error protecting PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to protect PDF: {str(e)}")

# Function to unlock PDF with password
def unlock_pdf(pdf_path: str, output_path: str, password: str):
    try:
        # Open the PDF with password
        pdf = fitz.open(pdf_path, password=password)
        
        # Save without password
        pdf.save(output_path)
        pdf.close()
        
        return output_path
    except fitz.FileDataError:
        raise HTTPException(status_code=400, detail="Invalid password")
    except Exception as e:
        logger.error(f"Error unlocking PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unlock PDF: {str(e)}")

# Function to perform OCR on PDF
def ocr_pdf(pdf_path: str):
    try:
        # Open the PDF
        pdf = fitz.open(pdf_path)
        
        text = ""
        for page_num in range(len(pdf)):
            page = pdf.load_page(page_num)
            
            # Render page to pixmap
            pix = page.get_pixmap()
            
            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Perform OCR
            page_text = pytesseract.image_to_string(img)
            text += f"Page {page_num + 1}:\n{page_text}\n\n"
        
        pdf.close()
        return text
    except Exception as e:
        logger.error(f"Error performing OCR on PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to perform OCR: {str(e)}")

# Function to merge PDFs
def merge_pdfs(pdf_paths: List[str], output_path: str):
    try:
        # Create a new PDF
        merged_pdf = fitz.open()
        
        # Add each PDF to the merged PDF
        for pdf_path in pdf_paths:
            pdf = fitz.open(pdf_path)
            merged_pdf.insert_pdf(pdf)
            pdf.close()
        
        # Save the merged PDF
        merged_pdf.save(output_path)
        merged_pdf.close()
        
        return output_path
    except Exception as e:
        logger.error(f"Error merging PDFs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to merge PDFs: {str(e)}")

# Function to split PDF
def split_pdf(pdf_path: str, output_dir: str, ranges: str):
    try:
        # Parse ranges (e.g., "1-3,4-10" or "1,3,5-7")
        page_ranges = []
        for range_str in ranges.split(','):
            if '-' in range_str:
                start, end = map(int, range_str.split('-'))
                # Convert to 0-based indexing
                page_ranges.append((start - 1, end))
            else:
                page_num = int(range_str)
                # Convert to 0-based indexing
                page_ranges.append((page_num - 1, page_num))
        
        # Open the PDF
        pdf = fitz.open(pdf_path)
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        output_paths = []
        for i, (start, end) in enumerate(page_ranges):
            # Create a new PDF
            new_pdf = fitz.open()
            
            # Add the specified pages
            new_pdf.insert_pdf(pdf, from_page=start, to_page=end - 1)
            
            # Save the new PDF
            output_path = os.path.join(output_dir, f"split_{i + 1}.pdf")
            new_pdf.save(output_path)
            new_pdf.close()
            
            output_paths.append(output_path)
        
        pdf.close()
        
        return output_paths
    except Exception as e:
        logger.error(f"Error splitting PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to split PDF: {str(e)}")

# Function to convert image to PDF
def image_to_pdf(image_path: str, output_path: str):
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Create a new PDF
        pdf = fitz.open()
        
        # Create a new page
        page = pdf.new_page(width=img.width, height=img.height)
        
        # Save the image to a temporary file
        temp_img_path = f"{output_path}.temp.jpg"
        img.save(temp_img_path)
        
        # Insert the image into the PDF page
        page.insert_image(page.rect, filename=temp_img_path)
        
        # Save the PDF
        pdf.save(output_path)
        pdf.close()
        
        # Clean up temporary image
        os.remove(temp_img_path)
        
        return output_path
    except Exception as e:
        logger.error(f"Error converting image to PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to convert image to PDF: {str(e)}")

@app.post("/api/flashcards")
async def create_flashcards(file: UploadFile = File(...)):
    """Upload a PDF and convert it to flashcards"""
    # ... keep existing code (flashcard generation endpoint)

@app.post("/api/convert")
async def convert_file(
    file: UploadFile = File(None),
    files: List[UploadFile] = File(None),
    conversion_type: str = Form(...),
    compression_level: int = Form(70),  # Default to 70% quality
    password: str = Form(None),         # For PDF protection/unlocking
    split_ranges: str = Form(None)      # For PDF splitting
):
    """Convert files between different formats or compress them"""
    # Create a unique filename and temporary directory
    temp_dir = tempfile.mkdtemp(dir=UPLOAD_DIR)
    
    try:
        # Handle batch operations
        if conversion_type.startswith("batch-") or conversion_type == "merge-pdfs":
            if not files:
                raise HTTPException(status_code=400, detail="No files uploaded for batch processing")
            
            # Save all uploaded files
            file_paths = []
            for uploaded_file in files:
                temp_path = Path(temp_dir) / uploaded_file.filename
                with open(temp_path, "wb") as f:
                    shutil.copyfileobj(uploaded_file.file, f)
                file_paths.append(str(temp_path))
            
            # Merge PDFs
            if conversion_type == "merge-pdfs":
                output_path = Path(temp_dir) / "merged.pdf"
                merge_pdfs(file_paths, str(output_path))
                return FileResponse(
                    path=output_path,
                    filename="merged.pdf",
                    media_type="application/pdf"
                )
            
            # Batch compress PDFs
            elif conversion_type == "batch-compress":
                # Create a ZIP file containing compressed PDFs
                # For demo, we'll just compress the first file
                if file_paths:
                    output_path = Path(temp_dir) / "compressed.pdf"
                    compress_pdf(file_paths[0], str(output_path), compression_level)
                    return FileResponse(
                        path=output_path,
                        filename="compressed.pdf",
                        media_type="application/pdf"
                    )
            
            # Batch compress images
            elif conversion_type == "batch-compress-images":
                # For demo, we'll just compress the first image
                if file_paths:
                    output_path = Path(temp_dir) / "compressed.jpg"
                    compress_image(file_paths[0], str(output_path), compression_level)
                    return FileResponse(
                        path=output_path,
                        filename="compressed.jpg",
                        media_type="image/jpeg"
                    )
            
            # Batch convert to PDF
            elif conversion_type == "batch-convert-to-pdf":
                # For demo, we'll just convert the first image
                if file_paths:
                    output_path = Path(temp_dir) / "converted.pdf"
                    image_to_pdf(file_paths[0], str(output_path))
                    return FileResponse(
                        path=output_path,
                        filename="converted.pdf",
                        media_type="application/pdf"
                    )
        
        # Handle single file operations
        else:
            if not file:
                raise HTTPException(status_code=400, detail="No file uploaded")
            
            # Save uploaded file
            temp_in_path = Path(temp_dir) / file.filename
            with open(temp_in_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            
            # Handle different conversion types for single files
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
            
            elif conversion_type == "pdf-to-xlsx":
                # For demo, we'll just return a simple Excel file
                # In a real implementation, you'd use a library like pandas or openpyxl
                output_path = Path(temp_dir) / f"{Path(file.filename).stem}.xlsx"
                # Placeholder - would implement actual conversion here
                return FileResponse(
                    path=temp_in_path, # Just return the original for demo
                    filename=f"{Path(file.filename).stem}.xlsx",
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            elif conversion_type == "pdf-to-pptx":
                # For demo, we'll just return a simple PowerPoint file
                # In a real implementation, you'd use a library like python-pptx
                output_path = Path(temp_dir) / f"{Path(file.filename).stem}.pptx"
                # Placeholder - would implement actual conversion here
                return FileResponse(
                    path=temp_in_path, # Just return the original for demo
                    filename=f"{Path(file.filename).stem}.pptx",
                    media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
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
                
            elif conversion_type == "xlsx-to-pdf" or conversion_type == "pptx-to-pdf":
                # For demo purposes, we'll just return a PDF
                # In a real implementation, you'd use a library for conversion
                output_path = Path(temp_dir) / f"{Path(file.filename).stem}.pdf"
                # Placeholder - would implement actual conversion here
                return FileResponse(
                    path=temp_in_path, # Just return the original for demo
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
                
            elif conversion_type == "jpg-to-pdf" or conversion_type == "png-to-pdf":
                output_path = Path(temp_dir) / f"{Path(file.filename).stem}.pdf"
                image_to_pdf(str(temp_in_path), str(output_path))
                
                return FileResponse(
                    path=output_path, 
                    filename=f"{Path(file.filename).stem}.pdf",
                    media_type="application/pdf"
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
                
            elif conversion_type == "pdf-ocr":
                # PDF OCR
                text = ocr_pdf(str(temp_in_path))
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
            
            elif conversion_type == "pdf-protect":
                # Protect PDF
                if not password:
                    raise HTTPException(status_code=400, detail="Password is required for PDF protection")
                
                output_path = Path(temp_dir) / f"{Path(file.filename).stem}-protected.pdf"
                protect_pdf(str(temp_in_path), str(output_path), password)
                
                return FileResponse(
                    path=output_path, 
                    filename=f"{Path(file.filename).stem}-protected.pdf",
                    media_type="application/pdf"
                )
            
            elif conversion_type == "pdf-unlock":
                # Unlock PDF
                if not password:
                    raise HTTPException(status_code=400, detail="Password is required to unlock PDF")
                
                output_path = Path(temp_dir) / f"{Path(file.filename).stem}-unlocked.pdf"
                unlock_pdf(str(temp_in_path), str(output_path), password)
                
                return FileResponse(
                    path=output_path, 
                    filename=f"{Path(file.filename).stem}-unlocked.pdf",
                    media_type="application/pdf"
                )
            
            elif conversion_type == "split-pdf":
                # Split PDF
                if not split_ranges:
                    raise HTTPException(status_code=400, detail="Split ranges are required")
                
                output_dir = Path(temp_dir) / "split"
                output_paths = split_pdf(str(temp_in_path), str(output_dir), split_ranges)
                
                # For demo, we'll just return the first split file
                if output_paths:
                    return FileResponse(
                        path=output_paths[0], 
                        filename=f"{Path(file.filename).stem}-split.pdf",
                        media_type="application/pdf"
                    )
                else:
                    raise HTTPException(status_code=500, detail="Failed to split PDF")
            
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported conversion type: {conversion_type}")
    
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.error(f"Error cleaning up: {e}")

@app.get("/")
def read_root():
    """API health check endpoint"""
    return {"status": "OK", "message": "Smart Study Tool API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
