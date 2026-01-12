
import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Simple seeded random for consistent 'random' visuals if needed
export function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
