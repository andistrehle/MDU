'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:opacity-90 active:opacity-80 font-semibold',
  secondary: 'bg-brand-soft text-brand-ink hover:bg-brand-soft/80 font-semibold',
  ghost: 'bg-transparent text-body hover:bg-inset',
  danger: 'bg-danger-soft text-danger hover:bg-danger-soft/80 font-semibold',
  outline: 'border border-line bg-card text-ink hover:bg-card2',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-13 px-6 text-base rounded-2xl',
  icon: 'h-11 w-11 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
