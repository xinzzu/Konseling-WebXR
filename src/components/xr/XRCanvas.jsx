import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore, XROrigin, useXR, PointerEvents } from "@react-three/xr";
import * as THREE from "three";
import useGameStore from "../../store/useGameStore";

// Create XR store for VR session management
export const xrStore = createXRStore();

/**
 * XRStateSync - Komponen untuk sync XR state ke game store
 */
function XRStateSync() {
  const { isPresenting } = useXR();
  
  useEffect(() => {
    useGameStore.setState({ isInVR: isPresenting });
  }, [isPresenting]);
  
  return null;
}

/**
 * XRCanvas - Canvas wrapper untuk 3D scene dengan dukungan WebXR
 * @react-three/xr v6 automatically renders controllers when in XR session
 * PointerEvents enables controller interaction with 3D UI
 */
export default function XRCanvas({ children }) {
  return (
    <Canvas
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{ 
        fov: 70, 
        position: [0, 1.6, 3],
        near: 0.1,
        far: 1000
      }}
      shadows
      dpr={[1, 2]}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%' 
      }}
      onCreated={({ scene }) => {
        // Set background color
        scene.background = new THREE.Color(0x1a1a2e);
      }}
    >
      <XR store={xrStore}>
        <XROrigin />
        <XRStateSync />
        {/* PointerEvents untuk interact dengan controller di VR */}
        <PointerEvents batchEvents={false} />
        {children}
      </XR>
    </Canvas>
  );
}
