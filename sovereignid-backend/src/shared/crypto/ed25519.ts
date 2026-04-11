import * as ed25519 from "@noble/ed25519";

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "");
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex length");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

export async function verify(
  message: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  const msg = new TextEncoder().encode(message);
  const sig = hexToBytes(signatureHex);
  const pub = hexToBytes(publicKeyHex);
  try {
    return await ed25519.verify(sig, msg, pub);
  } catch {
    return false;
  }
}
