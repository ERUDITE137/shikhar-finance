import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 40 }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="animate-spin rounded-full border-4 border-primary border-t-transparent" 
           style={{ width: size, height: size }}>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
