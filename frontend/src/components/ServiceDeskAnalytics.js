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

  return (
    <div className="service-desk-analytics">
      <h2>Service Desk Insights (Last 30 Days)</h2>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-value">{analytics.totalTickets}</div>
          <div className="summary-label">Total Requests</div>
        </div>
        <div className={`summary-card ${resolvedPercentage >= 90 ? 'success' : 'warning'}`}>
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

      {/* Key Insights and Request Type Breakdown - Side by Side */}
      <div className="top-insights-grid">
        {/* Key Insights */}
        <div className="insights-section-top">
          <h3>Key Insights</h3>
          <div className="insights-list">
            {/* Resolution Performance Insight */}
            {analytics.resolutionRate >= 100 ? (
              <div className="insight-item success">
                <span className="insight-icon">✅</span>
                <span className="insight-text">
                  <strong>Clearing backlog:</strong> {analytics.totalResolvedInPeriod} tickets resolved vs {analytics.totalTickets} created ({analytics.resolutionRate}% resolution rate)
                </span>
              </div>
            ) : analytics.resolutionRate >= 90 ? (
              <div className="insight-item">
                <span className="insight-icon">📊</span>
                <span className="insight-text">
                  <strong>Steady state:</strong> Resolving {analytics.resolutionRate}% of created tickets (target: ≥90%)
                </span>
              </div>
            ) : (
              <div className="insight-item warning">
                <span className="insight-icon">⚠️</span>
                <span className="insight-text">
                  <strong>Backlog building:</strong> Only {analytics.resolutionRate}% resolution rate ({analytics.totalResolvedInPeriod} resolved vs {analytics.totalTickets} created)
                </span>
              </div>
            )}

            {/* Top Request Type with Sub-Category Detail */}
            {analytics.topRequestTypes[0] && analytics.requestTypeBreakdown && analytics.requestTypeBreakdown[analytics.topRequestTypes[0].name] && (
              <div className="insight-item">
                <span className="insight-icon">📋</span>
                <span className="insight-text">
                  <strong>{analytics.topRequestTypes[0].name}s dominate:</strong> {analytics.topRequestTypes[0].count} tickets ({Math.round((analytics.topRequestTypes[0].count / analytics.totalTickets) * 100)}%),
                  top sub-category: {analytics.requestTypeBreakdown[analytics.topRequestTypes[0].name].subCategories[0]?.name} ({analytics.requestTypeBreakdown[analytics.topRequestTypes[0].name].subCategories[0]?.count})
                </span>
              </div>
            )}

            {/* Critical Issues Volume */}
            {analytics.incidentAnalysis && analytics.incidentAnalysis.totalIncidents > 0 && (
              <div className="insight-item">
                <span className="insight-icon">🚨</span>
                <span className="insight-text">
                  <strong>Critical issues:</strong> {analytics.incidentAnalysis.totalIncidents} incidents/build issues ({Math.round((analytics.incidentAnalysis.totalIncidents / analytics.totalTickets) * 100)}% of tickets)
                  {analytics.incidentAnalysis.rootCauses[0] && `, top cause: ${analytics.incidentAnalysis.rootCauses[0].category} (${analytics.incidentAnalysis.rootCauses[0].count})`}
                </span>
              </div>
            )}

            {/* Workload Concentration Warning */}
            {analytics.topAssignees[0] && analytics.topAssignees[0].count > analytics.totalTickets * 0.4 && (
              <div className="insight-item warning">
                <span className="insight-icon">⚖️</span>
                <span className="insight-text">
                  <strong>Workload imbalance:</strong> {analytics.topAssignees[0].name} handles {Math.round((analytics.topAssignees[0].count / analytics.totalTickets) * 100)}% of tickets ({analytics.topAssignees[0].count} of {analytics.totalTickets})
                </span>
              </div>
            )}

            {/* Average Resolution Time Performance */}
            {analytics.avgResolutionTimeDays > 0 && (
              <div className={`insight-item ${analytics.avgResolutionTimeDays > 5 ? 'warning' : 'success'}`}>
                <span className="insight-icon">{analytics.avgResolutionTimeDays > 5 ? '⏱️' : '⚡'}</span>
                <span className="insight-text">
                  <strong>Resolution speed:</strong> {analytics.avgResolutionTimeDays.toFixed(1)} day average
                  {analytics.avgResolutionTimeDays <= 5 ? ' - meeting target!' : ' - exceeds 5-day target'}
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
                // Get top 3 subcategories excluding "Other"
                const top3SubCategories = data.subCategories
                  .filter(sc => sc.name !== 'Other')
                  .slice(0, 3);
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

    </div>
  );
}

export default ServiceDeskAnalytics;
