import React, { useState, useEffect } from 'react';
import { FileText, Trash2, X, Clock, User, ShieldCheck } from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { getAuditLogs, clearAuditLogs } from '../../services/auditService';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(getAuditLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (confirm('คุณต้องการล้างประวัติกิจกรรมทั้งหมดใช่หรือไม่?')) {
      clearAuditLogs();
      setLogs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                บันทึกประวัติกิจกรรม (Audit Trail)
              </h3>
              <p className="text-xs text-slate-400">บันทึกการเพิ่ม แก้ไข ลบ และนำเข้าข้อมูล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold uppercase text-[10px]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">{log.details}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400 flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleString('th-TH')}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <User className="w-3 h-3" />
                    <span>{log.user || 'PC พนักงานขาย'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              ยังไม่มีบันทึกกิจกรรมในระบบ
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างบันทึก</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
