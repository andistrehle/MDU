import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  padding?: number;
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, padding = 18, hover = false, className, style }: CardProps) {
  return (
    <div
      className={cn('mdu-card', hover && 'mdu-card-hover', className)}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}
