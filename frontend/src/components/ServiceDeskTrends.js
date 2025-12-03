import React from 'react';
import './ServiceDeskTrends.css';

function ServiceDeskTrends({ trends }) {
  if (!trends) {
    return (
      <div className="service-desk-trends">
        <h2>Service Desk Trends</h2>
        <p>No trend data available</p>
      </div>
    );
  }

  const { volumeData, resolutionMetrics, statusBreakdown, priorityBreakdown, periodDays } = trends;

  // Get last 30 days of data for display
  const recentData = volumeData.slice(-30);

  // Calculate chart dimensions and scale
  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max value for scaling
  const maxOpenTickets = Math.max(...recentData.map(d => d.openTickets || 0));
  const yScale = maxOpenTickets > 0 ? innerHeight / maxOpenTickets : 1;
  const xScale = innerWidth / (recentData.length - 1 || 1);

  // Generate line path
  const linePath = recentData
    .map((day, index) => {
      const x = padding.left + (index * xScale);
      const y = padding.top + (innerHeight - (day.openTickets || 0) * yScale);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (fill under the line)
  const areaPath = `${linePath} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

  return (
    <div className="service-desk-trends">
      <h2>Service Desk Trends</h2>
      <p className="subtitle">Project DTI - Last {periodDays} days</p>

      {/* Resolution Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Average Resolution Time</div>
          <div className="metric-value">{resolutionMetrics.avgResolutionTimeDays} days</div>
          <div className="metric-subtext">({resolutionMetrics.avgResolutionTimeHours} hours)</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Created</div>
          <div className="metric-value">{resolutionMetrics.totalCreated}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Resolved</div>
          <div className="metric-value">{resolutionMetrics.totalResolved}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Resolution Rate</div>
          <div className="metric-value">{resolutionMetrics.resolutionRate}%</div>
        </div>
      </div>

      {/* Open Tickets Trend */}
      <div className="volume-section">
        <h3>Open Tickets Trend (Last 30 Days)</h3>
        <svg className="line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const value = Math.round(maxOpenTickets * ratio);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6B778C"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path
            d={areaPath}
            fill="rgba(0, 82, 204, 0.1)"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#0052CC"
            strokeWidth="3"
          />

          {/* Data points */}
          {recentData.map((day, index) => {
            const x = padding.left + (index * xScale);
            const y = padding.top + (innerHeight - (day.openTickets || 0) * yScale);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#0052CC"
              >
                <title>{`${new Date(day.date).toLocaleDateString()}: ${day.openTickets} open tickets`}</title>
              </circle>
            );
          })}

          {/* X-axis labels (show every 5th day) */}
          {recentData.map((day, index) => {
            if (index % 5 === 0 || index === recentData.length - 1) {
              const x = padding.left + (index * xScale);
              const date = new Date(day.date);
              return (
                <text
                  key={index}
                  x={x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6B778C"
                >
                  {date.getDate()}/{date.getMonth() + 1}
                </text>
              );
            }
            return null;
          })}
        </svg>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color open"></span>
            <span>Open Tickets</span>
          </div>
        </div>
      </div>

      {/* Status and Priority Breakdowns */}
      <div className="breakdown-grid">
        <div className="breakdown-section">
          <h3>Status Breakdown</h3>
          <div className="breakdown-list">
            {Object.entries(statusBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="breakdown-item">
                  <span className="breakdown-name">{status}</span>
                  <span className="breakdown-count">{count}</span>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill"
                      style={{
                        width: `${(count / resolutionMetrics.totalCreated) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="breakdown-section">
          <h3>Priority Breakdown</h3>
          <div className="breakdown-list">
            {Object.entries(priorityBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([priority, count]) => (
                <div key={priority} className="breakdown-item">
                  <span className="breakdown-name">{priority}</span>
                  <span className="breakdown-count">{count}</span>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill"
                      style={{
                        width: `${(count / resolutionMetrics.totalCreated) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceDeskTrends;
