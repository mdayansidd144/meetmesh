export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const isPlatformAuthenticatorAvailable = async () => {
  if (!window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// Register a new credential for the current user.
// Returns { credentialId, rawIdBase64, transports } or null on failure.
export const registerCredential = async (user) => {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userIdBytes = new TextEncoder().encode(String(user._id));

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "MeetMesh",
          // Omit rp.id — Chrome/Edge default to current origin, which is what we want
          // on localhost. For production over https://your-domain, this still works
          // because the origin matches the top-level domain.
        },
        user: {
          id: userIdBytes,
          name: user.email || user.username,
          displayName: user.username,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "none",
      },
    });

    if (!credential) return null;

    return {
      credentialId: credential.id,
      rawIdBase64: bufferToBase64(credential.rawId),
      transports:
        typeof credential.response?.getTransports === "function"
          ? credential.response.getTransports()
          : [],
    };
  } catch (err) {
    console.error("registerCredential failed:", err);
    return null;
  }
};

// Assert an existing credential for the current user.
// Returns true on success, false on failure.
export const assertCredential = async (storedWebauthn) => {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const allowCredentials = [];
    if (storedWebauthn?.rawIdBase64) {
      allowCredentials.push({
        type: "public-key",
        id: base64ToBuffer(storedWebauthn.rawIdBase64),
        transports:
          storedWebauthn.transports?.length > 0
            ? storedWebauthn.transports
            : undefined,
      });
    } else if (storedWebauthn?.credentialId) {
      // Fallback — this only works in some browsers
      allowCredentials.push({
        type: "public-key",
        id: new TextEncoder().encode(storedWebauthn.credentialId),
      });
    }

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
        allowCredentials,
      },
    });

    return !!assertion;
  } catch (err) {
    console.error("assertCredential failed:", err);
    return false;
  }
};