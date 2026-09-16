/**
 * Service for Auto-syncing Nippon Paint Sales and Stock data to Google Sheets
 * Uses Google Identity Services (GIS) Token Client and Google Sheets API v4
 */

import { Product, SaleEntry } from '../types';
import { getSavedGoogleProfile, getGoogleClientId } from './auth';

export interface GoogleSheetsConfig {
  clientId: string;
  spreadsheetId: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
  autoSyncEnabled: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastErrorMessage?: string;
}

export interface SyncToastEvent {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

function accountKey(key: string): string {
  const profile = getSavedGoogleProfile();
  const identity = profile?.sub || profile?.email?.trim().toLowerCase();
  const safe = identity ? encodeURIComponent(identity).replace(/%/g, '_') : 'anonymous';
  return `${key}:account:${safe}`;
}

const STORAGE_KEYS = {
  CLIENT_ID: 'nippon_google_oauth_client_id',
  SPREADSHEET_ID: 'nippon_google_spreadsheet_id',
  SPREADSHEET_NAME: 'nippon_google_spreadsheet_name',
  SPREADSHEET_URL: 'nippon_google_spreadsheet_url',
  AUTO_SYNC: 'nippon_google_auto_sync',
  LAST_SYNC_TIME: 'nippon_google_last_sync_time',
  LAST_SYNC_STATUS: 'nippon_google_last_sync_status',
  SESSION_ACCESS_TOKEN: 'nippon_google_access_token',
  SESSION_TOKEN_EXPIRY: 'nippon_google_token_expiry',
};

// In-memory token management
let inMemoryAccessToken: string | null = null;
let inMemoryTokenExpiresAt = 0;
let needsReconnectFlag = false;
let gisTokenClient: any = null;
let debounceTimer: any = null;
let hasShownSuccessToastInSession = false;
let silentRefreshPromise: Promise<boolean> | null = null;
let autoRefreshTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const MIN_AUTO_REFRESH_DELAY_MS = 30 * 1000;

// Toast event subscribers
type ToastListener = (toast: SyncToastEvent) => void;
const toastListeners: Set<ToastListener> = new Set();

export function subscribeToSyncToasts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function emitSyncToast(toast: Omit<SyncToastEvent, 'id' | 'timestamp'>) {
  const event: SyncToastEvent = {
    ...toast,
    id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
  };
  toastListeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error('Toast listener error:', e);
    }
  });
}

// Load token from sessionStorage on startup
try {
  const savedToken = sessionStorage.getItem(STORAGE_KEYS.SESSION_ACCESS_TOKEN);
  const savedExp = Number(sessionStorage.getItem(STORAGE_KEYS.SESSION_TOKEN_EXPIRY)) || 0;
  if (savedToken && savedExp > Date.now()) {
    inMemoryAccessToken = savedToken;
    inMemoryTokenExpiresAt = savedExp;
  }
} catch {
  // Ignore storage errors
}

// Schedule renewal when a valid token was restored from the current browser session.
if (inMemoryAccessToken) {
  scheduleAutoRefresh();
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  let clientId = '';
  let spreadsheetId = '';
  let spreadsheetName = '';
  let spreadsheetUrl = '';
  let autoSyncEnabled = true;
  let lastSyncTime: string | undefined;
  let lastSyncStatus: 'success' | 'error' | 'idle' = 'idle';

  try {
    clientId = getGoogleClientId();
    spreadsheetId = localStorage.getItem(accountKey(STORAGE_KEYS.SPREADSHEET_ID)) || '';
    spreadsheetName = localStorage.getItem(accountKey(STORAGE_KEYS.SPREADSHEET_NAME)) || '';
    spreadsheetUrl = localStorage.getItem(accountKey(STORAGE_KEYS.SPREADSHEET_URL)) || '';
    const savedClientId = localStorage.getItem(accountKey(STORAGE_KEYS.CLIENT_ID));
    if (savedClientId) clientId = savedClientId;
    const autoSyncVal = localStorage.getItem(accountKey(STORAGE_KEYS.AUTO_SYNC));
    autoSyncEnabled = autoSyncVal !== null ? autoSyncVal === 'true' : true;
    lastSyncTime = localStorage.getItem(accountKey(STORAGE_KEYS.LAST_SYNC_TIME)) || undefined;
    const statusVal = localStorage.getItem(accountKey(STORAGE_KEYS.LAST_SYNC_STATUS));
    if (statusVal === 'success' || statusVal === 'error') {
      lastSyncStatus = statusVal;
    }
  } catch {
    // Ignore storage errors
  }

  return {
    clientId,
    spreadsheetId,
    spreadsheetName,
    spreadsheetUrl,
    autoSyncEnabled,
    lastSyncTime,
    lastSyncStatus,
  };
}

