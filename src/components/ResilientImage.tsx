import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[var(--c-panel)] via-[var(--c-panel2)] to-[var(--c-fondo)] text-[var(--c-suave)] p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <FileSpreadsheet className="w-8 h-8 text-[var(--c-teal)]/70 mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-center text-[var(--c-suave)] max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
