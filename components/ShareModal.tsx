import React from 'react';
import QRCode from 'react-qr-code';
import { X, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  
  if (!isOpen) return null;

  const url = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Share App</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <QRCode 
              value={url} 
              size={200}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
          
          <div className="text-center space-y-1">
            <p className="font-semibold text-gray-900">Scan to open splitbills.online</p>
            <p className="text-sm text-gray-500 px-4">
              Restaurant customers can scan this code to start splitting their bill immediately.
            </p>
          </div>

          <div className="w-full flex gap-2">
            <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 truncate">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[44px]"
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
