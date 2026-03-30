import React, { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';

// Convert Cartesian to spherical
function cartesianToSpherical(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z) || 0.1;
  const theta = Math.atan2(y, x);
  const phi = Math.acos(Math.max(-1, Math.min(1, z / r)));
  return { r, theta, phi };
}

// Convert spherical to Cartesian
function sphericalToCartesian(r, theta, phi) {
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi)
  };
}

// Arrow gizmo component
function AxisArrow({ axis, color, position, onDragStart, onDragEnd, dragging, length = 2 }) {
  const { gl } = useThree();
  const [hovered, setHovered] = useState(false);

  const arrowEnd = { x: 0, y: 0, z: 0 };
  const rotation = [0, 0, 0];
  
  if (axis === 'x') {
    arrowEnd.x = length;
    rotation[2] = -Math.PI / 2;
  } else if (axis === 'y') {
    arrowEnd.y = length;
  } else if (axis === 'z') {
    arrowEnd.z = length;
    rotation[0] = Math.PI / 2;
  }

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Line */}
      <Line
        points={[[0, 0, 0], [arrowEnd.x, arrowEnd.y, arrowEnd.z]]}
        color={color}
        lineWidth={dragging === axis ? 5 : 3}
      />
      
      {/* Arrow cone */}
      <mesh
        position={[arrowEnd.x, arrowEnd.y, arrowEnd.z]}
        rotation={rotation}
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart(axis);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          gl.domElement.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!dragging) gl.domElement.style.cursor = 'auto';
        }}
      >
        <coneGeometry args={[0.15, 0.4, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || dragging === axis ? 0.8 : 0.4}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[
          arrowEnd.x * 1.3,
          arrowEnd.y * 1.3,
          arrowEnd.z * 1.3
        ]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {axis.toUpperCase()}
      </Text>
    </group>
  );
}

// Interactive control for moving node with axis arrows
function NodeGizmo({ task, position, onPositionChange, onSave, controlsRef, children = [] }) {
  const [dragging, setDragging] = useState(null);
  const { camera, gl } = useThree();
  const [startPos, setStartPos] = useState(position);
  const [currentPos, setCurrentPos] = useState(position);
  const [childrenOffsets, setChildrenOffsets] = useState([]);

  const handleDragStart = (axis) => {
    setDragging(axis);
    setStartPos(currentPos);
    gl.domElement.style.cursor = 'grabbing';
    
    // Calculate relative offsets for all children
    if (children.length > 0) {
      const offsets = children.map(child => ({
        id: child.id,
        offset: {
          r: child.position_r - task.position_r,
          theta: child.position_theta - task.position_theta,
          phi: child.position_phi - task.position_phi
        }
      }));
      setChildrenOffsets(offsets);
    }
    
    // Disable camera controls during drag
    if (controlsRef?.current) {
      controlsRef.current.enabled = false;
    }
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;

    // Calculate movement based on mouse delta
    const movementSpeed = 0.02;
    let newPos = { ...currentPos };

    if (dragging === 'x') {
      newPos.x += e.movementX * movementSpeed;
    } else if (dragging === 'y') {
      newPos.y -= e.movementY * movementSpeed;
    } else if (dragging === 'z') {
      newPos.z += e.movementY * movementSpeed; // Fixed: was -= now +=
    }

    setCurrentPos(newPos);
    
    // Convert to spherical and update
    const spherical = cartesianToSpherical(newPos.x, newPos.y, newPos.z);
    onPositionChange(spherical.r, spherical.theta, spherical.phi, childrenOffsets);
  };

  const handlePointerUp = () => {
    if (dragging) {
      setDragging(null);
      gl.domElement.style.cursor = 'auto';
      
      // Re-enable camera controls
      if (controlsRef?.current) {
        controlsRef.current.enabled = true;
      }
      
      // Convert final position to spherical and save (with children)
      const spherical = cartesianToSpherical(currentPos.x, currentPos.y, currentPos.z);
      onSave(spherical.r, spherical.theta, spherical.phi, childrenOffsets);
    }
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragging, currentPos]);

  // Update current position when task position changes externally
  useEffect(() => {
    const cartesian = sphericalToCartesian(task.position_r, task.position_theta, task.position_phi);
    setCurrentPos(cartesian);
  }, [task.position_r, task.position_theta, task.position_phi]);

  return (
    <group>
      {/* X axis - Red */}
      <AxisArrow
        axis="x"
        color="#ef4444"
        position={currentPos}
        onDragStart={handleDragStart}
        dragging={dragging}
      />

      {/* Y axis - Green */}
      <AxisArrow
        axis="y"
        color="#10b981"
        position={currentPos}
        onDragStart={handleDragStart}
        dragging={dragging}
      />

      {/* Z axis - Blue */}
      <AxisArrow
        axis="z"
        color="#3b82f6"
        position={currentPos}
        onDragStart={handleDragStart}
        dragging={dragging}
      />
    </group>
  );
}

export default NodeGizmo;
