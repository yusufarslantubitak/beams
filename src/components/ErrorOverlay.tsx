import React from 'react';

interface ErrorOverlayProps {
  error: string;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className='fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl'>
      <div className='px-5 py-4 bg-red-500/20 text-red-100 rounded-2xl shadow-2xl backdrop-blur-xl border border-red-500/30 ring-1 ring-red-500/20'>
        <div className='flex items-start gap-3'>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className='font-bold text-red-300 mb-1'>Veri Yükleme Hatası</h3>
            <p className='text-sm leading-relaxed text-red-200/90'>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className='mt-4 px-4 py-1.5 bg-red-500/40 hover:bg-red-500/60 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border border-red-500/30 active:scale-95'
            >
              Yeniden Dene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
