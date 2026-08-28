/**
 * Content Encryption Module (AES-128 Web Crypto API)
 * Encrypts notes & quiz answers in memory to prevent plain-text inspection in browser console.
 */

// Master session key generated via Web Crypto API
let sessionCryptoKey = null;

async function getSessionKey() {
  if (!sessionCryptoKey) {
    sessionCryptoKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 128 },
      true,
      ['encrypt', 'decrypt']
    );
  }
  return sessionCryptoKey;
}

/**
 * Encrypt plain text using AES-128 GCM
 */
export async function encryptTextPayload(plainText) {
  const key = await getSessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ivHex: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    ciphertextBase64: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
}

/**
 * Decrypt payload using AES-128 GCM
 */
export async function decryptTextPayload(encryptedObj) {
  if (!encryptedObj || !encryptedObj.ciphertextBase64) return '';

  const key = await getSessionKey();
  const iv = new Uint8Array(
    encryptedObj.ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );

  const binaryStr = atob(encryptedObj.ciphertextBase64);
  const ciphertext = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    ciphertext[i] = binaryStr.charCodeAt(i);
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
