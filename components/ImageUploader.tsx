import React, { useRef, useState } from 'react';
import { Upload, Loader2, Camera, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  return (
    <div 
      className={`relative flex flex-col items-center justify-center w-full h-full min-h-[400px] md:min-h-[500px] border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer
        ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:bg-gray-50'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={onUploadClick}
    >
      {/* Standard File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={isLoading}
      />

      {/* Camera Input (Mobile Rear Camera) */}
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={isLoading}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-4 animate-pulse p-8">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium text-lg">Analyzing receipt with Gemini AI...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md w-full">
          <div className="p-5 bg-indigo-100 rounded-full text-indigo-600 transform transition-transform group-hover:scale-110">
            <Upload className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-800">Upload your receipt</h3>
            <p className="text-gray-500 text-lg">
              Drag and drop, snap a photo, or browse files.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <button
              onClick={onCameraClick}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all focus:ring-4 focus:ring-indigo-100"
            >
              <Camera className="w-5 h-5" />
              <span>Camera</span>
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); onUploadClick(); }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 text-lg font-medium rounded-xl hover:bg-indigo-50 transition-colors focus:ring-4 focus:ring-indigo-100"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Gallery</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};