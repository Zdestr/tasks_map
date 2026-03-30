import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function CameraAnimator({ targetPosition, targetLookAt, controlsRef, onComplete }) {
  const { camera } = useThree();
  const animating = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const targetLookAtPos = useRef(new THREE.Vector3());
  const progress = useRef(0);

  useEffect(() => {
    if (targetPosition) {
      // Start animation
      animating.current = true;
      startPos.current.copy(camera.position);
      targetPos.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      
      // Save current and target lookAt positions
      if (controlsRef?.current) {
        startLookAt.current.copy(controlsRef.current.target);
      }
      if (targetLookAt) {
        targetLookAtPos.current.set(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
      } else {
        targetLookAtPos.current.set(0, 0, 0); // Default to origin
      }
      
      progress.current = 0;
    }
  }, [targetPosition, targetLookAt, camera, controlsRef]);

  useFrame(() => {
    if (animating.current && progress.current < 1) {
      progress.current += 0.03; // Animation speed (slower for smoother)

      if (progress.current >= 1) {
        // Animation complete
        camera.position.copy(targetPos.current);
        
        // Also set final lookAt
        if (controlsRef?.current) {
          controlsRef.current.target.copy(targetLookAtPos.current);
        }
        
        animating.current = false;
        progress.current = 0;
        if (onComplete) {
          onComplete();
        }
      } else {
        // Smooth interpolation (easeInOutCubic)
        const t = progress.current < 0.5
          ? 4 * progress.current * progress.current * progress.current
          : 1 - Math.pow(-2 * progress.current + 2, 3) / 2;
        
        // Animate camera position
        camera.position.lerpVectors(startPos.current, targetPos.current, t);
        
        // Animate OrbitControls target (lookAt point)
        if (controlsRef?.current) {
          const currentLookAt = new THREE.Vector3();
          currentLookAt.lerpVectors(startLookAt.current, targetLookAtPos.current, t);
          controlsRef.current.target.copy(currentLookAt);
        }
      }
    }
  });

  return null;
}

export default CameraAnimator;
