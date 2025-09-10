'use client';

import { useRef, useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedTypes = ['application/pdf', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10 MB in bytes

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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await res.json();
      console.log('Upload success:', data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      alert(`File uploaded successfully: ${data.filename}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed!');
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

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".pdf,.txt"
      />

      <button onClick={openFilePicker} style={{ marginRight: '1rem' }}>
        Choose File
      </button>

      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
