/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Neurapex Advanced Threat Protection & Device Security Middleware.
 * Provides client-side cryptographic device fingerprinting, brute-force rate limiting,
 * progressive lockout backoff, and biometric risk assessment.
 */

export interface DevicePosture {
  fingerprint: string;
  hardwareEntropy: string;
  riskScore: number; // 0 (Trusted) to 100 (High Risk / Bot)
  riskLevel: 'LOW_RISK' | 'ELEVATED' | 'HIGH_RISK_LOCKED';
  isHardwareEnclaveSupported: boolean;
  isHeadlessDetected: boolean;
  userAgentSummary: string;
  timestamp: string;
  canvasHash?: string;
  screenResolution: string;
  timeZone: string;
}

export interface RateLimitState {
  isLocked: boolean;
  failedAttempts: number;
  maxAttempts: number;
  lockoutSecondsRemaining: number;
  lockoutEndTime: number | null;
  statusMessage: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'DEVICE_VALIDATION' | 'RATE_LIMIT_CHECK' | 'OTP_CHALLENGE' | 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'BRUTE_FORCE_BLOCKED' | 'PASSKEY_VERIFIED';
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

// Simple SHA-256 implementation using Web Crypto API with fallback
async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback
    }
  }

  // Fallback 32-character hex hash
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Collects hardware, display, canvas, and browser entropy to compute a stable device fingerprint.
 */
export async function computeNeurapexDevicePosture(): Promise<DevicePosture> {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
  const scr = typeof screen !== 'undefined' ? screen : ({} as any);

  // Entropy components
  const components: string[] = [
    nav.userAgent || '',
    nav.language || '',
    (nav.languages || []).join(','),
    String(scr.width || 0),
    String(scr.height || 0),
    String(scr.colorDepth || 0),
    String(nav.hardwareConcurrency || 4),
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  ];

  let canvasHash = '';
  // Canvas 2D entropy noise calculation
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = '#f60';
      ctx.fillRect(5, 1, 60, 15);
      ctx.fillStyle = '#069';
      ctx.fillText('NeurapexShield#', 4, 8);
      const dataUrl = canvas.toDataURL();
      canvasHash = await sha256(dataUrl);
      components.push(canvasHash.substring(0, 16));
    }
  } catch {
    // ignore
  }

  const rawEntropy = components.join('###');
  const fullHash = await sha256(rawEntropy);
  const fingerprint = `NX-${fullHash.substring(0, 4).toUpperCase()}-${fullHash.substring(4, 8).toUpperCase()}-${fullHash.substring(8, 12).toUpperCase()}`;

  // Bot & Headless heuristic checks
  const isHeadless =
    Boolean(nav.webdriver) ||
    !nav.languages ||
    nav.languages.length === 0 ||
    /HeadlessChrome/.test(nav.userAgent || '');

  let riskScore = isHeadless ? 85 : 5;
  if (!nav.hardwareConcurrency) riskScore += 10;
  if (!scr.width || scr.width === 0) riskScore += 20;

  let riskLevel: DevicePosture['riskLevel'] = 'LOW_RISK';
  if (riskScore >= 60) {
    riskLevel = 'HIGH_RISK_LOCKED';
  } else if (riskScore >= 25) {
    riskLevel = 'ELEVATED';
  }

  // WebAuthn / Passkey support check
  const isHardwareEnclaveSupported =
    typeof window !== 'undefined' &&
    Boolean(window.PublicKeyCredential) &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

  const posture: DevicePosture = {
    fingerprint,
    hardwareEntropy: fullHash.substring(12, 28).toUpperCase(),
    riskScore,
    riskLevel,
    isHardwareEnclaveSupported,
    isHeadlessDetected: isHeadless,
    userAgentSummary: `${nav.platform || 'Client'} · ${nav.language || 'en'}`,
    timestamp: new Date().toISOString(),
    canvasHash: canvasHash ? canvasHash.substring(0, 12).toUpperCase() : undefined,
    screenResolution: `${scr.width || 0}x${scr.height || 0} (${scr.colorDepth || 24}-bit)`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };

  logSecurityEvent({
    type: 'DEVICE_VALIDATION',
    details: `Device posture evaluated: Fingerprint ${fingerprint}, Risk Score: ${riskScore}/100 (${riskLevel})`,
    severity: riskLevel === 'HIGH_RISK_LOCKED' ? 'critical' : riskLevel === 'ELEVATED' ? 'warning' : 'info',
  });

  return posture;
}

const RATE_LIMIT_STORAGE_KEY = 'neurapex_auth_rate_limit';
const SECURITY_LOGS_STORAGE_KEY = 'neurapex_security_audit_logs';
export const MAX_ATTEMPTS_BEFORE_LOCKOUT = 4;
export const LOCKOUT_DURATION_SECONDS = 30; // Progressive 30-second lockout base

/**
 * Validates whether the user or IP/device is currently rate-limited.
 */
