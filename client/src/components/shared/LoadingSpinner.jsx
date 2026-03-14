import { Package } from 'lucide-react';

export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 ${className}`}>
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-5 w-5 text-primary/50 animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4 font-medium">Loading...</p>
    </div>
  );
}
