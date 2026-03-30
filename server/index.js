const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { tasks, relations } = require('./database');
const { parseExcelFile } = require('./importTasks');

const app = express();
const PORT = 5001; // Изменен с 5000 на 5001 (5000 занят AirPlay)

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// CORS Configuration - ВАЖНО: должно быть ПЕРЕД другими middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(bodyParser.json());

// Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    res.json(tasks.getAll());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = tasks.getById(req.params.id);
    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
app.post('/api/tasks', (req, res) => {
  try {
    const newTask = tasks.create(req.body);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const updatedTask = tasks.update(req.params.id, req.body);
    if (updatedTask) {
      res.json(updatedTask);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const deleted = tasks.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Task deleted successfully' });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all relations
app.get('/api/relations', (req, res) => {
  try {
    res.json(relations.getAll());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create relation
app.post('/api/relations', (req, res) => {
  try {
    const newRelation = relations.create(req.body);
    res.status(201).json(newRelation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete relation
app.delete('/api/relations/:id', (req, res) => {
  try {
    const deleted = relations.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Relation deleted successfully' });
    } else {
      res.status(404).json({ error: 'Relation not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import tasks from Excel
app.post('/api/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { tasks: importedTasks, relations: importedRelations } = parseExcelFile(req.file.buffer);
    
    // Clear existing data and import new
    const database = require('./database');
    const db = require('./database');
    
    // Access the internal db object to replace data
    const fs = require('fs');
    const path = require('path');
    const DB_PATH = path.join(__dirname, 'data.json');
    
    let nextTaskId = Math.max(...importedTasks.map(t => t.id), 0) + 1;
    let nextRelationId = 1;
    
    // Assign IDs to relations
    importedRelations.forEach((rel, idx) => {
      rel.id = nextRelationId++;
    });
    
    // Add timestamps to tasks
    const now = new Date().toISOString();
    importedTasks.forEach(task => {
      task.created_at = now;
      task.updated_at = now;
    });
    
    const newData = {
      tasks: importedTasks,
      relations: importedRelations,
      nextTaskId,
      nextRelationId
    };
    
    fs.writeFileSync(DB_PATH, JSON.stringify(newData, null, 2));
    
    res.json({
      message: 'Import successful',
      tasksImported: importedTasks.length,
      relationsCreated: importedRelations.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
