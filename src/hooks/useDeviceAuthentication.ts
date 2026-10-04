'use client';
import { useEffect, useState } from 'react';

// Capability detection only: never prompts for or creates a credential on mount.
export function useDeviceAuthentication() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(window.isSecureContext && typeof window.PublicKeyCredential !== 'undefined');
  }, []);
  return supported;
}
