'use client';

import { useRef, useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null); // 👈 preview content

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedTypes = ['application/pdf', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  const validateFile = (selectedFile: File) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      return 'Only .pdf and .txt files are allowed.';
    }
    if (selectedFile.size > maxSize) {
      return 'File size must be less than 10 MB.';
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const selectedFile = event.target.files[0];
      const validationError = validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        setPreviewContent(null);
      } else {
        setError(null);
        setFile(selectedFile);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      const droppedFile = event.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        setPreviewContent(null);
      } else {
        setError(null);
        setFile(droppedFile);
      }

      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a valid file first!');
      return;
    }

    setProgress(0);
    setError(null);
    setIsUploading(true);
    setPreviewContent(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded! * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      setPreviewContent(res.data.content || 'No content extracted');
      setFile(null);
      setProgress(0);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}
    >
      <h3>Upload a File</h3>

      <div
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: '2px dashed #888',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
          cursor: 'pointer',
          marginBottom: '1rem',
          color: '#000',
          margin: '1rem',
        }}
      >
        {file ? (
          <p>Selected File: {file.name}</p>
        ) : (
          <p>Drag & Drop a file (max 10MB), or click below to choose</p>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'red' }}>{error}</p>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {progress > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <div
            style={{
              height: '20px',
              width: '100%',
              backgroundColor: '#eee',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#4caf50',
                textAlign: 'center',
                color: '#fff',
                transition: 'width 0.3s ease',
              }}
            >
              {progress}%
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".pdf,.txt"
      />

      <button
        onClick={openFilePicker}
        style={{ marginRight: '1rem' }}
        disabled={isUploading}
      >
        Choose File
      </button>

      <button onClick={handleUpload} disabled={!file || isUploading}>
        Upload
      </button>

      {previewContent && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            maxHeight: '300px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap', // preserve formatting
          }}
        >
          <h4>Content Preview:</h4>
          <p>{previewContent}</p>
        </div>
      )}
    </div>
  );
}
