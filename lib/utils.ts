import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if user is authenticated via localStorage
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('bowling_auth') === 'true';
}

/**
 * Set authentication state in localStorage
 */
export function setAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem('bowling_auth', 'true');
  } else {
    localStorage.removeItem('bowling_auth');
  }
}

/**
 * Clear authentication from localStorage
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bowling_auth');
}
