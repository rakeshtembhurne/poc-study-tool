'use client';

import { useRef, useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setFile(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      setFile(event.dataTransfer.files[0]);
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
      alert('Please select a file first!');
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

      const data = await res.json();
      console.log('Upload success:', data);
      alert(`File uploaded successfully: ${data.filename}`);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed!');
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
          border: '2px solid #888',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
          cursor: 'pointer',
          marginBottom: '1rem',
          color: '#000000ff',
        }}
      >
        {file ? (
          <p>Selected File: {file.name}</p>
        ) : (
          <p>Drag & Drop a file here, or click below to choose</p>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button onClick={openFilePicker} style={{ marginRight: '1rem' }}>
        Choose File
      </button>

      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
