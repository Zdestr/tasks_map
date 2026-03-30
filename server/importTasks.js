const xlsx = require('xlsx');

// Calculate task depth in parent chain
function calculateDepth(taskId, tasks, visited = new Set()) {
  if (visited.has(taskId)) return 0; // Circular dependency protection
  visited.add(taskId);
  
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.parent_id) return 0;
  
  return 1 + calculateDepth(task.parent_id, tasks, visited);
}

// Group tasks by symbol and calculate positions
function calculateTaskPositions(tasks) {
  // Calculate depths
  tasks.forEach(task => {
    task.depth = calculateDepth(task.id, tasks);
  });
  
  // Group by symbol
  const symbolGroups = {};
  tasks.forEach(task => {
    if (!symbolGroups[task.symbol]) {
      symbolGroups[task.symbol] = [];
    }
    symbolGroups[task.symbol].push(task);
  });
  
  // Assign positions
  const symbols = Object.keys(symbolGroups);
  const angleStep = (Math.PI * 2) / symbols.length;
  
  symbols.forEach((symbol, symbolIndex) => {
    const groupTasks = symbolGroups[symbol];
    const baseTheta = symbolIndex * angleStep;
    
    groupTasks.forEach((task, taskIndex) => {
      // Depth: closer to center (lower r) for root tasks
      // Increased spacing for many tasks
      const r = 5 + task.depth * 4; // 5-25 range based on depth
      
      // Spread tasks with same symbol in a cone (букетом)
      const thetaSpread = 0.8; // ~46 degrees horizontal spread
      const theta = baseTheta + (taskIndex / groupTasks.length) * thetaSpread - thetaSpread / 2;
      
      // Phi: add significant vertical variation (3D букет)
      const phiBase = Math.PI / 2; // Start from equator
      const phiVariation = Math.sin(taskIndex * 2.4) * 0.7; // -0.7 to +0.7 radians variation
      const phiOffset = (taskIndex / groupTasks.length - 0.5) * 0.3; // Small linear offset
      const phi = phiBase + phiVariation + phiOffset;
      
      task.position_r = r;
      task.position_theta = theta;
      task.position_phi = phi;
    });
  });
  
  return tasks;
}

// Parse Excel file
function parseExcelFile(buffer) {
  console.log('📖 Parsing Excel file...');
  
  const workbook = xlsx.read(buffer, { header: 1 }); // Parse as array of arrays
  console.log(`📋 Sheets found: ${workbook.SheetNames.join(', ')}`);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays
  
  console.log(`📊 Rows parsed: ${data.length}`);
  
  const tasks = [];
  const relations = [];
  
  data.forEach((row, index) => {
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) return;
    
    // Parse by column position (0-indexed)
    // Айди задачи | Символ | название | родительская нода | список связанных нод | описание | статус
    const taskId = row[0] || (index + 1);  // Column A
    const symbol = row[1] || '⭐';           // Column B
    const title = row[2] || `Задача ${taskId}`; // Column C
    const parentId = row[3] || null;        // Column D
    const linkedNodes = row[4] || '';       // Column E
    const description = row[5] || '';       // Column F
    const status = row[6] || '';            // Column G
    
    console.log(`Row ${index + 1}: ID=${taskId}, Symbol=${symbol}, Title=${title}, Status=${status}`);
    
    // Normalize status - поддержка множества вариантов
    let normalizedStatus = 'todo';
    const statusStr = String(status || '').trim();
    
    // Если статус пустой или undefined - используем todo по умолчанию
    if (!statusStr || statusStr === '' || statusStr === 'undefined' || statusStr === 'null') {
      normalizedStatus = 'todo';
    } else {
      const statusLower = statusStr.toLowerCase();
    
    // В работе / In Progress
    if (statusLower === 'в работе' ||
        statusLower.includes('раб') ||
        statusLower.includes('прогресс') ||
        statusLower.includes('progress') ||
        statusLower === 'in_progress' ||
        statusLower === 'in progress') {
      normalizedStatus = 'in_progress';
    }
    // Заблокирован / Blocked
    else if (statusLower === 'заблокирован' ||
             statusLower === 'заблокирована' ||
             statusLower.includes('блок') ||
             statusLower.includes('block') ||
             statusLower === 'blocked') {
      normalizedStatus = 'blocked';
    }
    // Решен / Завершен / Completed
    else if (statusLower === 'решен' ||
             statusLower === 'решена' ||
             statusLower === 'решено' ||
             statusLower === 'завершен' ||
             statusLower === 'завершена' ||
             statusLower === 'завершено' ||
             statusLower === 'выполнен' ||
             statusLower === 'выполнена' ||
             statusLower === 'на приёмке' ||
             statusLower === 'на приемке' ||
             statusLower.includes('завер') ||
             statusLower.includes('complete') ||
             statusLower === 'completed' ||
             statusLower === 'done') {
      normalizedStatus = 'completed';
    }
      // Требуется информация / Начнём / Todo (всё остальное)
      else {
        normalizedStatus = 'todo';
      }
    }
    
    tasks.push({
      id: parseInt(taskId),
      symbol: String(symbol).substring(0, 5),
      title: String(title),
      parent_id: parentId ? parseInt(parentId) : null,
      linked_nodes: linkedNodes ? String(linkedNodes).split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : [],
      description: String(description),
      status: normalizedStatus,
      tag: 'general'
    });
  });
  
  // Calculate positions
  calculateTaskPositions(tasks);
  
  // Create relations
  tasks.forEach(task => {
    // Parent-child relation
    if (task.parent_id) {
      relations.push({
        source_id: task.parent_id,
        target_id: task.id,
        relation_type: 'parent_child'
      });
    }
    
    // Linked relations
    task.linked_nodes.forEach(linkedId => {
      if (linkedId !== task.id && !relations.some(r => 
        (r.source_id === task.id && r.target_id === linkedId) ||
        (r.source_id === linkedId && r.target_id === task.id)
      )) {
        relations.push({
          source_id: task.id,
          target_id: linkedId,
          relation_type: 'link'
        });
      }
    });
  });
  
  // Remove temporary fields
  tasks.forEach(task => {
    delete task.parent_id;
    delete task.linked_nodes;
  });
  
  return { tasks, relations };
}

module.exports = { parseExcelFile };
