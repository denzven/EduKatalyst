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

function uint8ArrayToBase64(uint8) {
  let binary = '';
  const len = uint8.byteLength;
  const CHUNK_SIZE = 0x8000; // 32KB chunks to prevent function argument stack overflow
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(
      null,
      uint8.subarray(i, i + CHUNK_SIZE)
    );
  }
  return btoa(binary);
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
    ciphertextBase64: uint8ArrayToBase64(new Uint8Array(ciphertext))
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

/**
 * Encrypt full note payload object (body, sections, formula) via Web Crypto AES-GCM
 */
export async function encryptNoteData(note) {
  if (!note) return note;

  const payload = {
    bodyHtml: note.bodyHtml || '',
    rawBody: note.rawBody || '',
    formula: note.formula || '',
    sections: note.sections || []
  };

  const encryptedPayload = await encryptTextPayload(JSON.stringify(payload));

  return {
    ...note,
    isEncrypted: true,
    encryptedPayload
  };
}

/**
 * Decrypt full note payload object on-the-fly when serving in note applet
 */
export async function decryptNoteData(note) {
  if (!note || !note.isEncrypted || !note.encryptedPayload) {
    return note;
  }

  try {
    const jsonStr = await decryptTextPayload(note.encryptedPayload);
    const decrypted = JSON.parse(jsonStr);

    return {
      ...note,
      bodyHtml: decrypted.bodyHtml,
      rawBody: decrypted.rawBody,
      formula: decrypted.formula,
      sections: decrypted.sections || [],
      isDecrypted: true
    };
  } catch (err) {
    return note;
  }
}
