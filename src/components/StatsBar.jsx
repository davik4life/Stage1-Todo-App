import React from 'react';

function StatsBar({ todos }) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="stats-card">
      <div className="stats-header">
        <div>
          <span className="stats-title">Progress Overview</span>
          <p className="stats-subtitle">
            {completed} of {total} tasks completed
          </p>
        </div>
        <div className="stats-percentage">{percentage}%</div>
      </div>
      <div className="progress-track">
        <div
          className="progress-bar"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export default StatsBar;
