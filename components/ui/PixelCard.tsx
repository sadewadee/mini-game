
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PixelCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'default' | 'neon' | 'screen';
}

export function PixelCard({ children, className, onClick, variant = 'default' }: PixelCardProps) {
    const variants = {
        default: 'border-4 border-arcade-gray bg-arcade-black shadow-[4px_4px_0px_0px_var(--color-arcade-purple)]',
        neon: 'border-4 border-arcade-pink bg-arcade-black shadow-[0px_0px_10px_var(--color-arcade-pink)]',
        screen: 'border-4 border-arcade-gray bg-black relative overflow-hidden rounded-lg shadow-inner',
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'p-4 transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none',
                variants[variant],
                className
            )}
        >
            {children}
            {variant === 'screen' && <div className="crt-overlay absolute inset-0 content-[''] pointer-events-none z-10" />}
        </div>
    );
}
