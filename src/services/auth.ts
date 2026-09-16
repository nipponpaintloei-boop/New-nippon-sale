/**
 * Google account authentication.
 *
 * The app no longer uses Supabase for authentication. A Google account is the
 * tenant identity used to namespace all local application data.
 */

export interface AppUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    picture?: string;
  };
}

export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
}

const USER_PROFILE_STORAGE_KEY = 'nippon_user_google_profile';

export function getGoogleClientId(): string {
  try {
    return String((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '').trim();
  } catch {
    return '';
  }
}

export function getSavedGoogleProfile(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    return profile?.email ? profile : null;
  } catch {
    return null;
  }
}

export function saveGoogleProfile(profile: GoogleUserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors.
  }
}

export function clearGoogleProfile(): void {
  try {
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function profileToUser(profile: GoogleUserProfile): AppUser {
  return {
    id: profile.sub || profile.email.toLowerCase(),
    email: profile.email,
    user_metadata: {
      full_name: profile.name,
      name: profile.name,
      picture: profile.picture,
    },
  };
}

export async function checkSession(): Promise<{ user: AppUser | null; session: GoogleUserProfile | null }> {
  const profile = getSavedGoogleProfile();
  if (!profile) return { user: null, session: null };
  return { user: profileToUser(profile), session: profile };
}

export async function loadGsiScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).google?.accounts?.oauth2) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(!!(window as any).google?.accounts?.oauth2));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!(window as any).google?.accounts?.oauth2), 1500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(!!(window as any).google?.accounts?.oauth2);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export async function loginWithGoogle(): Promise<{
  success: boolean;
  error?: string;
  user?: AppUser;
  profile?: GoogleUserProfile;
}> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return {
      success: false,
      error: 'ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID ของแอป กรุณาตั้งค่าใน deployment ก่อนใช้งาน',
    };
  }

  const loaded = await loadGsiScript();
  if (!loaded || !(window as any).google?.accounts?.oauth2) {
    return { success: false, error: 'ไม่สามารถโหลด Google Identity Services ได้ กรุณาลองใหม่อีกครั้ง' };
  }

  return new Promise((resolve) => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        prompt: 'select_account',
        callback: async (response: any) => {
          if (response?.error) {
            resolve({ success: false, error: response.error_description || response.error });
            return;
          }
          if (!response?.access_token) {
            resolve({ success: false, error: 'ไม่ได้รับ Access Token จาก Google' });
            return;
          }

          try {
            const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            if (!infoRes.ok) throw new Error('ไม่สามารถอ่านข้อมูลบัญชี Google ได้');
            const info = await infoRes.json();
            const profile: GoogleUserProfile = {
              email: String(info.email || '').trim(),
              name: info.name || undefined,
              picture: info.picture || undefined,
              sub: info.sub || undefined,
            };
            if (!profile.email) throw new Error('บัญชี Google ไม่มีอีเมลที่ใช้งานได้');
            saveGoogleProfile(profile);
            try {
              sessionStorage.setItem('nippon_app_google_access_token', response.access_token);
              sessionStorage.setItem(
                'nippon_app_google_token_expiry',
                String(Date.now() + Math.max(60, Number(response.expires_in) || 3599) * 1000)
              );
            } catch {}
            resolve({ success: true, user: profileToUser(profile), profile });
          } catch (e: any) {
            resolve({ success: false, error: e?.message || 'เข้าสู่ระบบ Google ไม่สำเร็จ' });
          }
        },
        error_callback: (err: any) => {
          const type = err?.type || '';
          if (type === 'popup_closed' || type === 'popup_failed_to_open') {
            resolve({ success: false, error: 'หน้าต่าง Google ถูกปิดหรือถูกบล็อก กรุณาอนุญาต popup แล้วลองใหม่' });
            return;
          }
          resolve({ success: false, error: err?.message || 'ไม่สามารถเปิด Google Login ได้' });
        },
      });
      client.requestAccessToken();
    } catch (e: any) {
      resolve({ success: false, error: e?.message || 'ไม่สามารถเริ่ม Google Login ได้' });
    }
  });
}

export async function signOutUser(): Promise<void> {
  clearGoogleProfile();
  try {
    sessionStorage.removeItem('nippon_app_google_access_token');
    sessionStorage.removeItem('nippon_app_google_token_expiry');
    sessionStorage.removeItem('nippon_google_access_token');
    sessionStorage.removeItem('nippon_google_token_expiry');
  } catch {}
}

export function extractUsername(user: AppUser | null, googleProfile?: GoogleUserProfile | null): string {
  if (googleProfile?.name) return googleProfile.name;
  if (googleProfile?.email) return googleProfile.email.split('@')[0];
  if (!user || !user.email) return 'ผู้ใช้งาน';
  const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (metaName) return metaName;
  return user.email.split('@')[0] || 'ผู้ใช้งาน';
}
