import React, { useState } from 'react';
import SymbolLegend from './SymbolLegend';
import ImportModal from './ImportModal';
import './ControlPanel.css';

function ControlPanel({ onAddTask, onImport, filters, setFilters, tasks }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const uniqueTags = [...new Set(tasks.map(t => t.tag))];

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1>📊 Task Planner 3D</h1>
      </div>

      <button className="add-task-btn" onClick={onAddTask}>
        ➕ Добавить задачу
      </button>

      <button className="import-btn" onClick={() => setShowImportModal(true)}>
        📂 Импорт из Excel
      </button>

      <div className="filters">
        <div className="filter-group">
          <label>Статус:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">Все</option>
            <option value="todo">📝 К выполнению</option>
            <option value="in_progress">🔄 В работе</option>
            <option value="blocked">🚫 Заблокирована</option>
            <option value="completed">✅ Завершена</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Тег:</label>
          <select
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
          >
            <option value="all">Все</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="legend">
        <h3>Легенда:</h3>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6b7280' }}></span>
          <span>К выполнению</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3b82f6' }}></span>
          <span>В работе</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ef4444' }}></span>
          <span>Заблокирована</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#10b981' }}></span>
          <span>Завершена</span>
        </div>
      </div>

      <div className="stats">
        <h3>Статистика:</h3>
        <p>Всего задач: {tasks.length}</p>
        <p>В работе: {tasks.filter(t => t.status === 'in_progress').length}</p>
        <p>Завершено: {tasks.filter(t => t.status === 'completed').length}</p>
      </div>

      <SymbolLegend tasks={tasks} />

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={onImport}
        />
      )}
    </div>
  );
}

export default ControlPanel;
