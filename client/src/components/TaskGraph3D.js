import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import NodeGizmo from './NodeGizmo';
import SearchBar from './SearchBar';
import CameraAnimator from './CameraAnimator';
import axios from 'axios';
import { findAllChildren, calculateRelativeOffset, applyOffset } from '../utils/treeHelpers';
import './TaskGraph3D.css';

// Convert Cartesian to spherical coordinates
function cartesianToSpherical(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  const theta = Math.atan2(y, x);
  const phi = Math.acos(z / (r || 1));
  return { r, theta, phi };
}

// Convert spherical coordinates to Cartesian
function sphericalToCartesian(r, theta, phi) {
  // Handle undefined/NaN values
  if (r === undefined || isNaN(r) || theta === undefined || isNaN(theta) || phi === undefined || isNaN(phi)) {
    console.warn('Invalid spherical coordinates, using defaults:', { r, theta, phi });
    return [5, 0, 0]; // Default position
  }
  
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ];
}

// Get task position with fallback for old coordinate system
function getTaskPosition(task) {
  // If spherical coordinates exist, use them
  if (task.position_r !== undefined && !isNaN(task.position_r)) {
    return sphericalToCartesian(task.position_r, task.position_theta, task.position_phi);
  }
  
  // Fallback to Cartesian if they exist
  if (task.position_x !== undefined && !isNaN(task.position_x)) {
    console.log(`Задача "${task.title}" использует старые координаты, конвертирую...`);
    return [task.position_x, task.position_y, task.position_z];
  }
  
  // Default position if nothing is set
  console.warn(`Задача "${task.title}" не имеет координат, использую позицию по умолчанию`);
  return [5, 0, 0];
}

