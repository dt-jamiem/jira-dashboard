import React from 'react';
import './ServiceDeskAnalytics.css';

function ServiceDeskAnalytics({ analytics }) {
  if (!analytics) {
    return (
      <div className="service-desk-analytics">
        <h2>Service Desk Insights (Last 30 Days)</h2>
        <p>Loading analytics...</p>
      </div>
    );
  }

  // Use resolution rate from backend (matches Service Desk Resolution Metrics)
  const resolvedPercentage = analytics.resolutionRate || 0;
  const totalResolvedInPeriod = analytics.totalResolvedInPeriod || 0;

  // Get max values for bar chart scaling
  const maxRequestTypeCount = Math.max(...analytics.topRequestTypes.map(rt => rt.count));
  const maxAppCount = Math.max(...analytics.topApplications.map(app => app.count));
  const maxAssigneeCount = Math.max(...analytics.topAssignees.map(a => a.count));

  return (
    <div className="service-desk-analytics">
      <h2>Service Desk Insights (Last 30 Days)</h2>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-value">{analytics.totalTickets}</div>
          <div className="summary-label">Total Tickets</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{resolvedPercentage}%</div>
          <div className="summary-label">Resolution Rate</div>
          <div className="summary-subtext">{totalResolvedInPeriod} resolved</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{analytics.allCounts.issueTypes['[System] Incident'] + analytics.allCounts.issueTypes['[System] Problem'] + analytics.allCounts.issueTypes['Build Issue']}</div>
          <div className="summary-label">Incidents & Build Issues</div>
          <div className="summary-subtext">{Math.round(((analytics.allCounts.issueTypes['[System] Incident'] + analytics.allCounts.issueTypes['[System] Problem'] + analytics.allCounts.issueTypes['Build Issue']) / analytics.totalTickets) * 100)}% of all tickets</div>
        </div>
        <div className={`summary-card ${analytics.avgResolutionTimeDays > 5 ? 'warning' : ''}`}>
          <div className="summary-value">{analytics.avgResolutionTimeDays ? analytics.avgResolutionTimeDays.toFixed(1) : '0'}</div>
          <div className="summary-label">Avg Resolution Time</div>
          <div className="summary-subtext">days (target: 5)</div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="insights-section-top">
        <h3>Key Insights</h3>
        <div className="insights-list">
          <div className="insight-item">
            <span className="insight-icon">📊</span>
            <span className="insight-text">
              <strong>Access requests dominate:</strong> {analytics.topRequestTypes[0].count} access requests ({Math.round((analytics.topRequestTypes[0].count / analytics.totalTickets) * 100)}% of all tickets)
            </span>
          </div>
          {analytics.topAssignees[0] && analytics.topAssignees[0].count > analytics.totalTickets * 0.4 && (
            <div className="insight-item warning">
              <span className="insight-icon">⚠️</span>
              <span className="insight-text">
                <strong>Workload concentration:</strong> {analytics.topAssignees[0].name} handles {Math.round((analytics.topAssignees[0].count / analytics.totalTickets) * 100)}% of all tickets
              </span>
            </div>
          )}
          {analytics.topApplications.length > 0 && (
            <div className="insight-item">
              <span className="insight-icon">💻</span>
              <span className="insight-text">
                <strong>Most referenced technology:</strong> {analytics.topApplications[0].name} appears in {analytics.topApplications[0].count} tickets ({Math.round((analytics.topApplications[0].count / analytics.totalTickets) * 100)}%)
              </span>
            </div>
          )}
          {analytics.allCounts.issueTypes['Build Issue'] > 20 && (
            <div className="insight-item">
              <span className="insight-icon">🔧</span>
              <span className="insight-text">
                <strong>Build/deployment volume:</strong> {analytics.allCounts.issueTypes['Build Issue']} build issues may indicate pipeline concerns
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="analytics-grid">

        {/* Top Request Types */}
        <div className="analytics-section">
          <h3>Top Request Types</h3>
          <div className="bar-chart">
            {analytics.topRequestTypes.slice(0, 5).map((rt, index) => (
              <div key={index} className="bar-item">
                <div className="bar-label">{rt.name}</div>
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{ width: `${(rt.count / maxRequestTypeCount) * 100}%` }}
                  />
                  <div className="bar-value">{rt.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Applications */}
        <div className="analytics-section">
          <h3>Top Applications/Technologies</h3>
          <div className="bar-chart">
            {analytics.topApplications.slice(0, 5).map((app, index) => (
              <div key={index} className="bar-item">
                <div className="bar-label">{app.name}</div>
                <div className="bar-container">
                  <div
                    className="bar-fill application"
                    style={{ width: `${(app.count / maxAppCount) * 100}%` }}
                  />
                  <div className="bar-value">{app.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="analytics-section">
          <h3>Workload Distribution</h3>
          <div className="bar-chart">
            {analytics.topAssignees.slice(0, 5).map((assignee, index) => {
              const percentage = Math.round((assignee.count / analytics.totalTickets) * 100);
              const isHighLoad = percentage > 40;
              return (
                <div key={index} className="bar-item">
                  <div className="bar-label">{assignee.name}</div>
                  <div className="bar-container">
                    <div
                      className={`bar-fill workload ${isHighLoad ? 'high-load' : ''}`}
                      style={{ width: `${(assignee.count / maxAssigneeCount) * 100}%` }}
                    />
                    <div className="bar-value">{assignee.count} ({percentage}%)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="analytics-section">
          <h3>Priority Distribution</h3>
          <div className="priority-grid">
            {analytics.topPriorities.map((priority, index) => {
              const percentage = Math.round((priority.count / analytics.totalTickets) * 100);
              let priorityClass = 'priority-low';
              if (priority.name === 'Highest') priorityClass = 'priority-highest';
              else if (priority.name === 'High') priorityClass = 'priority-high';
              else if (priority.name === 'Medium') priorityClass = 'priority-medium';

              return (
                <div key={index} className={`priority-card ${priorityClass}`}>
                  <div className="priority-name">{priority.name}</div>
                  <div className="priority-count">{priority.count}</div>
                  <div className="priority-percentage">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Reporters */}
        <div className="analytics-section">
          <h3>Top Requesters</h3>
          <div className="simple-list">
            {analytics.topReporters.slice(0, 5).map((reporter, index) => (
              <div key={index} className="list-item">
                <span className="list-rank">{index + 1}</span>
                <span className="list-name">{reporter.name}</span>
                <span className="list-count">{reporter.count} tickets</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ServiceDeskAnalytics;
