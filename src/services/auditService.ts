import { RECENT_EDIT_ACTIONS } from '../data/constants';
import { AppSettings, AuditItem, AuditLogEntry } from '../types';
import { getAccountStorageNamespace } from './storage';

const AUDIT_STORAGE_KEY = 'audit-logs';
const getAuditStorageKey = () => `${getAccountStorageNamespace()}${AUDIT_STORAGE_KEY}`;

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(getAuditStorageKey());
    if (!raw) {
      return [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          user: 'PC พนักงานขาย',
          action: 'ระบบเริ่มทำงาน',
          details: 'โหลดฐานข้อมูลแคตตาล็อกและประวัติการขายสำเร็จ',
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logAuditAction(action: string, details: string, user = 'PC พนักงานขาย'): void {
  try {
    const current = getAuditLogs();
    const entry: AuditLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
    };
    const updated = [entry, ...current].slice(0, 300);
    localStorage.setItem(getAuditStorageKey(), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(getAuditStorageKey());
  } catch (err) {
    console.error('Failed to clear audit logs', err);
  }
}

export function addAuditItem(
  settings: AppSettings,
  action: string,
  detail: string,
  flagged = false
): AppSettings {
  const currentLogs = settings.auditLog || [];
  const newItem: AuditItem = {
    time: new Date().toISOString(),
    action,
    detail,
    flagged: !!flagged,
  };
  const updatedLog = [newItem, ...currentLogs].slice(0, 300);
  return {
    ...settings,
    auditLog: updatedLog,
  };
}

export function getRecentEdits(auditLog: AuditItem[] = [], limit = 5): AuditItem[] {
  return auditLog.filter((x) => RECENT_EDIT_ACTIONS.includes(x.action)).slice(0, limit);
}

