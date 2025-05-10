import React, { useState, useRef } from 'react';
import './Chat.css';
import SendSharpIcon from '@mui/icons-material/SendSharp';
import AttachFileSharpIcon from '@mui/icons-material/AttachFileSharp';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import axios from 'axios';

interface MessageInputProps {
  onSendMessage: (text: string, fileAttachment?: {
    hasAttachment: boolean;
    attachmentType: 'image' | 'video' | 'file';
    attachmentUrl: string;
    attachmentName: string;
    attachmentSize: number;
  }) => void;
}

interface UploadPreview {
  file: File;
  previewUrl?: string;
  type: 'image' | 'video' | 'file';
  uploading: boolean;
  progress: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<UploadPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to upload a file in chunks
  const uploadInChunks = async (file: File): Promise<any> => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileName = file.name;
    
    // Progress tracking
    let uploadedChunks = 0;
    
    // Function to read a chunk of the file
    const readChunk = (start: number, end: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            // Convert array buffer to base64
            const base64String = btoa(
              // @ts-ignore - we know it's an array buffer
              new Uint8Array(e.target.result)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            resolve(base64String);
          } else {
            reject(new Error('Failed to read file chunk'));
          }
        };
        reader.onerror = () => reject(reader.error);
        
        const chunk = file.slice(start, end);
        reader.readAsArrayBuffer(chunk);
      });
    };
    
    // Send each chunk to the server
    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        
        // Read the chunk
        const chunk = await readChunk(start, end);
        
        // Send the chunk to the server
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/upload-chunked`,
          {
            chunk,
            fileName,
            totalChunks,
            chunkIndex,
            mimeType: file.type,
            totalSize: file.size
          }
        );
        
        // Update progress
        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        setAttachment(prev => prev ? {...prev, progress} : null);
        
        // If this is the last chunk, server will return the complete file info
        if (chunkIndex === totalChunks - 1) {
          return response.data;
        }
      }
    } catch (error) {
      console.error('Chunked upload failed:', error);
      throw error;
    }
  };

  // Function for streaming upload (most efficient for very large files)
  const streamUpload = async (file: File): Promise<any> => {
    try {
      console.log('Using streaming upload for very large file:', file.name);
      
      // Upload the file as a stream
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/stream-upload?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}&fileSize=${file.size}`,
        file,
        {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          timeout: 3600000, // 1 hour timeout for very large files
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setAttachment(prev => prev ? {...prev, progress} : null);
            }
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Streaming upload failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !attachment) return;
    
    // If there's an attachment, upload it first
    if (attachment && !attachment.uploading) {
      try {
        console.log('Uploading attachment:', attachment);
        
        // Set uploading state
        setAttachment(prev => prev ? { ...prev, uploading: true, progress: 0 } : null);
        
        // For very large files, add a warning
        if(attachment.file.size > 30 * 1024 * 1024) {
          alert('Warning: File size is large. Upload may take some time.');
        }
        
        let fileData;
        if (attachment.file.size > 50 * 1024 * 1024) { // Use streaming upload for files larger than 50MB
          console.log('Using streaming upload for very large file');
          const response = await streamUpload(attachment.file);
          fileData = response.file;
        } else if (attachment.file.size > 15 * 1024 * 1024) { // Use chunked upload for files larger than 15MB
          console.log('Using chunked upload for large file');
          const response = await uploadInChunks(attachment.file);
          fileData = response.file;
        } else {
          const formData = new FormData();
          formData.append('file', attachment.file);
          
          console.log('Sending file to server:', attachment.file.name, attachment.file.type, 'Size:', (attachment.file.size / (1024 * 1024)).toFixed(2) + 'MB');
          
          const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 300000, // 5 minute timeout for large files
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setAttachment(prev => prev ? {...prev, progress} : null);
              }
            }
          });
          
          fileData = response.data.file;
        }
        
        if (fileData) {
          // Send the message with the file attachment
          onSendMessage(message, {
            hasAttachment: true,
            attachmentType: fileData.attachmentType,
            attachmentUrl: fileData.attachmentUrl,
            attachmentName: fileData.attachmentName,
            attachmentSize: fileData.attachmentSize
          });
          
          // Clear form
          setMessage('');
          setAttachment(null);
        }
      } catch (error: any) {
        console.error('Error uploading file:', error);
        
        // Reset uploading state
        setAttachment(prev => prev ? { ...prev, uploading: false } : null);
        
        // More detailed error message
        if (error.code === 'ECONNABORTED') {
          alert('Upload timed out. Please try with a smaller file or check your connection.');
        } else if (error.response && error.response.status === 413) {
          alert('File is too large. Maximum file size is 50MB.');
        } else {
          alert(`Failed to upload file: ${error.message || 'Unknown error'}`);
        }
      }
    } else if (message.trim()) {
      // Just send text message if there's no attachment
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let type: 'image' | 'video' | 'file' = 'file';
      let previewUrl;
      
      console.log('Selected file:', file.name, file.type, 'Size:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
      
      // Determine file type
      if (file.type.startsWith('image/')) {
        type = 'image';
        previewUrl = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/') || 
                file.name.toLowerCase().endsWith('.mp4') || 
                file.name.toLowerCase().endsWith('.mov') || 
                file.name.toLowerCase().endsWith('.avi') || 
                file.name.toLowerCase().endsWith('.wmv') ||
                file.name.toLowerCase().endsWith('.webm')) {
        type = 'video';
        previewUrl = URL.createObjectURL(file);
      }
      
      // Warn about large files before they're sent
      if (file.size > 50 * 1024 * 1024) {
        alert('Warning: Files larger than 50MB may fail to upload.');
      }
      
      setAttachment({
        file,
        previewUrl,
        type,
        uploading: false,
        progress: 0
      });
      
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const renderUploadProgressBar = () => {
    if (!attachment?.uploading) return null;
    
    const getUploadTypeText = () => {
      if (attachment.file.size > 40 * 1024 * 1024) {
        return 'Streaming upload';
      } else if (attachment.file.size > 15 * 1024 * 1024) {
        return 'Chunked upload';
      } else {
        return 'Uploading';
      }
    };
    
    return (
      <div className="upload-progress">
        <div 
          className="upload-progress-bar" 
          style={{ width: `${attachment.progress}%` }}
        ></div>
        <div className="upload-progress-text">
          {getUploadTypeText()}: {attachment.progress}%
        </div>
      </div>
    );
  };

  // Render attachment preview
  const renderAttachmentPreview = () => {
    if (!attachment) return null;
    
    return (
      <div className="attachment-preview">
        <div className="attachment-preview-header">
          <span>Attachment</span>
          <button 
            type="button" 
            className="remove-attachment-btn"
            onClick={handleRemoveAttachment}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>
        
        <div className="attachment-preview-content">
          {attachment.type === 'image' && attachment.previewUrl && (
            <img src={attachment.previewUrl} alt="Preview" className="attachment-preview-image" />
          )}
          
          {attachment.type === 'video' && attachment.previewUrl && (
            <video 
              src={attachment.previewUrl} 
              controls 
              className="attachment-preview-video"
            ></video>
          )}
          
          {attachment.type === 'file' && (
            <div className="attachment-preview-file">
              <InsertDriveFileIcon className="preview-file-icon" />
              <span className="preview-file-name">{attachment.file.name}</span>
              <span className="preview-file-size">{formatFileSize(attachment.file.size)}</span>
            </div>
          )}
        </div>
        
        {renderUploadProgressBar()}
      </div>
    );
  };

  return (
    <>
      {renderAttachmentPreview()}
      <form className="message-input-container" onSubmit={handleSubmit}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip"
        />
        <div className="attachment-button" onClick={triggerFileInput}>
          <AttachFileSharpIcon fontSize="small" />
        </div>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button 
          type="submit" 
          className="send-button" 
          disabled={(!message.trim() && !attachment) || (attachment?.uploading)}
        >
          <SendSharpIcon fontSize="small" />
        </button>
      </form>
    </>
  );
};

export default MessageInput;