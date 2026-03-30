import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskGraph3D from './components/TaskGraph3D';
import ControlPanel from './components/ControlPanel';
import TaskModal from './components/TaskModal';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [relations, setRelations] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    tag: 'all'
  });

  // Load tasks and relations
  useEffect(() => {
    loadTasks();
    loadRelations();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    if (filters.tag !== 'all') {
      filtered = filtered.filter(task => task.tag === filters.tag);
    }
    
    setFilteredTasks(filtered);
  }, [tasks, filters]);

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      console.log('Загружено задач:', response.data.length, response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadRelations = async () => {
    try {
      const response = await axios.get('/api/relations');
      setRelations(response.data);
    } catch (error) {
      console.error('Error loading relations:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await axios.post('/api/tasks', taskData);
      loadTasks();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      await axios.put(`/api/tasks/${id}`, taskData);
      loadTasks();
      setShowModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`);
      loadTasks();
      loadRelations();
      setShowModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCreateRelation = async (sourceId, targetId, type) => {
    try {
      await axios.post('/api/relations', {
        source_id: sourceId,
        target_id: targetId,
        relation_type: type
      });
      loadRelations();
    } catch (error) {
      console.error('Error creating relation:', error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleAddNewTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  return (
    <div className="App">
      <ControlPanel
        onAddTask={handleAddNewTask}
        onImport={() => {
          loadTasks();
          loadRelations();
        }}
        filters={filters}
        setFilters={setFilters}
        tasks={tasks}
      />
      
      <TaskGraph3D
        tasks={filteredTasks}
        relations={relations}
        onTaskClick={handleTaskClick}
        onRelationCreated={() => {
          loadRelations();
        }}
        onTasksUpdate={() => {
          loadTasks();
        }}
      />

      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
          onCreate={handleCreateTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

export default App;