export function saveGoogleSheetsConfig(patch: Partial<GoogleSheetsConfig>): void {
  try {
    if (patch.clientId !== undefined && patch.clientId.trim()) {
      localStorage.setItem(accountKey(STORAGE_KEYS.CLIENT_ID), patch.clientId.trim());
    }
    if (patch.spreadsheetId !== undefined) {
      localStorage.setItem(accountKey(STORAGE_KEYS.SPREADSHEET_ID), patch.spreadsheetId.trim());
    }
    if (patch.spreadsheetName !== undefined) {
      localStorage.setItem(accountKey(STORAGE_KEYS.SPREADSHEET_NAME), patch.spreadsheetName);
    }
    if (patch.spreadsheetUrl !== undefined) {
      localStorage.setItem(accountKey(STORAGE_KEYS.SPREADSHEET_URL), patch.spreadsheetUrl);
    }
    if (patch.autoSyncEnabled !== undefined) {
      localStorage.setItem(accountKey(STORAGE_KEYS.AUTO_SYNC), String(patch.autoSyncEnabled));
    }
    if (patch.lastSyncTime !== undefined) {
      localStorage.setItem(accountKey(STORAGE_KEYS.LAST_SYNC_TIME), patch.lastSyncTime);
    }
    if (patch.lastSyncStatus !== undefined) {
      localStorage.setItem(accountKey(STORAGE_KEYS.LAST_SYNC_STATUS), patch.lastSyncStatus);
    }
  } catch (e) {
    console.error('Failed to save Google Sheets config to localStorage:', e);
  }
}

function clearAutoRefreshTimer(): void {
  if (autoRefreshTimer) {
    clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function scheduleAutoRefresh(): void {
  clearAutoRefreshTimer();

  if (!inMemoryAccessToken || !inMemoryTokenExpiresAt) return;

  const config = getGoogleSheetsConfig();
  if (!config.clientId) return;

  // Refresh a few minutes before expiry so normal API calls never have to wait
  // for the token renewal. This is best-effort and does not open a popup.
  const delay = Math.max(
    MIN_AUTO_REFRESH_DELAY_MS,
    inMemoryTokenExpiresAt - Date.now() - AUTO_REFRESH_BUFFER_MS
  );

  autoRefreshTimer = setTimeout(() => {
    autoRefreshTimer = null;
    void refreshGoogleTokenSilently();
  }, delay);
}

export function setAccessToken(token: string, expiresInSec: number): void {
  inMemoryAccessToken = token;
  // Keep a small safety margin because Google API calls can start just before
  // the exact expiry time. Never allow a negative/zero expiry window.
  const safeExpiresInSec = Math.max(60, Number(expiresInSec) || 3599);
  inMemoryTokenExpiresAt = Date.now() + Math.max(60, safeExpiresInSec - 60) * 1000;
  needsReconnectFlag = false;

  try {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ACCESS_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN_EXPIRY, String(inMemoryTokenExpiresAt));
  } catch {
    // Ignore
  }

  scheduleAutoRefresh();
}

export function clearAccessToken(): void {
  clearAutoRefreshTimer();
  inMemoryAccessToken = null;
  inMemoryTokenExpiresAt = 0;
  needsReconnectFlag = true;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN_EXPIRY);
  } catch {
    // Ignore
  }
}

