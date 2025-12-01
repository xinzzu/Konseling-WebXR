import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useXRInputSourceState, useXR } from "@react-three/xr";
import * as THREE from "three";

/**
 * XRPointer - Custom ray pointer untuk VR controllers dan hand tracking
 * Menampilkan laser panjang yang bisa berinteraksi dengan UI
 */
export default function XRPointer() {
  const session = useXR((state) => state.session);
  
  if (!session) return null;
  
  return (
    <>
      {/* Controller rays */}
      <ControllerRay hand="left" color="#4fc3f7" />
      <ControllerRay hand="right" color="#4fc3f7" />
      
      {/* Hand rays - dari jari telunjuk */}
      <HandRay hand="left" color="#81d4fa" />
      <HandRay hand="right" color="#81d4fa" />
    </>
  );
}

/**
 * ControllerRay - Ray untuk controller
 */
function ControllerRay({ hand, color }) {
  const rayRef = useRef();
  const dotRef = useRef();
  const inputSource = useXRInputSourceState(hand);
  
  useFrame(() => {
    if (!rayRef.current || !inputSource) return;
    
    // Skip if this is a hand (not controller)
    if (inputSource.inputSource?.hand) {
      rayRef.current.visible = false;
      return;
    }
    
    rayRef.current.visible = true;
    
    // Get controller position and direction
    const controller = inputSource.object;
    if (!controller) return;
    
    // Update ray position to follow controller
    rayRef.current.position.copy(controller.position);
    rayRef.current.quaternion.copy(controller.quaternion);
    
    // Update dot at end of ray - 10 meter
    if (dotRef.current) {
      const forward = new THREE.Vector3(0, 0, -10);
      forward.applyQuaternion(controller.quaternion);
      dotRef.current.position.copy(controller.position).add(forward);
    }
  });
  
  return (
    <group ref={rayRef}>
      {/* Ray line - panjang 10 meter, transparan */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
        <cylinderGeometry args={[0.003, 0.003, 10, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.25}
        />
      </mesh>
      
      {/* Glow layer - outer glow - sangat transparan */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
        <cylinderGeometry args={[0.006, 0.006, 10, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.1}
        />
      </mesh>
      
      {/* Dot at end - lebih kecil dan transparan */}
      <mesh ref={dotRef} position={[0, 0, -10]}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Dot glow */}
      <mesh position={[0, 0, -10]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

/**
 * HandRay - Ray untuk hand tracking (dari ujung jari telunjuk)
 */
function HandRay({ hand, color }) {
  const rayRef = useRef();
  const dotRef = useRef();
  const inputSource = useXRInputSourceState(hand);
  
  // Temp vectors untuk kalkulasi
  const tempVec = useRef(new THREE.Vector3());
  const tempQuat = useRef(new THREE.Quaternion());
  const direction = useRef(new THREE.Vector3());
  
  useFrame((state) => {
    if (!rayRef.current || !inputSource) {
      if (rayRef.current) rayRef.current.visible = false;
      return;
    }
    
    // Only show for hands (not controllers)
    const xrHand = inputSource.inputSource?.hand;
    if (!xrHand) {
      rayRef.current.visible = false;
      return;
    }
    
    rayRef.current.visible = true;
    
    // Get index finger tip joint
    const indexTip = xrHand.get('index-finger-tip');
    const indexDip = xrHand.get('index-finger-phalanx-distal');
    
    if (!indexTip || !indexDip) {
      rayRef.current.visible = false;
      return;
    }
    
    // Get reference space
    const referenceSpace = state.gl.xr.getReferenceSpace();
    const frame = state.gl.xr.getFrame();
    
    if (!frame || !referenceSpace) return;
    
    try {
      // Get joint poses
      const tipPose = frame.getJointPose(indexTip, referenceSpace);
      const dipPose = frame.getJointPose(indexDip, referenceSpace);
      
      if (!tipPose || !dipPose) {
        rayRef.current.visible = false;
        return;
      }
      
      // Position ray at finger tip
      const tipPos = tipPose.transform.position;
      rayRef.current.position.set(tipPos.x, tipPos.y, tipPos.z);
      
      // Calculate direction from DIP to TIP (pointing direction)
      const dipPos = dipPose.transform.position;
      direction.current.set(
        tipPos.x - dipPos.x,
        tipPos.y - dipPos.y,
        tipPos.z - dipPos.z
      ).normalize();
      
      // Create quaternion to align ray with finger direction
      tempVec.current.set(0, 0, -1);
      tempQuat.current.setFromUnitVectors(tempVec.current, direction.current);
      rayRef.current.quaternion.copy(tempQuat.current);
      
      // Update dot at end of ray - 10 meter
      if (dotRef.current) {
        dotRef.current.position.set(
          tipPos.x + direction.current.x * 10,
          tipPos.y + direction.current.y * 10,
          tipPos.z + direction.current.z * 10
        );
      }
    } catch (e) {
      // Hand tracking may not be available
      rayRef.current.visible = false;
    }
  });
  
  return (
    <group ref={rayRef}>
      {/* Ray line - dari ujung jari telunjuk, 10 meter, transparan */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
        <cylinderGeometry args={[0.003, 0.002, 10, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.25}
        />
      </mesh>
      
      {/* Glow layer - sangat transparan */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
        <cylinderGeometry args={[0.006, 0.004, 10, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.1}
        />
      </mesh>
      
      {/* Glow effect on finger - lebih kecil */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.4}
        />
      </mesh>
      
      {/* Outer glow on finger - transparan */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Dot at end - kecil dan transparan */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      
      {/* Dot glow - sangat transparan */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
