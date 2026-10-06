/**
 * Cryptographic hashing using Web Crypto API
 * Implements PBKDF2 / SHA-256 with unique random salt
 */

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}$${hashHex}`;
}

export async function verifyPassword(storedHash: string, providedPassword: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 2) return false;
    const [saltHex, expectedHashHex] = parts;

    // Convert salt hex back to Uint8Array
    const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const enc = new TextEncoder();

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(providedPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const derivedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return derivedHex === expectedHashHex;
  } catch (err) {
    console.error('Password verification failed:', err);
    return false;
  }
}
