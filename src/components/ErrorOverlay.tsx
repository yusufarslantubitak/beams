import React from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleX, RefreshCw } from 'lucide-react';

interface ErrorOverlayProps {
  error: string;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className='fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl'>
      <Alert variant='destructive' className='shadow-lg border-red-200 bg-red-50 ring-1 ring-red-100'>
        <CircleX className='w-5 h-5' />
        <AlertTitle className='font-semibold'>
          Data Loading Error
        </AlertTitle>
        <AlertDescription className='text-red-800'>
          {error}
        </AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='xs'
            onClick={() => window.location.reload()}
            className='bg-red-100 hover:bg-red-200 text-red-900 border-red-200'
          >
            <RefreshCw className='w-3 h-3' />
            Retry
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
};
