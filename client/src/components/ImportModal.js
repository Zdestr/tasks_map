import React, { useState } from 'react';
import axios from 'axios';
import './ImportModal.css';

function ImportModal({ onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Пожалуйста, выберите файл .xlsx');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Выберите файл для импорта');
      return;
    }

    const confirmImport = window.confirm(
      '⚠️ ВНИМАНИЕ!\n\nЭто действие удалит все существующие задачи и связи!\n\nПродолжить импорт?'
    );

    if (!confirmImport) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Import success:', response.data);
      alert(`✅ Успешно импортировано:\n• Задач: ${response.data.tasksImported}\n• Связей: ${response.data.relationsCreated}`);
      
      // Force reload after import
      onImportSuccess();
      onClose();
      
      // Reload page to see new tasks
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template Excel content
    const template = `Айди задачи,Символ,название,родительская нода,список связанных нод,описание,статус
1,🎯,Главная задача,,2,Корневая задача проекта,todo
2,🎯,Подзадача 1,1,"3,4",Первая подзадача,in_progress
3,⚡,Важная задача,2,,Срочная задача,blocked
4,⚡,Еще задача,2,,Связанная задача,completed`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_tasks.csv';
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📂 Импорт задач из Excel</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="import-content">
          <div className="import-info">
            <h3>📋 Формат файла</h3>
            <p>Excel файл (.xlsx) должен содержать следующие колонки:</p>
            <ul>
              <li><strong>Айди задачи</strong> - уникальный номер (1, 2, 3...)</li>
              <li><strong>Символ</strong> - emoji или текст (до 5 символов)</li>
              <li><strong>название</strong> - название задачи</li>
              <li><strong>родительская нода</strong> - ID родительской задачи (пусто если корневая)</li>
              <li><strong>список связанных нод</strong> - ID связанных задач через запятую (например: 2,3,4)</li>
              <li><strong>описание</strong> - описание задачи</li>
              <li><strong>статус</strong> - todo, in_progress, blocked, completed</li>
            </ul>
          </div>

          <div className="import-rules">
            <h3>🎯 Правила позиционирования</h3>
            <ul>
              <li>✅ Задачи с одинаковым символом будут сгруппированы рядом</li>
              <li>✅ Корневые задачи (без родителя) ближе к центру</li>
              <li>✅ Чем глубже задача в цепочке, тем дальше от центра</li>
              <li>✅ Автоматическое создание связей родитель→потомок</li>
            </ul>
          </div>

          <div className="file-upload">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              id="file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="file-input-label">
              📎 Выбрать файл .xlsx
            </label>
            {file && (
              <div className="file-selected">
                ✓ Выбран: <strong>{file.name}</strong>
              </div>
            )}
          </div>

          {error && (
            <div className="import-error">
              ❌ {error}
            </div>
          )}

          <div className="import-actions">
            <button
              className="template-btn"
              onClick={handleDownloadTemplate}
            >
              📥 Скачать шаблон CSV
            </button>
            
            <button
              className="import-btn"
              onClick={handleImport}
              disabled={!file || loading}
            >
              {loading ? '⏳ Импорт...' : '🚀 Импортировать'}
            </button>
          </div>

          <div className="import-warning">
            ⚠️ Импорт удалит все существующие задачи и связи!
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
