const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Initialize database structure
let db = {
  tasks: [],
  relations: [],
  nextTaskId: 1,
  nextRelationId: 1
};

// Load database from file
function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      db = JSON.parse(data);
    } else {
      saveDatabase();
    }
  } catch (error) {
    console.error('Error loading database:', error);
    saveDatabase();
  }
}

// Save database to file
function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Tasks operations
const tasks = {
  getAll: () => {
    return db.tasks;
  },

  getById: (id) => {
    return db.tasks.find(task => task.id === parseInt(id));
  },

  create: (taskData) => {
    const newTask = {
      id: db.nextTaskId++,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'todo',
      tag: taskData.tag || 'general',
      symbol: taskData.symbol || '⭐',
      position_r: taskData.position_r !== undefined ? taskData.position_r : 5 + Math.random() * 3,
      position_theta: taskData.position_theta !== undefined ? taskData.position_theta : Math.random() * Math.PI * 2,
      position_phi: taskData.position_phi !== undefined ? taskData.position_phi : Math.random() * Math.PI,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.tasks.push(newTask);
    saveDatabase();
    return newTask;
  },

  update: (id, taskData) => {
    const index = db.tasks.findIndex(task => task.id === parseInt(id));
    if (index === -1) return null;

    db.tasks[index] = {
      ...db.tasks[index],
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      tag: taskData.tag,
      symbol: taskData.symbol,
      position_r: taskData.position_r,
      position_theta: taskData.position_theta,
      position_phi: taskData.position_phi,
      updated_at: new Date().toISOString()
    };

    saveDatabase();
    return db.tasks[index];
  },

  delete: (id) => {
    const index = db.tasks.findIndex(task => task.id === parseInt(id));
    if (index === -1) return false;

    db.tasks.splice(index, 1);
    // Also delete related relations
    db.relations = db.relations.filter(rel => 
      rel.source_id !== parseInt(id) && rel.target_id !== parseInt(id)
    );
    
    saveDatabase();
    return true;
  }
};

// Relations operations
const relations = {
  getAll: () => {
    return db.relations;
  },

  create: (relationData) => {
    const newRelation = {
      id: db.nextRelationId++,
      source_id: parseInt(relationData.source_id),
      target_id: parseInt(relationData.target_id),
      relation_type: relationData.relation_type || 'link'
    };

    db.relations.push(newRelation);
    saveDatabase();
    return newRelation;
  },

  delete: (id) => {
    const index = db.relations.findIndex(rel => rel.id === parseInt(id));
    if (index === -1) return false;

    db.relations.splice(index, 1);
    saveDatabase();
    return true;
  }
};

// Initialize database on module load
loadDatabase();

module.exports = { tasks, relations };