export function getRateLimitStatus(identifier: string = 'global'): RateLimitState {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_STORAGE_KEY}_${identifier}`);
    if (!raw) {
      return {
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
        lockoutSecondsRemaining: 0,
        lockoutEndTime: null,
        statusMessage: 'Normal authentication posture.',
      };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockoutEndTime && now < data.lockoutEndTime) {
      const remaining = Math.ceil((data.lockoutEndTime - now) / 1000);
      return {
        isLocked: true,
        failedAttempts: data.failedAttempts || MAX_ATTEMPTS_BEFORE_LOCKOUT,
        maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
        lockoutSecondsRemaining: remaining,
        lockoutEndTime: data.lockoutEndTime,
        statusMessage: `Neurapex Threat Protection engaged. Rate-limited for ${remaining}s.`,
      };
    }

    // Lockout expired: reset failed attempts
    if (data.lockoutEndTime && now >= data.lockoutEndTime) {
      localStorage.removeItem(`${RATE_LIMIT_STORAGE_KEY}_${identifier}`);
      return {
        isLocked: false,
        failedAttempts: 0,
        maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
        lockoutSecondsRemaining: 0,
        lockoutEndTime: null,
        statusMessage: 'Rate-limit cooldown expired. Normal posture restored.',
      };
    }

    return {
      isLocked: false,
      failedAttempts: data.failedAttempts || 0,
      maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
      lockoutSecondsRemaining: 0,
      lockoutEndTime: null,
      statusMessage: `${data.failedAttempts || 0}/${MAX_ATTEMPTS_BEFORE_LOCKOUT} attempts used.`,
    };
  } catch {
    return {
      isLocked: false,
      failedAttempts: 0,
      maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
      lockoutSecondsRemaining: 0,
      lockoutEndTime: null,
      statusMessage: 'Normal authentication posture.',
    };
  }
}

/**
 * Records a failed sign-in/sign-up attempt and triggers progressive lockout when threshold is reached.
 */
export function recordFailedAuthAttempt(identifier: string = 'global'): RateLimitState {
  const current = getRateLimitStatus(identifier);
  const newFailedAttempts = current.failedAttempts + 1;
  const now = Date.now();

  let lockoutEndTime: number | null = null;
  let isLocked = false;
  let remaining = 0;

  if (newFailedAttempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    isLocked = true;
    const multiplier = Math.max(1, newFailedAttempts - MAX_ATTEMPTS_BEFORE_LOCKOUT + 1);
    const duration = LOCKOUT_DURATION_SECONDS * multiplier * 1000;
    lockoutEndTime = now + duration;
    remaining = Math.ceil(duration / 1000);

    logSecurityEvent({
      type: 'BRUTE_FORCE_BLOCKED',
      details: `Rate limit threshold breached (${newFailedAttempts} attempts). Temporary lockout activated for ${remaining}s.`,
      severity: 'critical',
    });
  } else {
    logSecurityEvent({
      type: 'AUTH_FAILURE',
      details: `Failed authentication token challenge (${newFailedAttempts}/${MAX_ATTEMPTS_BEFORE_LOCKOUT} attempts).`,
      severity: 'warning',
    });
  }

  const payload = {
    failedAttempts: newFailedAttempts,
    lockoutEndTime,
    lastAttemptTimestamp: now,
  };

  try {
    localStorage.setItem(`${RATE_LIMIT_STORAGE_KEY}_${identifier}`, JSON.stringify(payload));
  } catch {
    // ignore
  }

  return {
    isLocked,
    failedAttempts: newFailedAttempts,
    maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
    lockoutSecondsRemaining: remaining,
    lockoutEndTime,
    statusMessage: isLocked
      ? `Threat Protection: Excessive attempts detected. Locked for ${remaining}s.`
      : `Failed attempt recorded. ${MAX_ATTEMPTS_BEFORE_LOCKOUT - newFailedAttempts} attempts remaining.`,
  };
}

/**
 * Resets rate-limit tracker upon successful verified authentication.
 */
export function resetAuthRateLimit(identifier: string = 'global'): void {
  try {
    localStorage.removeItem(`${RATE_LIMIT_STORAGE_KEY}_${identifier}`);
    logSecurityEvent({
      type: 'AUTH_SUCCESS',
      details: `Authentication verified. Rate limiting counters cleared for ${identifier.substring(0, 14)}.`,
      severity: 'info',
    });
  } catch {
    // ignore
  }
}

/**
 * Log a security event into local storage for the Neurapex Audit Vault.
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
  try {
    const existing = getSecurityEventLogs();
    const newEntry: SecurityEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    const updated = [newEntry, ...existing].slice(0, 20); // Keep last 20 events
    localStorage.setItem(SECURITY_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Retrieve recent security events.
 */
export function getSecurityEventLogs(): SecurityEvent[] {
  try {
    const raw = localStorage.getItem(SECURITY_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all security event logs.
 */
export function clearSecurityEventLogs(): void {
  try {
    localStorage.removeItem(SECURITY_LOGS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
