import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

function SearchBar({ tasks, onTaskSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      // Case-insensitive partial match (ilike)
      const query = searchQuery.toLowerCase();
      const filtered = tasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.symbol.toLowerCase().includes(query) ||
        task.id.toString().includes(query)
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, tasks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTask = (task) => {
    onTaskSelect(task);
    setSearchQuery('');
    setShowResults(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'blocked': return '🚫';
      default: return '📝';
    }
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Поиск задачи..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => {
              setSearchQuery('');
              setShowResults(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            Найдено: {searchResults.length}
          </div>
          {searchResults.map(task => (
            <div
              key={task.id}
              className="search-result-item"
              onClick={() => handleSelectTask(task)}
            >
              <div className="result-symbol">{task.symbol}</div>
              <div className="result-info">
                <div className="result-title">{task.title}</div>
                <div className="result-meta">
                  <span 
                    className="result-status"
                    style={{ color: getStatusColor(task.status) }}
                  >
                    {getStatusText(task.status)}
                  </span>
                  <span className="result-id">ID: {task.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchQuery && (
        <div className="search-results">
          <div className="no-results">
            ❌ Ничего не найдено
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
