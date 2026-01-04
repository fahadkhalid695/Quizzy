'use client';

import { NotificationProvider } from '@/components/common/Notification';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotificationProvider />
      {children}
    </>
  );
}
