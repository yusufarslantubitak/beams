import React from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className='absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin' />
        <p className='text-white/80 font-medium animate-pulse'>GeoJSON verisi yükleniyor...</p>
      </div>
    </div>
  );
};
