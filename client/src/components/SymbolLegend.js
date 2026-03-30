import React, { useState } from 'react';
import './SymbolLegend.css';

function SymbolLegend({ tasks }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique symbols from tasks
  const symbolMap = {};
  tasks.forEach(task => {
    if (task.symbol && !symbolMap[task.symbol]) {
      symbolMap[task.symbol] = {
        symbol: task.symbol,
        tag: task.tag,
        count: 1
      };
    } else if (task.symbol) {
      symbolMap[task.symbol].count++;
    }
  });

  const symbols = Object.values(symbolMap);

  if (symbols.length === 0) {
    return null;
  }

  return (
    <div className="symbol-legend">
      <button 
        className="legend-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        📖 Легенда символов {isExpanded ? '▼' : '▶'}
      </button>
      
      {isExpanded && (
        <div className="legend-content">
          <div className="legend-header">
            <p>Ваши символы и их значение:</p>
          </div>
          <div className="legend-items">
            {symbols.map(({ symbol, tag, count }) => (
              <div key={symbol} className="legend-item-custom">
                <span className="legend-symbol">{symbol}</span>
                <div className="legend-info">
                  <span className="legend-tag">{tag}</span>
                  <span className="legend-count">{count} задач{count > 1 ? 'и' : 'а'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="legend-tip">
            💡 Совет: Используйте уникальные символы для разных типов задач
          </div>
        </div>
      )}
    </div>
  );
}

export default SymbolLegend;