export function getConnectionStatus(): 'connected' | 'expired' | 'needs_reconnect' | 'disconnected' {
  const config = getGoogleSheetsConfig();
  if (!config.clientId || !config.spreadsheetId) {
    return 'disconnected';
  }
  if (needsReconnectFlag) {
    return 'needs_reconnect';
  }
  if (!inMemoryAccessToken) {
    return 'expired';
  }
  if (Date.now() >= inMemoryTokenExpiresAt) {
    return 'expired';
  }
  return 'connected';
}

/**
 * Ensures Google Identity Services (GIS) client library is loaded
 */
export async function loadGsiScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).google?.accounts?.oauth2) {
    return true;
  }

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!(window as any).google?.accounts?.oauth2), 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Ensures the Google API JS client is loaded for Google Picker.
 */
async function loadGoogleApiScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).gapi?.load) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="apis.google.com/js/api.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(!!(window as any).gapi?.load));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!(window as any).gapi?.load), 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(!!(window as any).gapi?.load);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Opens the Google Drive Picker restricted to Google Sheets.
 * The selected file ID/name are returned so the existing Sheets sync flow can
 * continue using the same spreadsheetId storage and verification logic.
 */
export async function pickGoogleSpreadsheet(): Promise<{
  success: boolean;
  spreadsheetId?: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
  error?: string;
}> {
  const token = await getValidAccessToken();
  if (!token) {
    return { success: false, error: 'กรุณาเชื่อมต่อ Google ก่อนเลือก Spreadsheet' };
  }

  // Google Picker configuration.
  // Environment variables can override these defaults for another deployment.
  // The API key is intentionally restricted in Google Cloud to the Picker/Drive APIs.
  const apiKey = String((import.meta as any).env?.VITE_GOOGLE_API_KEY || '').trim();
  const appId = String((import.meta as any).env?.VITE_GOOGLE_APP_ID || '').trim();

  if (!apiKey || !appId) {
    return {
      success: false,
      error: 'ยังไม่ได้ตั้งค่า Google Picker API Key / App ID ในระบบ (VITE_GOOGLE_API_KEY และ VITE_GOOGLE_APP_ID)',
    };
  }

  const apiLoaded = await loadGoogleApiScript();
  if (!apiLoaded) {
    return { success: false, error: 'ไม่สามารถโหลด Google API Client ได้ กรุณาลองใหม่อีกครั้ง' };
  }

  return new Promise((resolve) => {
    try {
      (window as any).gapi.load('picker', () => {
        const googleApi = (window as any).google;
        const pickerApi = googleApi?.picker;

        if (!pickerApi?.PickerBuilder) {
          resolve({ success: false, error: 'ไม่สามารถโหลด Google Picker ได้ กรุณาลองใหม่อีกครั้ง' });
          return;
        }

        const view = new pickerApi.DocsView(pickerApi.ViewId.SPREADSHEETS)
          .setIncludeFolders(false)
          .setSelectFolderEnabled(false);

        const picker = new pickerApi.PickerBuilder()
          .addView(view)
          .setOAuthToken(token)
          .setDeveloperKey(apiKey)
          .setAppId(appId)
          .setOrigin(window.location.origin)
          .setCallback((data: any) => {
            if (data.action === pickerApi.Action.PICKED) {
              const doc = data.docs?.[0];
              const id = doc?.[pickerApi.Document.ID] || doc?.id;
              const name = doc?.[pickerApi.Document.NAME] || doc?.name || 'Google Spreadsheet';
              const url = doc?.[pickerApi.Document.URL] || doc?.url || `https://docs.google.com/spreadsheets/d/${id}/edit`;

              if (!id) {
                resolve({ success: false, error: 'ไม่พบ Spreadsheet ID จากไฟล์ที่เลือก' });
                return;
              }

              resolve({
                success: true,
                spreadsheetId: id,
                spreadsheetName: name,
                spreadsheetUrl: url,
              });
            } else if (data.action === pickerApi.Action.CANCEL) {
              resolve({ success: false, error: 'ยกเลิกการเลือก Spreadsheet' });
            }
          })
          .build();

        picker.setVisible(true);
      });
    } catch (err: any) {
      console.error('Google Picker error:', err);
      resolve({ success: false, error: err?.message || 'ไม่สามารถเปิดตัวเลือก Google Sheets ได้' });
    }
  });
}

