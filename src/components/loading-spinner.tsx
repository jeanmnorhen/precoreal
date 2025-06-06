import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Loader2
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`animate-spin text-primary ${className}`}
    />
  );
}
