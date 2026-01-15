import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MAX_FILE_SIZE } from '../../constants';

interface FileUploadProps {
  value?: string;
  onChange: (url: string, file?: File) => void;
  onRemove: () => void;
  accept?: string;
  maxSize?: number;
  isUploading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  onRemove,
  accept = "image/*",
  maxSize = MAX_FILE_SIZE,
  isUploading = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevValueRef = useRef<string | undefined>();

  useEffect(() => {
    const current = value;
    const previous = prevValueRef.current;
    if (previous && previous.startsWith('blob:') && previous !== current) {
      URL.revokeObjectURL(previous);
    }
    prevValueRef.current = current;
  }, [value]);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`File too large (max ${maxSize / 1024 / 1024}MB)`);
      return false;
    }
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return false;
    }
    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      const previewUrl = URL.createObjectURL(file);
      setImageError(false);
      onChange(previewUrl, file);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative min-h-[256px] bg-neutral-100 rounded-lg overflow-hidden">
          {imageError ? (
            <div className="w-full h-64 flex flex-col items-center justify-center rounded-lg bg-neutral-100">
              <ImageIcon className="w-12 h-12 text-neutral-400 mb-2" />
              <p className="text-sm text-neutral-500">Failed to load image</p>
            </div>
          ) : (
            <img
              src={value}
              alt="Recipe image"
              className="w-full h-64 object-cover rounded-lg"
              onError={handleImageError}
            />
          )}
          <div className="absolute top-0 right-0 p-4 z-10">
            <button
              type="button"
              onClick={onRemove}
              disabled={isUploading}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-4 transition-all disabled:opacity-50 flex items-center justify-center border-2 border-white hover:border-red-400 hover:bg-red-600"
              title="Remove image"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={isUploading}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <p className="text-sm text-neutral-600">Uploading image...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-sm text-neutral-600">
                Click or drag image to upload
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                JPG, PNG, WebP, GIF up to 10MB
              </p>
            </>
          )}
          {error && (
            <p className="text-sm text-error-600 mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