/**
 * Fetches Google User Profile using Access Token
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
} | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      email: data.email || '',
      name: data.name || data.given_name || '',
      picture: data.picture || '',
      sub: data.sub || '',
    };
  } catch (e) {
    console.error('Failed to fetch Google user profile:', e);
    return null;
  }
}

/**
 * Requests Google OAuth token with user interaction popup
 */
export async function loginWithGoogleSheets(clientId: string): Promise<{
  success: boolean;
  error?: string;
  user?: { email: string; name?: string; picture?: string };
}> {
  if (!clientId || !clientId.trim()) {
    return { success: false, error: 'กรุณากรอก Google OAuth Client ID' };
  }

  const loaded = await loadGsiScript();
  if (!loaded || !(window as any).google?.accounts?.oauth2) {
    return { success: false, error: 'ไม่สามารถโหลด Google Identity Services (GSI) ได้ กรุณาลองใหม่อีกครั้ง' };
  }

  return new Promise((resolve) => {
    try {
      gisTokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        prompt: 'consent',
        callback: async (response: any) => {
          if (response.error) {
            console.error('GIS Error:', response);
            resolve({ success: false, error: response.error_description || response.error });
            return;
          }
          if (response.access_token) {
            const expiresIn = Number(response.expires_in) || 3599;
            setAccessToken(response.access_token, expiresIn);
            saveGoogleSheetsConfig({ clientId: clientId.trim() });

            // Fetch user info for seamless login & profile
            const profile = await fetchGoogleUserProfile(response.access_token);
            if (profile) {
              try {
                localStorage.setItem('nippon_user_google_profile', JSON.stringify(profile));
              } catch {}
            }

            resolve({ success: true, user: profile || undefined });
          } else {
            resolve({ success: false, error: 'ไม่ได้รับ Access Token จาก Google' });
          }
        },
        error_callback: (err: any) => {
          // err format: { type: 'popup_closed', message: 'Popup window closed' }
          const errType = err?.type || '';
          const errMsg = err?.message || '';

          if (errType === 'popup_closed' || errMsg.includes('Popup window closed') || errMsg.includes('popup_closed')) {
            console.warn('Google Login popup was closed by user or blocked by browser.');
            resolve({
              success: false,
              error: 'หน้าต่างป๊อปอัป Google ถูกปิด หรือถูกเบราว์เซอร์บล็อก (หากอยู่ในหน้าพรีวิว กรุณากดเปิดแอพในแท็บใหม่ หรืออนุญาตหน้าต่างป๊อปอัปในเบราว์เซอร์)',
            });
            return;
          }

          if (errType === 'popup_failed_to_open') {
            resolve({
              success: false,
              error: 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณากดอนุญาตป๊อปอัป หรือเปิดแอพในแท็บใหม่',
            });
            return;
          }

          console.error('GIS Non-OAuth error:', err);
          resolve({ success: false, error: errMsg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google' });
        },
      });

      gisTokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      console.error('Failed to init GIS Token Client:', err);
      resolve({ success: false, error: err.message || 'ไม่สามารถเปิดหน้าต่างเข้าสู่ระบบ Google ได้' });
    }
  });
}

/**
 * Attempts silent token refresh via GIS (prompt: 'none') without interrupting the user
 */
