import React from 'react';
import './ServiceDeskMetrics.css';

function ServiceDeskMetrics({ combinedTrends, devopsTrends }) {
  if (!combinedTrends || !devopsTrends) {
    return (
      <div className="service-desk-metrics">
        <h2>Service Desk Resolution Metrics</h2>
        <p>No data available</p>
      </div>
    );
  }

  // Target thresholds
  const RESOLUTION_TIME_TARGET = 5; // days
  const RESOLUTION_RATE_TARGET = 90; // percent

  // Helper functions to determine metric status
  const getResolutionTimeStatus = (days) => {
    if (days <= RESOLUTION_TIME_TARGET) return 'good';
    return 'bad';
  };

  const getResolutionRateStatus = (rate) => {
    if (rate >= RESOLUTION_RATE_TARGET) return 'good';
    return 'bad';
  };

  return (
    <div className="service-desk-metrics">
      <h2>Service Desk Resolution Metrics (Last 30 Days)</h2>

      <div className="metrics-section">
        <h3>Combined Teams (DTI)</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Average Resolution Time</div>
            <div className={`metric-value ${getResolutionTimeStatus(combinedTrends.resolutionMetrics.avgResolutionTimeDays)}`}>
              {combinedTrends.resolutionMetrics.avgResolutionTimeDays} days
            </div>
            <div className="metric-subtext">({combinedTrends.resolutionMetrics.avgResolutionTimeHours} hours)</div>
            <div className="metric-subtext">Target: ≤ {RESOLUTION_TIME_TARGET} days</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Incident Resolution Time</div>
            <div className={`metric-value ${getResolutionTimeStatus(combinedTrends.resolutionMetrics.avgIncidentResolutionTimeDays)}`}>
              {combinedTrends.resolutionMetrics.avgIncidentResolutionTimeDays > 0
                ? `${combinedTrends.resolutionMetrics.avgIncidentResolutionTimeDays} days`
                : 'N/A'}
            </div>
            <div className="metric-subtext">
              {combinedTrends.resolutionMetrics.incidentCount > 0
                ? `(${combinedTrends.resolutionMetrics.avgIncidentResolutionTimeHours} hours, ${combinedTrends.resolutionMetrics.incidentCount} incidents)`
                : '(No incidents resolved)'}
            </div>
            <div className="metric-subtext">Target: ≤ {RESOLUTION_TIME_TARGET} days</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Created</div>
            <div className="metric-value">{combinedTrends.resolutionMetrics.totalCreated}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Resolved</div>
            <div className="metric-value">{combinedTrends.resolutionMetrics.totalResolved}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Resolution Rate</div>
            <div className={`metric-value ${getResolutionRateStatus(combinedTrends.resolutionMetrics.resolutionRate)}`}>
              {combinedTrends.resolutionMetrics.resolutionRate}%
            </div>
            <div className="metric-subtext">Target: ≥ {RESOLUTION_RATE_TARGET}%</div>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h3>DevOps Team</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Average Resolution Time</div>
            <div className={`metric-value ${getResolutionTimeStatus(devopsTrends.resolutionMetrics.avgResolutionTimeDays)}`}>
              {devopsTrends.resolutionMetrics.avgResolutionTimeDays} days
            </div>
            <div className="metric-subtext">({devopsTrends.resolutionMetrics.avgResolutionTimeHours} hours)</div>
            <div className="metric-subtext">Target: ≤ {RESOLUTION_TIME_TARGET} days</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Incident Resolution Time</div>
            <div className={`metric-value ${getResolutionTimeStatus(devopsTrends.resolutionMetrics.avgIncidentResolutionTimeDays)}`}>
              {devopsTrends.resolutionMetrics.avgIncidentResolutionTimeDays > 0
                ? `${devopsTrends.resolutionMetrics.avgIncidentResolutionTimeDays} days`
                : 'N/A'}
            </div>
            <div className="metric-subtext">
              {devopsTrends.resolutionMetrics.incidentCount > 0
                ? `(${devopsTrends.resolutionMetrics.avgIncidentResolutionTimeHours} hours, ${devopsTrends.resolutionMetrics.incidentCount} incidents)`
                : '(No incidents resolved)'}
            </div>
            <div className="metric-subtext">Target: ≤ {RESOLUTION_TIME_TARGET} days</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Created</div>
            <div className="metric-value">{devopsTrends.resolutionMetrics.totalCreated}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Resolved</div>
            <div className="metric-value">{devopsTrends.resolutionMetrics.totalResolved}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Resolution Rate</div>
            <div className={`metric-value ${getResolutionRateStatus(devopsTrends.resolutionMetrics.resolutionRate)}`}>
              {devopsTrends.resolutionMetrics.resolutionRate}%
            </div>
            <div className="metric-subtext">Target: ≥ {RESOLUTION_RATE_TARGET}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceDeskMetrics;
