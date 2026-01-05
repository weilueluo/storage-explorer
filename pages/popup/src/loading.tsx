import type React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingComponent: React.FC = () => {
  return (
    <div className="flex flex-row gap-2 grow items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading...</span>
    </div>
  );
};

export default LoadingComponent;
