
/**
 * File utilities for format detection and compression
 */

// Format detection based on file extensions
export const detectFileFormat = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch(extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'ppt':
    case 'pptx':
      return 'powerpoint';
    case 'jpg':
    case 'jpeg':
      return 'jpg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'txt':
      return 'text';
    default:
      return 'unknown';
  }
};

// Get available conversion options based on detected format
export const getConversionOptions = (fileFormat: string): { value: string, label: string }[] => {
  switch(fileFormat) {
    case 'pdf':
      return [
        { value: 'pdf-to-docx', label: 'Convert to Word' },
        { value: 'pdf-to-xlsx', label: 'Convert to Excel' },
        { value: 'pdf-to-pptx', label: 'Convert to PowerPoint' },
        { value: 'pdf-to-jpg', label: 'Convert to JPG' },
        { value: 'pdf-to-text', label: 'Extract Text' },
        { value: 'pdf-compress', label: 'Compress PDF' },
        { value: 'pdf-protect', label: 'Protect PDF' },
        { value: 'pdf-unlock', label: 'Unlock PDF' },
        { value: 'pdf-ocr', label: 'OCR (Text Recognition)' }
      ];
    case 'word':
      return [
        { value: 'docx-to-pdf', label: 'Convert to PDF' }
      ];
    case 'excel':
      return [
        { value: 'xlsx-to-pdf', label: 'Convert to PDF' }
      ];
    case 'powerpoint':
      return [
        { value: 'pptx-to-pdf', label: 'Convert to PDF' }
      ];
    case 'jpg':
      return [
        { value: 'jpg-to-png', label: 'Convert to PNG' },
        { value: 'jpg-to-pdf', label: 'Convert to PDF' },
        { value: 'image-to-text', label: 'Extract Text (OCR)' },
        { value: 'image-compress', label: 'Compress Image' }
      ];
    case 'png':
      return [
        { value: 'png-to-jpg', label: 'Convert to JPG' },
        { value: 'png-to-pdf', label: 'Convert to PDF' },
        { value: 'image-to-text', label: 'Extract Text (OCR)' },
        { value: 'image-compress', label: 'Compress Image' }
      ];
    case 'gif':
      return [
        { value: 'image-to-text', label: 'Extract Text (OCR)' }
      ];
    default:
      return [];
  }
};

// Format file size to readable string
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Get batch processing options
export const getBatchProcessingOptions = (fileFormat: string): { value: string, label: string }[] => {
  switch(fileFormat) {
    case 'pdf':
      return [
        { value: 'merge-pdfs', label: 'Merge PDFs' },
        { value: 'split-pdf', label: 'Split PDF' },
        { value: 'batch-compress', label: 'Compress Multiple PDFs' }
      ];
    case 'jpg':
    case 'png':
    case 'gif':
      return [
        { value: 'batch-compress-images', label: 'Compress Multiple Images' },
        { value: 'batch-convert-to-pdf', label: 'Convert Multiple to PDF' }
      ];
    default:
      return [];
  }
};
