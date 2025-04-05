import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`
      fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
      animate-slideIn transition-all duration-200
      ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
        'bg-red-50 text-red-800 border border-red-200'}
    `}>
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600" />
      )}
      <p className="text-sm">{message}</p>
      <button 
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};