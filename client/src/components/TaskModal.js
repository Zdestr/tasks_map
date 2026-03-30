import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TAGS = ['general', 'work', 'personal', 'urgent', 'research', 'design', 'development', 'bug', 'feature'];

function TaskModal({ task, onClose, onCreate, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    tag: 'general',
    symbol: '⭐',
    position_r: 5 + Math.random() * 3,
    position_theta: Math.random() * Math.PI * 2,
    position_phi: Math.random() * Math.PI
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        tag: task.tag,
        symbol: task.symbol,
        position_r: task.position_r,
        position_theta: task.position_theta,
        position_phi: task.position_phi
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task) {
      onUpdate(task.id, formData);
    } else {
      onCreate(formData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      onDelete(task.id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Редактировать задачу' : 'Новая задача'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Введите название задачи"
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              placeholder="Добавьте описание..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Статус *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="todo">📝 К выполнению</option>
                <option value="in_progress">🔄 В работе</option>
                <option value="blocked">🚫 Заблокирована</option>
                <option value="completed">✅ Завершена</option>
              </select>
            </div>

            <div className="form-group">
              <label>Тег *</label>
              <select
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              >
                {TAGS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Символ * (введите любой символ или emoji)</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.substring(0, 5) })}
              placeholder="Например: 📝, A, 🔥, #1"
              maxLength="5"
              style={{ fontSize: '24px', textAlign: 'center' }}
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Можно использовать emoji, буквы, цифры или символы (до 5 символов)
            </small>
          </div>

          <div className="form-group">
            <label>Позиция в сферических координатах</label>
            <div className="position-inputs">
              <div className="coord-input">
                <label>r (радиус)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max="25"
                  value={formData.position_r}
                  onChange={(e) => setFormData({ ...formData, position_r: parseFloat(e.target.value) })}
                />
              </div>
              <div className="coord-input">
                <label>θ (theta)</label>
                <input
                  type="number"
                  step="any"
                  min={-Math.PI * 2}
                  max={Math.PI * 2}
                  value={formData.position_theta}
                  onChange={(e) => setFormData({ ...formData, position_theta: parseFloat(e.target.value) })}
                />
              </div>
              <div className="coord-input">
                <label>φ (phi)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={Math.PI}
                  value={formData.position_phi}
                  onChange={(e) => setFormData({ ...formData, position_phi: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              r: расстояние от центра (1-15), θ: угол по окружности (0-{(Math.PI * 2).toFixed(2)}), φ: угол по вертикали (0-{Math.PI.toFixed(2)})
            </small>
          </div>

          <div className="modal-actions">
            {task && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                🗑️ Удалить
              </button>
            )}
            <button type="button" className="cancel-btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="submit-btn">
              {task ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
