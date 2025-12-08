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
  const maxAssigneeCount = Math.max(...analytics.topAssignees.map(a => a.count));

  return (
    <div className="service-desk-analytics">
      <h2>Service Desk Insights (Last 30 Days)</h2>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-value">{analytics.totalTickets}</div>
          <div className="summary-label">Total Requests</div>
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

      {/* Incident Root Cause Analysis */}
      {analytics.incidentAnalysis && analytics.incidentAnalysis.totalIncidents > 0 && (
        <div className="incident-analysis-section">
          <h3>🔧 Incident & Build Issue Root Cause Analysis</h3>
          <div className="incident-summary">
            <span className="incident-count">
              {analytics.incidentAnalysis.totalIncidents} incidents/issues analyzed
            </span>
            <span className="incident-breakdown">
              ({analytics.allCounts.issueTypes['[System] Incident'] || 0} Incidents, {' '}
              {analytics.allCounts.issueTypes['[System] Problem'] || 0} Problems, {' '}
              {analytics.allCounts.issueTypes['Build Issue'] || 0} Build Issues)
            </span>
          </div>
          <div className="root-causes-grid">
            {analytics.incidentAnalysis.rootCauses.slice(0, 3).map((cause, index) => (
              <div key={index} className="root-cause-card">
                <div className="root-cause-header">
                  <span className="root-cause-rank">#{index + 1}</span>
                  <span className="root-cause-name">{cause.category}</span>
                </div>
                <div className="root-cause-stats">
                  <span className="root-cause-count">{cause.count}</span>
                  <span className="root-cause-label">issues</span>
                  <span className="root-cause-percentage">{cause.percentage}%</span>
                </div>
                <div className="root-cause-bar">
                  <div
                    className="root-cause-bar-fill"
                    style={{ width: `${cause.percentage}%` }}
                  ></div>
                </div>
                {cause.examples && cause.examples.length > 0 && (
                  <div className="root-cause-examples">
                    <div className="example-label">Recent examples:</div>
                    {cause.examples.map((ex, exIndex) => (
                      <div key={exIndex} className="example-ticket" title={ex.summary}>
                        <span className="example-key">{ex.key}</span>
                        <span className="example-summary">{ex.summary.slice(0, 50)}{ex.summary.length > 50 ? '...' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights and Request Type Breakdown - Side by Side */}
      <div className="top-insights-grid">
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

        {/* Request Type Breakdown - Stacked Bars */}
        <div className="analytics-section request-type-breakdown">
          <h3>Request Type Breakdown (Top 3 Sub-Categories)</h3>
          <div className="stacked-bar-chart">
            {analytics.requestTypeBreakdown && Object.entries(analytics.requestTypeBreakdown)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 3)
              .map(([requestType, data], index) => {
                const top3SubCategories = data.subCategories.slice(0, 3);
                const top3Total = top3SubCategories.reduce((sum, sc) => sum + sc.count, 0);
                const othersCount = data.total - top3Total;
                const colors = ['#6B9BD1', '#A9DE33', '#FFA500', '#95A5A6'];

                return (
                  <div key={index} className="stacked-bar-item">
                    <div className="stacked-bar-label">
                      <span className="request-type-name">{requestType}</span>
                      <span className="request-type-total">{data.total} tickets</span>
                    </div>
                    <div className="stacked-bar-container">
                      {top3SubCategories.map((subCat, subIndex) => {
                        const percentage = ((subCat.count / data.total) * 100).toFixed(1);
                        return (
                          <div
                            key={subIndex}
                            className="stacked-segment"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colors[subIndex]
                            }}
                            title={`${subCat.name}: ${subCat.count} (${percentage}%)\n${subCat.examples?.map(ex => `• ${ex.summary}`).join('\n')}`}
                          >
                            {parseFloat(percentage) > 10 && (
                              <span className="segment-label">{subCat.count}</span>
                            )}
                          </div>
                        );
                      })}
                      {othersCount > 0 && (
                        <div
                          className="stacked-segment"
                          style={{
                            width: `${((othersCount / data.total) * 100).toFixed(1)}%`,
                            backgroundColor: colors[3]
                          }}
                          title={`Other: ${othersCount} (${((othersCount / data.total) * 100).toFixed(1)}%)`}
                        >
                          {((othersCount / data.total) * 100) > 10 && (
                            <span className="segment-label">{othersCount}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="stacked-bar-legend">
                      {top3SubCategories.map((subCat, subIndex) => (
                        <div key={subIndex} className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: colors[subIndex] }}></span>
                          <span className="legend-label">{subCat.name} ({subCat.count})</span>
                        </div>
                      ))}
                      {othersCount > 0 && (
                        <div className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: colors[3] }}></span>
                          <span className="legend-label">Other ({othersCount})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="analytics-grid">

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