async function trySilentTokenRefresh(clientId: string): Promise<boolean> {
  if (!clientId) return false;
  const loaded = await loadGsiScript();
  if (!loaded || !(window as any).google?.accounts?.oauth2) return false;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      const silentClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        // Keep this scope identical to the Sheets API permission requested at login.
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        prompt: 'none',
        callback: (response: any) => {
          if (response && response.access_token) {
            const expiresIn = Number(response.expires_in) || 3599;
            setAccessToken(response.access_token, expiresIn);
            finish(true);
          } else {
            finish(false);
          }
        },
        error_callback: (err: any) => {
          // Silent renewal is intentionally quiet. If Google cannot renew without
          // user interaction, the caller will mark the connection as needing login.
          console.warn('Silent Google token refresh unavailable:', err?.type || err?.error || 'unknown');
          finish(false);
        },
      });
      silentClient.requestAccessToken({ prompt: 'none' });
    } catch (err) {
      console.warn('Silent Google token refresh failed:', err);
      finish(false);
    }
  });
}

async function refreshGoogleTokenSilently(): Promise<boolean> {
  if (silentRefreshPromise) return silentRefreshPromise;

  const config = getGoogleSheetsConfig();
  if (!config.clientId) return false;

  silentRefreshPromise = trySilentTokenRefresh(config.clientId)
    .finally(() => {
      silentRefreshPromise = null;
    });

  return silentRefreshPromise;
}

/**
 * Obtains valid access token, refreshing silently if close to expiry
 */
export async function getValidAccessToken(): Promise<string | null> {
  const config = getGoogleSheetsConfig();
  if (!config.clientId) return null;

  // Check if current token is still valid (more than 30s remaining)
  if (inMemoryAccessToken && Date.now() < inMemoryTokenExpiresAt - 30000) {
    return inMemoryAccessToken;
  }

  // Token is expired or expiring soon, try silent refresh. A shared promise
  // prevents several simultaneous API calls from opening multiple GIS requests.
  const refreshed = await refreshGoogleTokenSilently();
  if (refreshed && inMemoryAccessToken) {
    return inMemoryAccessToken;
  }

  // Silent refresh failed, mark reconnection required
  needsReconnectFlag = true;
  return null;
}

/**
 * Re-check the token whenever the app becomes active again. Mobile browsers
 * frequently suspend timers while a tab is backgrounded, so this complements
 * the scheduled refresh above.
 */
export function initializeGoogleTokenAutoRefresh(): () => void {
  if (typeof window === 'undefined') return () => {};

  const refreshIfNeeded = () => {
    const config = getGoogleSheetsConfig();
    if (!config.clientId) return;

    // Only attempt a silent refresh if the user previously obtained a token in this session.
    // Calling GIS prompt: 'none' when no Google session / permission is active causes GIS to attempt
    // opening an unprompted popup or iframe redirect which browsers block with:
    // "Failed to open popup window... Maybe blocked by the browser?"
    if (!inMemoryAccessToken) {
      return;
    }

    const remaining = inMemoryTokenExpiresAt - Date.now();
    if (remaining <= AUTO_REFRESH_BUFFER_MS) {
      void refreshGoogleTokenSilently();
    } else {
      scheduleAutoRefresh();
    }
  };

  window.addEventListener('focus', refreshIfNeeded);
  document.addEventListener('visibilitychange', refreshIfNeeded);

  return () => {
    window.removeEventListener('focus', refreshIfNeeded);
    document.removeEventListener('visibilitychange', refreshIfNeeded);
    clearAutoRefreshTimer();
  };
}

/**
 * Creates a brand new Google Spreadsheet with "ยอดขาย" and "สต็อก" sheets
 */
