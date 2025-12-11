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

  const { volumeData, resolutionMetrics, periodDays } = trends;

  // Target thresholds
  const RESOLUTION_TIME_TARGET = 5; // days
  const RESOLUTION_RATE_TARGET = 90; // percent

  // Helper function to determine metric status
  const getResolutionTimeStatus = (days) => {
    if (days <= RESOLUTION_TIME_TARGET) return 'good';
    return 'bad';
  };

  const getResolutionRateStatus = (rate) => {
    if (rate >= RESOLUTION_RATE_TARGET) return 'good';
    return 'bad';
  };

  // Get last 30 days of data for display
  const recentData = volumeData.slice(-30);

  // Calculate chart dimensions and scale
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max and min values for scaling
  const maxOpenTickets = Math.max(...recentData.map(d => d.openTickets || 0));
  const minOpenTickets = Math.min(...recentData.map(d => d.openTickets || 0));

  // Calculate Y-axis range with a floor to make differences more visible
  // Set floor to 80% of minimum value, rounded down to nearest 10 (or 0 if minimum is very small)
  const yMin = minOpenTickets > 20 ? Math.floor((minOpenTickets * 0.8) / 10) * 10 : 0;
  const yMax = maxOpenTickets;
  const yRange = yMax - yMin;
  const yScale = yRange > 0 ? innerHeight / yRange : 1;
  const xScale = innerWidth / (recentData.length - 1 || 1);

  // Calculate insights metrics
  const firstDataPoint = recentData[0]?.openTickets || 0;
  const lastDataPoint = recentData[recentData.length - 1]?.openTickets || 0;
  const delta = lastDataPoint - firstDataPoint;
  const deltaPercent = firstDataPoint > 0 ? ((delta / firstDataPoint) * 100).toFixed(1) : 0;

  // Generate line path
  const linePath = recentData
    .map((day, index) => {
      const x = padding.left + (index * xScale);
      const y = padding.top + (innerHeight - ((day.openTickets || 0) - yMin) * yScale);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (fill under the line)
  const areaPath = `${linePath} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

  return (
    <div className="service-desk-trends">
      <h2>Service Desk Trends</h2>
      <p className="subtitle">Project DTI - Last {periodDays} days</p>

      {/* Key Insights */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-list">
          {/* Peak Open Tickets */}
          <div className="insight-item">
            <span className="insight-icon">📈</span>
            <span className="insight-text">
              <strong>Peak open tickets:</strong> {maxOpenTickets} tickets at highest point in period
            </span>
          </div>

          {/* Lowest Open Tickets */}
          <div className="insight-item">
            <span className="insight-icon">📉</span>
            <span className="insight-text">
              <strong>Lowest open tickets:</strong> {minOpenTickets} tickets at lowest point in period
            </span>
          </div>

          {/* Delta over period */}
          <div className={`insight-item ${delta > 0 ? 'warning' : delta < 0 ? 'success' : ''}`}>
            <span className="insight-icon">{delta > 0 ? '⬆️' : delta < 0 ? '⬇️' : '➡️'}</span>
            <span className="insight-text">
              <strong>Period trend:</strong> {delta > 0 ? 'Increased' : delta < 0 ? 'Decreased' : 'No change'} by {Math.abs(delta)} tickets ({delta > 0 ? '+' : ''}{deltaPercent}%) from start to end of period
            </span>
          </div>
        </div>
      </div>

      {/* Open Tickets Trend */}
      <div className="volume-section">
        <h3>Open Tickets Trend (Last 30 Days)</h3>
        <svg className="line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const value = Math.round(yMin + (yRange * ratio));
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
                  fontSize="14"
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
                  fontSize="14"
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

    </div>
  );
}

export default ServiceDeskTrends;
