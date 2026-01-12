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
    ageData,
    requestTypeBreakdown
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

      {/* Key Insights and Request Type Breakdown - Side by Side */}
      <div className="top-insights-grid">
        {/* Key Insights Section */}
        <div className="insights-section-top">
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

        {/* Request Type Breakdown */}
        {requestTypeBreakdown && Object.keys(requestTypeBreakdown).length > 0 && (
          <div className="analytics-section request-type-breakdown">
            <h3>Request Type Breakdown (Top 3 Sub-Categories)</h3>
            <div className="stacked-bar-chart">
              {Object.entries(requestTypeBreakdown)
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
        )}
      </div>
    </div>
  );
}

export default DevOpsAnalytics;
