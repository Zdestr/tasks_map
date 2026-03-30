// Migration script to convert old Cartesian coordinates to spherical
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Convert Cartesian to spherical
function cartesianToSpherical(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  const theta = Math.atan2(y, x);
  const phi = Math.acos(z / (r || 1));
  return { r, theta, phi };
}

// Load and migrate
try {
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  console.log('Миграция координат задач...\n');
  
  let migrated = 0;
  data.tasks.forEach(task => {
    if (task.position_x !== undefined && task.position_r === undefined) {
      const spherical = cartesianToSpherical(task.position_x, task.position_y, task.position_z);
      
      console.log(`Задача "${task.title}":`);
      console.log(`  Старые: x=${task.position_x.toFixed(2)}, y=${task.position_y.toFixed(2)}, z=${task.position_z.toFixed(2)}`);
      console.log(`  Новые:  r=${spherical.r.toFixed(2)}, θ=${spherical.theta.toFixed(2)}, φ=${spherical.phi.toFixed(2)}\n`);
      
      task.position_r = spherical.r;
      task.position_theta = spherical.theta;
      task.position_phi = spherical.phi;
      
      // Remove old coordinates
      delete task.position_x;
      delete task.position_y;
      delete task.position_z;
      
      migrated++;
    }
  });
  
  if (migrated > 0) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Успешно мигрировано задач: ${migrated}`);
  } else {
    console.log('✅ Все задачи уже используют сферические координаты');
  }
} catch (error) {
  console.error('❌ Ошибка миграции:', error.message);
}
