import React, { useState, useEffect } from "react";
import { useXRStore } from "@react-three/xr";
import { xrStore } from "./XRCanvas";

/**
 * VRButton - Tombol untuk masuk/keluar VR mode
 */
export default function VRButton() {
  const [isInVR, setIsInVR] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check WebXR support
    async function checkSupport() {
      try {
        if (navigator.xr) {
          const supported = await navigator.xr.isSessionSupported('immersive-vr');
          setIsSupported(supported);
        } else {
          // iwer emulator might add support
          setIsSupported(true);
        }
      } catch {
        setIsSupported(true); // Assume emulator will work
      }
      setChecking(false);
    }
    checkSupport();

    // Listen to XR session state from store
    const unsubscribe = xrStore.subscribe((state) => {
      setIsInVR(!!state.session);
    });

    return () => unsubscribe();
  }, []);

  const handleClick = async () => {
    try {
      if (isInVR) {
        // Exit VR
        const state = xrStore.getState();
        if (state.session) {
          await state.session.end();
        }
      } else {
        // Enter VR
        await xrStore.enterVR();
      }
    } catch (error) {
      console.error('VR Error:', error);
    }
  };

  if (checking) return null;

  return (
    <button 
      onClick={handleClick}
      style={{
        ...styles.button,
        background: isInVR 
          ? 'linear-gradient(135deg, #f44336, #d32f2f)' 
          : 'linear-gradient(135deg, #2196F3, #1976D2)',
        boxShadow: isInVR 
          ? '0 5px 25px rgba(244,67,54,0.4)' 
          : '0 5px 25px rgba(33,150,243,0.4)',
      }}
    >
      {isInVR ? '🚪 Keluar VR' : '🥽 Masuk VR'}
    </button>
  );
}

const styles = {
  button: {
    position: 'fixed',
    bottom: '25px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '16px 36px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    fontFamily: 'inherit',
  },
};
