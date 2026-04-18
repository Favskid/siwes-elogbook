/**
 * ErrorAlert Component - Displays user-friendly error messages
 */

import React from 'react';

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export default function ErrorAlert({ message, onDismiss, variant = 'error' }: ErrorAlertProps) {
  const bgColor = variant === 'error' ? 'bg-red-50' : variant === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';
  const borderColor = variant === 'error' ? 'border-red-200' : variant === 'warning' ? 'border-yellow-200' : 'border-blue-200';
  const textColor = variant === 'error' ? 'text-red-900' : variant === 'warning' ? 'text-yellow-900' : 'text-blue-900';
  const iconBg = variant === 'error' ? 'bg-red-100' : variant === 'warning' ? 'bg-yellow-100' : 'bg-blue-100';
  const iconColor = variant === 'error' ? 'text-red-600' : variant === 'warning' ? 'text-yellow-600' : 'text-blue-600';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <div className={`${iconBg} rounded-full p-2 flex-shrink-0 mt-0.5`}>
          {variant === 'error' && (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {variant === 'warning' && (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {variant === 'info' && (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`${textColor} text-sm leading-relaxed whitespace-pre-line`}>
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity text-lg leading-none`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