export async function createNewSpreadsheet(customTitle?: string): Promise<{
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}> {
  const token = await getValidAccessToken();
  if (!token) {
    needsReconnectFlag = true;
    return { success: false, error: 'Token หมดอายุหรือไม่พบการเชื่อมต่อ กรุณาล็อกอิน Google ใหม่' };
  }

  const title = customTitle || `Nippon Paint - ยอดขายและสต็อก (${new Date().toLocaleDateString('th-TH')})`;

  try {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'ยอดขาย',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: 'สต็อก',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${res.status}`;
      return { success: false, error: `ไม่สามารถสร้าง Spreadsheet ได้: ${msg}` };
    }

    const data = await res.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    saveGoogleSheetsConfig({
      spreadsheetId,
      spreadsheetName: title,
      spreadsheetUrl,
    });

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการติดต่อ Google Sheets API' };
  }
}

/**
 * Checks if "ยอดขาย" and "สต็อก" sheets exist in target spreadsheet.
 * If not, creates them via batchUpdate addSheet.
 */
async function ensureSheetsExist(spreadsheetId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return false;
    const meta = await res.json();
    const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

    const requiredSheets = ['ยอดขาย', 'สต็อก'];
    const missing = requiredSheets.filter((t) => !existingTitles.includes(t));

    if (missing.length === 0) return true;

    // Add missing sheets
    const requests = missing.map((sheetTitle) => ({
      addSheet: {
        properties: {
          title: sheetTitle,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    return addRes.ok;
  } catch (e) {
    console.error('Error verifying/creating sheets:', e);
    return false;
  }
}

/**
 * Verifies that the provided Spreadsheet ID exists and is accessible
 */
export async function verifySpreadsheet(spreadsheetId: string): Promise<{
  success: boolean;
  title?: string;
  error?: string;
}> {
  if (!spreadsheetId || !spreadsheetId.trim()) {
    return { success: false, error: 'กรุณากรอก Spreadsheet ID' };
  }

  const token = await getValidAccessToken();
  if (!token) {
    return { success: false, error: 'ยังไม่ได้เข้าสู่ระบบ Google หรือ Token หมดอายุ' };
  }

  try {
    const cleanId = spreadsheetId.trim();
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,spreadsheetUrl`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: 'ไม่พบ Spreadsheet ID นี้ หรือไม่มีสิทธิ์เข้าถึง' };
      }
      return { success: false, error: `เข้าถึง Spreadsheet ไม่สำเร็จ (HTTP ${res.status})` };
    }

    const data = await res.json();
    const title = data?.properties?.title || 'Spreadsheet';
    const url = data?.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

    await ensureSheetsExist(cleanId, token);

    saveGoogleSheetsConfig({
      spreadsheetId: cleanId,
      spreadsheetName: title,
      spreadsheetUrl: url,
    });

    return { success: true, title };
  } catch (err: any) {
    return { success: false, error: err.message || 'ไม่สามารถตรวจสอบ Spreadsheet ได้' };
  }
}

/**
 * Synchronizes sales and stock data to Google Sheets (overwriting both sheets completely)
 */
