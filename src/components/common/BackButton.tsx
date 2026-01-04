'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ href, label = 'Back', className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition ${className}`}
    >
      <span>←</span>
      <span>{label}</span>
    </button>
  );
}
