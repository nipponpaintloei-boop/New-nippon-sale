import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-4 py-2.5 text-xs font-semibold shadow-xl backdrop-blur-md border border-amber-400/40 animate-bounce"
    >
      <div className="p-1 rounded-lg bg-amber-700/80">
        <WifiOff className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-bold">โหมดออฟไลน์ (Offline Mode)</p>
        <p className="text-[10px] text-amber-100 font-normal">กำลังใช้งานข้อมูลแคชในเครื่อง สามารถบันทึกงานต่อได้</p>
      </div>
    </div>
  );
};