// Task Node Component
function TaskNode({ task, onClick, position, isSelected }) {
  const meshRef = useRef();
  const [hovered, setHovered] = React.useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const getColor = (status) => {
    switch (status) {
      case 'blocked':
        return '#ef4444'; // Red
      case 'in_progress':
        return '#3b82f6'; // Blue
      case 'completed':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(task);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[isSelected ? 0.4 : 0.25, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#fbbf24' : getColor(task.status)}
          emissive={isSelected ? '#fbbf24' : getColor(task.status)}
          emissiveIntensity={hovered || isSelected ? 0.7 : 0.2}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      {/* Symbol text - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, 0, 0.36]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {task.symbol}
        </Text>
      </Billboard>
      
      {/* Task title - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {task.title}
        </Text>
      </Billboard>
    </group>
  );
}

// Connection Line Component
function ConnectionLine({ start, end, type }) {
  const points = useMemo(() => {
    return [
      new THREE.Vector3(start[0], start[1], start[2]),
      new THREE.Vector3(end[0], end[1], end[2])
    ];
  }, [start, end]);

  const color = type === 'parent_child' ? '#fbbf24' : '#94a3b8'; // Yellow for parent-child, gray for link

  return (
    <Line
      points={points}
      color={color}
      lineWidth={type === 'parent_child' ? 3 : 1.5}
      dashed={type === 'link'}
      dashScale={50}
      dashSize={0.1}
      gapSize={0.05}
    />
  );
}

// Arrow Component for parent-child relationships
function Arrow({ start, end }) {
  const meshRef = useRef();
  
  useEffect(() => {
    if (meshRef.current) {
      // Calculate direction vector
      const direction = new THREE.Vector3(
        end[0] - start[0],
        end[1] - start[1],
        end[2] - start[2]
      ).normalize();
      
      // Position arrow near the end
      const arrowPos = new THREE.Vector3(
        end[0] - direction.x * 0.5,
        end[1] - direction.y * 0.5,
        end[2] - direction.z * 0.5
      );
      meshRef.current.position.copy(arrowPos);
      
      // Orient the cone to point along the direction
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(up, direction);
      meshRef.current.quaternion.copy(quaternion);
    }
  }, [start, end]);

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.15, 0.3, 8]} />
      <meshStandardMaterial color="#fbbf24" />
    </mesh>
  );
}

// Camera Position Tracker
function CameraTracker({ onPositionChange }) {
  const { camera } = useThree();
  
  useFrame(() => {
    onPositionChange({
      x: camera.position.x.toFixed(1),
      y: camera.position.y.toFixed(1),
      z: camera.position.z.toFixed(1)
    });
  });
  
  return null;
}

// Coordinate Axes Helper
function CoordinateAxes() {
  return (
    <group>
      {/* X axis - Red */}
      <Line points={[[0, 0, 0], [5, 0, 0]]} color="red" lineWidth={2} />
      <Text position={[5.5, 0, 0]} fontSize={0.3} color="red">X</Text>
      
      {/* Y axis - Green */}
      <Line points={[[0, 0, 0], [0, 5, 0]]} color="green" lineWidth={2} />
      <Text position={[0, 5.5, 0]} fontSize={0.3} color="green">Y</Text>
      
      {/* Z axis - Blue */}
      <Line points={[[0, 0, 0], [0, 0, 5]]} color="blue" lineWidth={2} />
      <Text position={[0, 0, 5.5]} fontSize={0.3} color="blue">Z</Text>
      
      {/* Center sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Main 3D Graph Component
function TaskGraph3D({ tasks, relations, onTaskClick, onRelationCreated, onTasksUpdate }) {
  const [selectedForLink, setSelectedForLink] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 25 });
  const [cameraLookAt, setCameraLookAt] = useState(null);
  const [selectedForMove, setSelectedForMove] = useState(null);
  const [moveMode, setMoveMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [tempPosition, setTempPosition] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null);
  const controlsRef = useRef();

  const handleTaskSearch = (task) => {
    // Calculate camera position: task position + offset
    const taskPos = getTaskPosition(task);
    const distance = 3; // Distance from task
    
    // Position camera at an angle from the task
    const cameraPos = [
      taskPos[0] + distance,
      taskPos[1] + distance * 0.5,
      taskPos[2] + distance * 0.5
    ];
    
    // Reset previous animation state before starting new one
    setCameraTarget(null);
    setCameraLookAt(null);
    setTimeout(() => {
      setCameraTarget(cameraPos);
      setCameraLookAt(taskPos); // Animate lookAt to task position
    }, 50);
  };

  const resetCamera = () => {
    // Smooth animation to default position and lookAt
    setCameraTarget([0, 0, 25]);
    setCameraLookAt([0, 0, 0]); // Animate lookAt back to center
  };

  useEffect(() => {
    console.log('TaskGraph3D - Количество задач:', tasks.length);
    tasks.forEach(task => {
      const pos = sphericalToCartesian(task.position_r, task.position_theta, task.position_phi);
      console.log(`Задача "${task.title}":`, {
        spherical: { r: task.position_r, θ: task.position_theta, φ: task.position_phi },
        cartesian: { x: pos[0].toFixed(2), y: pos[1].toFixed(2), z: pos[2].toFixed(2) }
      });
    });
  }, [tasks]);

  return (
    <div className="task-graph-container">
      {/* Camera position indicator */}
      <div className="camera-info">
        <div className="info-label">📍 Позиция камеры:</div>
        <div className="info-coords">X: {cameraPos.x} | Y: {cameraPos.y} | Z: {cameraPos.z}</div>
        <div className="info-label">📊 Задач на сцене: {tasks.length}</div>
      </div>
      {linkMode && (
        <div className="link-mode-banner">
          {selectedForLink
            ? `Выберите вторую задачу для связи с "${selectedForLink.title}". ESC для отмены.`
            : 'Режим создания связи: выберите первую задачу. ESC для отмены.'}
        </div>
      )}
      
      <SearchBar
        tasks={tasks}
        onTaskSelect={handleTaskSearch}
      />

      <div className="top-controls">
        <button
          className="control-button reset-camera"
          onClick={resetCamera}
          title="Вернуться к начальному виду"
        >
          🎯 Сброс
        </button>
        
        <button
          className={`control-button ${linkMode ? 'active' : ''}`}
          onClick={() => {
            setLinkMode(!linkMode);
            setSelectedForLink(null);
            setMoveMode(false);
            setSelectedForMove(null);
          }}
        >
          {linkMode ? '✓ Связи' : '🔗 Связи'}
        </button>

        <button
          className={`control-button ${moveMode ? 'active' : ''}`}
          onClick={() => {
            setMoveMode(!moveMode);
            setSelectedForMove(null);
            setLinkMode(false);
            setSelectedForLink(null);
          }}
        >
          {moveMode ? '✓ Движение' : '🎯 Движение'}
        </button>

        <button
          className={`control-button debug ${debugMode ? 'active' : ''}`}
          onClick={() => setDebugMode(!debugMode)}
          title="Показать координатные оси"
        >
          🐛
        </button>
      </div>

      <Canvas
        key={cameraKey}
        camera={{ position: [0, 0, 25], fov: 75 }}
        onPointerMissed={() => {
          if (linkMode) {
            setSelectedForLink(null);
          }
        }}
      >
        <CameraTracker onPositionChange={setCameraPos} />
        <CameraAnimator
          targetPosition={cameraTarget}
          targetLookAt={cameraLookAt}
          controlsRef={controlsRef}
          onComplete={() => {
            setCameraTarget(null);
            setCameraLookAt(null);
          }}
        />
        
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} />
        <pointLight position={[0, -10, 0]} intensity={0.5} />
        
        {/* Coordinate axes (only in debug mode) */}
        {debugMode && <CoordinateAxes />}
        
        {/* Render all task nodes */}
        {tasks.map((task) => {
          const position = sphericalToCartesian(
            task.position_r,
            task.position_theta,
            task.position_phi
          );
          
          return (
            <TaskNode
              key={task.id}
              task={task}
              onClick={(t) => {
                if (moveMode) {
                  setSelectedForMove(t);
                  setTempPosition({ r: t.position_r, theta: t.position_theta, phi: t.position_phi });
                } else if (linkMode) {
                  if (!selectedForLink) {
                    setSelectedForLink(t);
                  } else if (selectedForLink.id !== t.id) {
                    // Create link
                    const relationType = window.confirm('Создать связь родитель→потомок?\n\nОК = Родитель→Потомок (со стрелкой)\nОтмена = Простая связь (пунктир)')
                      ? 'parent_child'
                      : 'link';
                    
                    fetch('/api/relations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        source_id: selectedForLink.id,
                        target_id: t.id,
                        relation_type: relationType
                      })
                    }).then(() => {
                      // Don't reload page - just update data and reset link mode
                      if (onRelationCreated) {
                        onRelationCreated();
                      }
                      setSelectedForLink(null);
                      setLinkMode(false);
                    }).catch(err => {
                      console.error('Error creating relation:', err);
                      alert('Ошибка при создании связи');
                    });
                  }
                } else {
                  onTaskClick(t);
                }
              }}
              position={position}
              isSelected={selectedForLink && selectedForLink.id === task.id}
            />
          );
        })}

        {/* Render movement gizmo for selected task */}
        {moveMode && selectedForMove && (() => {
          const pos = tempPosition
            ? sphericalToCartesian(tempPosition.r, tempPosition.theta, tempPosition.phi)
            : getTaskPosition(selectedForMove);
          
          return (
            <NodeGizmo
              task={{
                ...selectedForMove,
                position_r: tempPosition?.r || selectedForMove.position_r,
                position_theta: tempPosition?.theta || selectedForMove.position_theta,
                position_phi: tempPosition?.phi || selectedForMove.position_phi
              }}
              position={pos}
              controlsRef={controlsRef}
              children={findAllChildren(selectedForMove.id, relations, tasks)}
              onPositionChange={(r, theta, phi, childrenOffsets) => {
                setTempPosition({ r, theta, phi });
              }}
              onSave={async (r, theta, phi, childrenOffsets) => {
                try {
                  // Update parent task
                  await axios.put(`/api/tasks/${selectedForMove.id}`, {
                    ...selectedForMove,
                    position_r: r,
                    position_theta: theta,
                    position_phi: phi
                  });
                  
                  // Update all children with their relative offsets
                  if (childrenOffsets && childrenOffsets.length > 0) {
                    for (const childOffset of childrenOffsets) {
                      const childTask = tasks.find(t => t.id === childOffset.id);
                      if (childTask) {
                        const newChildPos = applyOffset({ r, theta, phi }, childOffset.offset);
                        await axios.put(`/api/tasks/${childTask.id}`, {
                          ...childTask,
                          position_r: newChildPos.r,
                          position_theta: newChildPos.theta,
                          position_phi: newChildPos.phi
                        });
                      }
                    }
                  }
                  
                  if (onTasksUpdate) {
                    onTasksUpdate();
                  }
                } catch (err) {
                  console.error('Error updating task position:', err);
                  alert('Ошибка при сохранении позиции');
                }
              }}
            />
          );
        })()}

        {/* Render all connections */}
        {relations.map((relation) => {
          const sourceTask = tasks.find(t => t.id === relation.source_id);
          const targetTask = tasks.find(t => t.id === relation.target_id);
          
          if (!sourceTask || !targetTask) return null;

          const start = sphericalToCartesian(
            sourceTask.position_r,
            sourceTask.position_theta,
            sourceTask.position_phi
          );
          const end = sphericalToCartesian(
            targetTask.position_r,
            targetTask.position_theta,
            targetTask.position_phi
          );

          return (
            <group key={relation.id}>
              <ConnectionLine
                start={start}
                end={end}
                type={relation.relation_type}
              />
              {relation.relation_type === 'parent_child' && (
                <Arrow start={start} end={end} />
              )}
            </group>
          );
        })}

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}

export default TaskGraph3D;
