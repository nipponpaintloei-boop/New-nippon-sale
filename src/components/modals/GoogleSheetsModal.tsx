import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Link2,
  HelpCircle,
  LogOut,
  Sliders,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  getConnectionStatus,
  loginWithGoogleSheets,
  createNewSpreadsheet,
  verifySpreadsheet,
  pickGoogleSpreadsheet,
  syncToGoogleSheets,
  disconnectGoogleSheets,
  GoogleSheetsConfig,
} from '../../services/googleSheetsSync';
import { useAppState } from '../../context/AppStateContext';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ isOpen, onClose }) => {
  const { sales, products, googleProfile, setGoogleProfile } = useAppState();

  const [config, setConfig] = useState<GoogleSheetsConfig>(getGoogleSheetsConfig());
  const [clientIdInput, setClientIdInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create');
  const [newSheetTitle, setNewSheetTitle] = useState<string>('');

  const [status, setStatus] = useState<string>(getConnectionStatus());
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync state on modal open
  useEffect(() => {
    if (isOpen) {
      const currentConfig = getGoogleSheetsConfig();
      setConfig(currentConfig);
      setClientIdInput(currentConfig.clientId || '');
      setStatus(getConnectionStatus());
      setNewSheetTitle(`Nippon Paint - ยอดขายและสต็อก (${new Date().toLocaleDateString('th-TH')})`);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleLogin = async () => {
    if (!clientIdInput.trim()) {
      setStatusMessage({ text: 'กรุณาระบุ Google OAuth Client ID', type: 'error' });
      return;
    }
    setIsLoadingAuth(true);
    setStatusMessage(null);

    const res = await loginWithGoogleSheets(clientIdInput);
    setIsLoadingAuth(false);

    if (res.success) {
      if (res.user) {
        setGoogleProfile({
          email: res.user.email,
          name: res.user.name,
          picture: res.user.picture,
        });
      }
      const updated = getGoogleSheetsConfig();
      setConfig(updated);
      setStatus(getConnectionStatus());
      setStatusMessage({
        text: `เข้าสู่ระบบสำเร็จ${res.user?.name ? ` (ยินดีต้อนรับ ${res.user.name})` : ''} กำลังเปิด Google Drive ให้เลือกไฟล์...`,
        type: 'success',
      });

      await handlePickSpreadsheet();
    } else {
      setStatusMessage({ text: res.error || 'เข้าสู่ระบบไม่สำเร็จ', type: 'error' });
    }
  };

  const handlePickSpreadsheet = async () => {
    setIsLoadingSheet(true);
    setStatusMessage(null);

    const res = await pickGoogleSpreadsheet();
    if (!res.success || !res.spreadsheetId) {
      setIsLoadingSheet(false);
      if (res.error !== 'ยกเลิกการเลือก Spreadsheet') {
        setStatusMessage({ text: res.error || 'ไม่สามารถเลือก Spreadsheet ได้', type: 'error' });
      }
      return;
    }

    const verified = await verifySpreadsheet(res.spreadsheetId);
    if (!verified.success) {
      setIsLoadingSheet(false);
      setStatusMessage({ text: verified.error || 'ตรวจสอบ Spreadsheet ไม่สำเร็จ', type: 'error' });
      return;
    }

    setConfig(getGoogleSheetsConfig());
    setStatus(getConnectionStatus());
    setIsLoadingSheet(false);
    setStatusMessage({
      text: `เชื่อมต่อกับ "${verified.title || res.spreadsheetName || 'Spreadsheet'}" เรียบร้อยแล้ว`,
      type: 'success',
    });

    setIsSyncing(true);
    await syncToGoogleSheets(sales, products, true);
    setIsSyncing(false);
    setConfig(getGoogleSheetsConfig());
  };

  const handleCreateNewSheet = async () => {
    setIsLoadingSheet(true);
    setStatusMessage(null);

    const res = await createNewSpreadsheet(newSheetTitle);
    setIsLoadingSheet(false);

    if (res.success && res.spreadsheetId) {
      const updated = getGoogleSheetsConfig();
      setConfig(updated);
      setStatus(getConnectionStatus());
      setStatusMessage({ text: 'สร้าง Google Spreadsheet ใหม่เรียบร้อยแล้ว!', type: 'success' });

      // Trigger initial sync
      setIsSyncing(true);
      await syncToGoogleSheets(sales, products, true);
      setIsSyncing(false);
      setConfig(getGoogleSheetsConfig());
    } else {
      setStatusMessage({ text: res.error || 'สร้าง Spreadsheet ไม่สำเร็จ', type: 'error' });
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    const res = await syncToGoogleSheets(sales, products, true);
    setIsSyncing(false);

    const updated = getGoogleSheetsConfig();
    setConfig(updated);
    setStatus(getConnectionStatus());

    if (res.success) {
      setStatusMessage({ text: 'ซิงก์ข้อมูลยอดขายและสต็อกล่าสุดสำเร็จ!', type: 'success' });
    } else {
      setStatusMessage({ text: res.error || 'ซิงก์ข้อมูลไม่สำเร็จ', type: 'error' });
    }
  };

  const handleToggleAutoSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    saveGoogleSheetsConfig({ autoSyncEnabled: val });
    setConfig((prev) => ({ ...prev, autoSyncEnabled: val }));
  };

  const handleDisconnect = () => {
    if (confirm('คุณต้องการยกเลิกการเชื่อมต่อกับ Google Sheets ใช่หรือไม่?')) {
      disconnectGoogleSheets();
      setConfig(getGoogleSheetsConfig());
      setStatus('disconnected');
      setStatusMessage({ text: 'ยกเลิกการเชื่อมต่อเรียบร้อยแล้ว', type: 'info' });
    }
  };

  const isConnected = status === 'connected';
  const isExpired = status === 'expired' || status === 'needs_reconnect';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Auto-sync ไป Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                ซิงก์ยอดขายและสต็อกสีนิปปอนไปยังสเปรดชีตอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                : isExpired
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : isExpired ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">
                  {isConnected
                    ? 'เชื่อมต่อ Google Sheets แล้ว'
                    : isExpired
                    ? 'เซสชันหมดอายุ (ต้องเข้าสู่ระบบใหม่)'
                    : 'ยังไม่ได้เชื่อมต่อ Google Sheets'}
                </span>
                {isConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-0.5 opacity-90">
                {isConnected
                  ? `สเปรดชีต: ${config.spreadsheetName || config.spreadsheetId} ${
                      config.lastSyncTime ? `(ซิงก์ล่าสุด: ${config.lastSyncTime})` : ''
                    }`
                  : isExpired
                  ? 'Access Token หมดอายุเนื่องจากเวลาผ่านไป 1 ชม. กรุณากดปุ่มลงชื่อเข้าใช้ใหม่อีกครั้ง'
                  : 'ตั้งค่า Google OAuth Client ID ด้านล่างเพื่อเริ่มการซิงก์แบบเรียลไทม์'}
              </p>

              {config.spreadsheetUrl && isConnected && (
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={config.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดสเปรดชีตใน Google Sheets</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Step 1: OAuth Authentication */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-mono text-xs flex items-center justify-center font-black">
                  1
                </span>
                <span>Google OAuth Client ID</span>
              </span>
              {isConnected && (
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> เชื่อมต่อแล้ว
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Client ID (สร้างจาก Google Cloud Console):
              </label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="ตัวอย่าง: 123456789-xxxxxxxx.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Quick guide */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>วิธีตั้งค่าใน Google Cloud Console:</span>
              </div>
              <p>
                1. เปิด <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong>
              </p>
              <p>
                2. สร้าง OAuth 2.0 Client IDs ชนิด <strong>Web application</strong>
              </p>
              <p>
                3. ในช่อง <strong>Authorized JavaScript origins</strong> ให้เพิ่ม:
                <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 font-mono text-[10px]">
                  {currentOrigin}
                </code>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoadingAuth}
                className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoadingAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>{isConnected ? 'สลับบัญชี Google' : 'ลงชื่อเข้าใช้ด้วย Google'}</span>
              </button>

              {config.clientId && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                  title="ตัดการเชื่อมต่อ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Spreadsheet Setup */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-mono text-xs flex items-center justify-center font-black">
                  2
                </span>
                <span>เลือก Google Spreadsheet</span>
              </span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>สร้างไฟล์ใหม่ใน Drive</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('existing')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'existing'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                <span>เลือกจาก Google Drive</span>
              </button>
            </div>

            {activeTab === 'create' ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    ชื่อไฟล์ Spreadsheet:
                  </label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="Nippon Paint - ยอดขายและสต็อก"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isLoadingSheet || !isConnected}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingSheet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>สร้าง Spreadsheet และเริ่มซิงก์</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">เลือกไฟล์จาก Google Drive</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        ไม่ต้องคัดลอกลิงก์หรือ Spreadsheet ID ระบบจะแสดงเฉพาะไฟล์ Google Sheets ที่คุณมีสิทธิ์เลือก
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePickSpreadsheet}
                  disabled={isLoadingSheet || !isConnected}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingSheet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>{config.spreadsheetId ? 'เปลี่ยนไฟล์ Google Sheets' : 'เลือกไฟล์จาก Google Drive'}</span>
                </button>

                {!isConnected && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    กรุณาเชื่อมต่อ Google ด้านบนก่อน ระบบจึงจะเปิดตัวเลือกไฟล์จาก Drive ได้
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sync Control & Status */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  เปิดการซิงก์อัตโนมัติ (Auto-sync)
                </span>
                <span className="text-[11px] text-slate-500">
                  ระบบจะซิงก์ไป Google Sheets ทันทีหลังจากบันทึกยอดขายหรือปรับสต็อก (ดีเลย์ 500ms)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSyncEnabled}
                  onChange={handleToggleAutoSync}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                ข้อมูลปัจจุบันที่จะซิงก์: <strong>{sales.length}</strong> รายการขาย |{' '}
                <strong>{products.length}</strong> SKU สต็อก
              </div>

              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isSyncing || !isConnected}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>ซิงก์ทันที (Manual Sync)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
