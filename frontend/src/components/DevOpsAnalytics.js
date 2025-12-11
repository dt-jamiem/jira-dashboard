import React from 'react';
import './DevOpsAnalytics.css';

function DevOpsAnalytics({ analytics }) {
  if (!analytics) {
    return (
      <div className="devops-analytics">
        <h2>DevOps Insights (Last 30 Days)</h2>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const {
    trends,
    ageData
  } = analytics;

  // Extract metrics from trends data
  const resolutionMetrics = trends?.resolutionMetrics || {};
  const currentMetrics = ageData?.currentMetrics || {};

  // Target thresholds
  const RESOLUTION_TIME_TARGET = 5; // days
  const RESOLUTION_RATE_TARGET = 90; // percent

  return (
    <div className="devops-analytics">
      <h2>DevOps Insights (Last 30 Days)</h2>
      <p className="subtitle">Project DTI - DevOps Team</p>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-value">{resolutionMetrics.totalCreated || 0}</div>
          <div className="summary-label">Total Requests</div>
          <div className="summary-subtext">created in period</div>
        </div>
        <div className={`summary-card ${resolutionMetrics.resolutionRate >= RESOLUTION_RATE_TARGET ? 'success' : 'warning'}`}>
          <div className="summary-value">{resolutionMetrics.resolutionRate || 0}%</div>
          <div className="summary-label">Resolution Rate</div>
          <div className="summary-subtext">{resolutionMetrics.totalResolved || 0} resolved</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{currentMetrics.totalOpen || 0}</div>
          <div className="summary-label">Open Tickets</div>
          <div className="summary-subtext">avg age: {currentMetrics.avgAge || 0} days</div>
        </div>
        <div className={`summary-card ${resolutionMetrics.avgResolutionTimeDays <= RESOLUTION_TIME_TARGET ? 'success' : 'warning'}`}>
          <div className="summary-value">{resolutionMetrics.avgResolutionTimeDays || 0}</div>
          <div className="summary-label">Avg Resolution Time</div>
          <div className="summary-subtext">days (target: ≤{RESOLUTION_TIME_TARGET})</div>
        </div>
      </div>

      {/* Key Insights Section */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-list">
          {/* Resolution Performance Insight */}
          {resolutionMetrics.resolutionRate >= 100 ? (
            <div className="insight-item success">
              <span className="insight-icon">✅</span>
              <span className="insight-text">
                <strong>Clearing backlog:</strong> {resolutionMetrics.totalResolved} tickets resolved vs {resolutionMetrics.totalCreated} created ({resolutionMetrics.resolutionRate}% resolution rate)
              </span>
            </div>
          ) : resolutionMetrics.resolutionRate >= 90 ? (
            <div className="insight-item">
              <span className="insight-icon">📊</span>
              <span className="insight-text">
                <strong>Steady state:</strong> Resolving {resolutionMetrics.resolutionRate}% of created tickets (target: ≥{RESOLUTION_RATE_TARGET}%)
              </span>
            </div>
          ) : (
            <div className="insight-item warning">
              <span className="insight-icon">⚠️</span>
              <span className="insight-text">
                <strong>Backlog building:</strong> Only {resolutionMetrics.resolutionRate}% resolution rate ({resolutionMetrics.totalResolved} resolved vs {resolutionMetrics.totalCreated} created)
              </span>
            </div>
          )}

          {/* Resolution Speed */}
          {resolutionMetrics.avgResolutionTimeDays > 0 && (
            <div className={`insight-item ${resolutionMetrics.avgResolutionTimeDays > RESOLUTION_TIME_TARGET ? 'warning' : 'success'}`}>
              <span className="insight-icon">{resolutionMetrics.avgResolutionTimeDays > RESOLUTION_TIME_TARGET ? '⏱️' : '⚡'}</span>
              <span className="insight-text">
                <strong>Resolution speed:</strong> {resolutionMetrics.avgResolutionTimeDays} day average
                {resolutionMetrics.avgResolutionTimeDays <= RESOLUTION_TIME_TARGET ? ' - meeting target!' : ' - exceeds target'}
              </span>
            </div>
          )}

          {/* Open Tickets Age */}
          {currentMetrics.avgAge > 0 && (
            <div className={`insight-item ${currentMetrics.avgAge > 14 ? 'warning' : ''}`}>
              <span className="insight-icon">📅</span>
              <span className="insight-text">
                <strong>Open ticket age:</strong> Average of {currentMetrics.avgAge} days across {currentMetrics.totalOpen} open tickets
                {currentMetrics.avgAge > 14 && ' - consider prioritizing older tickets'}
              </span>
            </div>
          )}

          {/* Oldest Ticket Warning */}
          {currentMetrics.oldestTicketAge > 30 && (
            <div className="insight-item warning">
              <span className="insight-icon">🚩</span>
              <span className="insight-text">
                <strong>Aging ticket alert:</strong> Oldest ticket is {currentMetrics.oldestTicketAge} days old - may need attention
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DevOpsAnalytics;
