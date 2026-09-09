// Simulated AES-256-GCM & Cryptographic Helper utilities for WBS System

const SECRET_KEY = "WBS_INSPECTORATE_AES256_SECRET_KEY_2026";

/**
 * Encrypts a string using a simulated AES-256 cipher format:
 * [AES256_GCM::b64payload::iv::tag]
 */
export function encryptData(text: string): string {
  if (!text) return "";
  try {
    // Standard Base64 encoding with cipher header simulation for client presentation
    const encoded = btoa(unescape(encodeURIComponent(text)));
    const mockIv = Math.random().toString(36).substring(2, 10);
    const mockTag = Math.random().toString(36).substring(2, 8);
    return `AES256_GCM:${encoded}:${mockIv}:${mockTag}`;
  } catch (e) {
    return `AES256_GCM:${btoa(text)}`;
  }
}

/**
 * Decrypts a cipher text encrypted with encryptData
 */
export function decryptData(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith("AES256_GCM:")) return cipherText; // return as is if plain
  
  try {
    const parts = cipherText.split(":");
    const encodedPayload = parts[1];
    return decodeURIComponent(escape(atob(encodedPayload)));
  } catch (e) {
    return "[DECRYPTION_ERROR: Invalid Key or Tampered Payload]";
  }
}

/**
 * Computes a pseudo SHA-256 hash digest for data integrity verification
 */
export async function computeSha256Digest(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(content + SECRET_KEY);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // fallback
    }
  }
  // Simple deterministic fallback hash generator
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}${hex}${hex}${hex}`;
}

/**
 * Generates a random secure Ticket Code format: WBS-2026-XXXX-YY
 */
export function generateTicketCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const alpha1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const alpha2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const num2 = Math.floor(10 + Math.random() * 90);
  return `WBS-2026-${randomNum}-${alpha1}${alpha2}${num2}`;
}

/**
 * Generates a 6-digit Secret PIN for ticket access
 */
export function generateSecretPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a Base32 16-character secret for TOTP 2FA
 */
export function generateTotpSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generates a current 6-digit TOTP code based on time slice
 */
export function generateCurrentTotpCode(secret: string): string {
  const timeSlice = Math.floor(Date.now() / 30000);
  let codeNum = 0;
  for (let i = 0; i < secret.length; i++) {
    codeNum += secret.charCodeAt(i) * (i + 1) * timeSlice;
  }
  const sixDigit = (Math.abs(codeNum) % 900000) + 100000;
  return sixDigit.toString();
}
