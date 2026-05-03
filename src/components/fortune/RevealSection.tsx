"use client";

export interface RevealSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function RevealSection({ children, delay = 0, className = "" }: RevealSectionProps) {
  return (
    <div
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
