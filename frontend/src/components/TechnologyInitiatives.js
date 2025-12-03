import React from 'react';
import './TechnologyInitiatives.css';

function TechnologyInitiatives({ initiatives }) {
  if (!initiatives || initiatives.length === 0) {
    return (
      <div className="technology-initiatives">
        <h2>Technology Initiatives</h2>
        <p>No technology initiatives found</p>
      </div>
    );
  }

  return (
    <div className="technology-initiatives">
      <h2>Technology Initiatives</h2>
      <p className="subtitle">Grouped by Component</p>

      <div className="initiatives-list">
        {initiatives.map((initiative, index) => (
          <div key={index} className="initiative-card">
            <div className="initiative-header">
              <h3>{initiative.name}</h3>
              <span className="initiative-stats">
                {initiative.completed} / {initiative.total} issues
              </span>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${initiative.completionPercentage}%`,
                    backgroundColor: initiative.completionPercentage === 100
                      ? '#00875A'
                      : initiative.completionPercentage >= 50
                      ? '#0052CC'
                      : '#FF5630'
                  }}
                >
                  <span className="progress-text">
                    {initiative.completionPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="initiative-breakdown">
              <div className="breakdown-item completed">
                <span className="breakdown-label">Completed</span>
                <span className="breakdown-value">{initiative.completed}</span>
              </div>
              <div className="breakdown-item in-progress">
                <span className="breakdown-label">In Progress</span>
                <span className="breakdown-value">{initiative.inProgress}</span>
              </div>
              <div className="breakdown-item todo">
                <span className="breakdown-label">To Do</span>
                <span className="breakdown-value">{initiative.todo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechnologyInitiatives;
