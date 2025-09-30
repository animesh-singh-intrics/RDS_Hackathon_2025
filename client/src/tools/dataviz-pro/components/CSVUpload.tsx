import React, { useCallback, useState } from 'react';
import type { UploadState, CSVError } from '../types/index.js';

interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  uploadState: UploadState;
  maxFileSize?: number; // In bytes
}

/**
 * CSV Upload Component with drag-and-drop functionality
 * Handles file validation, progress indication, and error states
 */
export const CSVUpload: React.FC<CSVUploadProps> = ({ 
  onFileSelect, 
  uploadState,
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [dragOver, setDragOver] = useState(false);

  // Validate file before processing
  const validateFile = useCallback((file: File): CSVError | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return 'file-too-large';
    }

    // Check file type/extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return 'invalid-format';
    }

    // Check if file has content
    if (file.size === 0) {
      return 'no-data';
    }

    return null;
  }, [maxFileSize]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      // Handle validation error - could emit error event or show inline error
      console.error('File validation failed:', error);
      return;
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(f => f.name.toLowerCase().endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelect(csvFile);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get error message for display
  const getErrorMessage = (error: CSVError): string => {
    switch (error) {
      case 'file-too-large':
        return `File is too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
      case 'invalid-format':
        return 'Please select a valid CSV file.';
      case 'no-data':
        return 'The selected file appears to be empty.';
      case 'parsing-failed':
        return 'Unable to parse the CSV file. Please check the file format.';
      default:
        return 'An error occurred while processing the file.';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : uploadState.error 
            ? 'border-red-300 bg-red-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }
          ${uploadState.uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploadState.uploading && document.getElementById('csv-file-input')?.click()}
      >
        {/* Upload Icon */}
        <div className="mb-4">
          {uploadState.uploading ? (
            <div className="animate-spin w-12 h-12 mx-auto text-blue-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : uploadState.error ? (
            <div className="w-12 h-12 mx-auto text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 mx-auto text-slate-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          {uploadState.uploading ? (
            <div>
              <p className="text-lg font-medium text-blue-900">Processing CSV file...</p>
              <p className="text-sm text-blue-600">
                {uploadState.file?.name} ({formatFileSize(uploadState.file?.size || 0)})
              </p>
            </div>
          ) : uploadState.error ? (
            <div>
              <p className="text-lg font-medium text-red-900">Upload Failed</p>
              <p className="text-sm text-red-600">{getErrorMessage(uploadState.error as CSVError)}</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-slate-900">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-slate-600">
                Maximum file size: {formatFileSize(maxFileSize)}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploadState.uploading && uploadState.progress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-blue-600 mt-1">{uploadState.progress}% complete</p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploadState.uploading}
        />
      </div>

      {/* File Requirements */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">
          Supported format: CSV files with headers • Clean tabular data recommended
        </p>
      </div>

      {/* Success State - Show selected file info */}
      {uploadState.file && !uploadState.error && !uploadState.uploading && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 text-green-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-900">{uploadState.file.name}</p>
                <p className="text-sm text-green-600">{formatFileSize(uploadState.file.size)}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Could emit a clear event or handle file removal
                console.log('Remove file');
              }}
              className="text-green-600 hover:text-green-800 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};