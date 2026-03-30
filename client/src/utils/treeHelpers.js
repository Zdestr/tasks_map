// Find all children of a task recursively
export function findAllChildren(taskId, relations, tasks) {
  const children = [];
  const visited = new Set();
  
  function findChildrenRecursive(parentId) {
    if (visited.has(parentId)) return; // Prevent infinite loops
    visited.add(parentId);
    
    // Find direct children through parent_child relations
    const childRelations = relations.filter(
      rel => rel.relation_type === 'parent_child' && rel.source_id === parentId
    );
    
    childRelations.forEach(rel => {
      const childTask = tasks.find(t => t.id === rel.target_id);
      if (childTask && !children.find(c => c.id === childTask.id)) {
        children.push(childTask);
        findChildrenRecursive(childTask.id); // Recursively find grandchildren
      }
    });
  }
  
  findChildrenRecursive(taskId);
  return children;
}

// Calculate relative offset between two positions in spherical coordinates
export function calculateRelativeOffset(parentPos, childPos) {
  return {
    r: childPos.r - parentPos.r,
    theta: childPos.theta - parentPos.theta,
    phi: childPos.phi - parentPos.phi
  };
}

// Apply offset to a position
export function applyOffset(basePos, offset) {
  return {
    r: basePos.r + offset.r,
    theta: basePos.theta + offset.theta,
    phi: basePos.phi + offset.phi
  };
}