export async function syncToGoogleSheets(
  sales: SaleEntry[],
  products: Product[],
  isManual = false
): Promise<{ success: boolean; error?: string }> {
  const config = getGoogleSheetsConfig();

  // If auto-sync is disabled and this wasn't manual, do nothing
  if (!isManual && !config.autoSyncEnabled) {
    return { success: true };
  }

  // If not configured, exit silently
  if (!config.clientId || !config.spreadsheetId) {
    return { success: false, error: 'ยังไม่ได้ตั้งค่า Google Sheets' };
  }

  const token = await getValidAccessToken();
  if (!token) {
    needsReconnectFlag = true;
    saveGoogleSheetsConfig({ lastSyncStatus: 'error', lastErrorMessage: 'Token หมดอายุ' });
    emitSyncToast({
      type: 'error',
      message: 'ไม่สามารถซิงก์ได้ กรุณาเชื่อมต่อ Google Sheets ใหม่',
      actionLabel: 'เชื่อมต่อ',
    });
    return { success: false, error: 'Token หมดอายุ กรุณาเข้าสู่ระบบ Google ใหม่' };
  }

  try {
    const spreadsheetId = config.spreadsheetId.trim();

    // Ensure target sheets exist
    await ensureSheetsExist(spreadsheetId, token);

    // Build Rows for "ยอดขาย"
    const salesHeader = [
      'วันที่',
      'เลขที่บิล',
      'สินค้า',
      'ขนาด',
      'เบส',
      'รหัสสี',
      'ราคาตั้ง',
      'ค่าแม่สี',
      'จำนวน',
      'ยอดเงินรวม',
      'ชื่อลูกค้า',
      'เบอร์โทร',
    ];

    const salesRows = sales.map((s) => [
      s.date || '',
      s.billId || s.id || '',
      s.name || '',
      s.size || '',
      s.base || '',
      s.colorCode || '',
      Number(s.price) || 0,
      Number(s.tintPrice) || 0,
      Number(s.qty) || 0,
      Number(s.total) || 0,
      s.customerName || '',
      s.customerPhone || '',
    ]);

    // Build Rows for "สต็อก"
    const stockHeader = [
      'รหัส_SKU',
      'ชื่อสินค้า',
      'ขนาด',
      'เบส',
      'ราคาต่อหน่วย',
      'สต็อกยกมา',
      'รับเข้า',
      'ขายแล้ว',
      'คงเหลือจริง',
    ];

    const stockRows = products.map((p) => [
      p.sku || '',
      p.name || '',
      p.size || '',
      p.base || '',
      Number(p.price) || 0,
      Number(p.init) || 0,
      Number(p.inflow) || 0,
      Number(p.sold) || 0,
      p.remain !== undefined ? Number(p.remain) : (Number(p.stock) || 0),
    ]);

    // 1. Clear old values in both sheets
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ranges: ["'ยอดขาย'!A1:Z", "'สต็อก'!A1:Z"],
        }),
      }
    );

    if (!clearRes.ok) {
      const errData = await clearRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Clear failed (HTTP ${clearRes.status})`);
    }

    // 2. Overwrite with full latest datasets
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: "'ยอดขาย'!A1",
              values: [salesHeader, ...salesRows],
            },
            {
              range: "'สต็อก'!A1",
              values: [stockHeader, ...stockRows],
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Update failed (HTTP ${updateRes.status})`);
    }

    const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    saveGoogleSheetsConfig({
      lastSyncTime: nowStr,
      lastSyncStatus: 'success',
      lastErrorMessage: undefined,
    });

    // Notify user: show green toast (or quiet session notification)
    if (isManual || !hasShownSuccessToastInSession) {
      emitSyncToast({
        type: 'success',
        message: 'ซิงก์ไป Google Sheets แล้ว',
        duration: 2000,
      });
      hasShownSuccessToastInSession = true;
    }

    return { success: true };
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    saveGoogleSheetsConfig({
      lastSyncStatus: 'error',
      lastErrorMessage: err.message,
    });

    emitSyncToast({
      type: 'error',
      message: 'ไม่สามารถซิงก์ได้ กรุณาเชื่อมต่อ Google Sheets ใหม่',
      actionLabel: 'ตั้งค่า',
    });

    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการซิงก์ข้อมูล' };
  }
}

/**
 * Debounced background trigger for auto-sync (500ms debounce)
 * Runs asynchronously and never throws or blocks local operations
 */
export function triggerAutoSync(sales: SaleEntry[], products: Product[]): void {
  const config = getGoogleSheetsConfig();
  if (!config.clientId || !config.spreadsheetId || !config.autoSyncEnabled) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    // Non-blocking background task
    syncToGoogleSheets(sales, products, false).catch((err) => {
      console.warn('Auto-sync background task handled exception:', err);
    });
  }, 500);
}

/**
 * Disconnect Google Sheets connection
 */
export function disconnectGoogleSheets(): void {
  clearAccessToken();
  saveGoogleSheetsConfig({
    spreadsheetId: '',
    spreadsheetName: '',
    spreadsheetUrl: '',
    lastSyncStatus: 'idle',
    lastSyncTime: undefined,
  });
}

// Start token lifecycle handling as soon as this service is loaded.
// No popup is opened; renewal uses GIS prompt:'none' only.
if (typeof window !== 'undefined') {
  initializeGoogleTokenAutoRefresh();
}
