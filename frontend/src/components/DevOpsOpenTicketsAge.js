import React from 'react';
import './ServiceDeskTrends.css';

function DevOpsOpenTicketsAge({ ageData }) {
  if (!ageData) {
    return (
      <div className="service-desk-trends">
        <h2>DevOps Open Tickets - Average Age Trend</h2>
        <p>No age data available</p>
      </div>
    );
  }

  const { trendData, currentMetrics, periodDays } = ageData;

  // Get data for display
  const displayData = trendData || [];

  // Calculate chart dimensions and scale
  const chartWidth = 800;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max value for scaling
  const maxAvgAge = Math.max(...displayData.map(d => d.avgAge || 0), 1);
  const yScale = maxAvgAge > 0 ? innerHeight / maxAvgAge : 1;
  const xScale = innerWidth / (displayData.length - 1 || 1);

  // Generate line path for average age
  const linePath = displayData
    .map((day, index) => {
      const x = padding.left + (index * xScale);
      const y = padding.top + (innerHeight - (day.avgAge || 0) * yScale);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (fill under the line)
  const areaPath = `${linePath} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

  return (
    <div className="service-desk-trends">
      <h2>DevOps Open Tickets - Average Age Trend</h2>
      <p className="subtitle">Project DTI - DevOps Team - Last {periodDays} days</p>

      {/* Current Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Current Average Age</div>
          <div className="metric-value">{currentMetrics.avgAge} days</div>
          <div className="metric-subtext">of open tickets</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Open Tickets</div>
          <div className="metric-value">{currentMetrics.totalOpen}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Oldest Ticket Age</div>
          <div className="metric-value">{currentMetrics.oldestTicketAge} days</div>
        </div>
      </div>

      {/* Average Age Trend */}
      <div className="volume-section">
        <h3>Average Age of Open Tickets (Last {periodDays} Days)</h3>
        <svg className="line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const value = Math.round(maxAvgAge * ratio * 10) / 10;
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
            fill="rgba(255, 87, 34, 0.1)"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#FF5722"
            strokeWidth="3"
          />

          {/* Data points */}
          {displayData.map((day, index) => {
            const x = padding.left + (index * xScale);
            const y = padding.top + (innerHeight - (day.avgAge || 0) * yScale);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#FF5722"
              >
                <title>{`${new Date(day.date).toLocaleDateString()}: ${day.avgAge} days avg age (${day.openCount} open tickets)`}</title>
              </circle>
            );
          })}

          {/* X-axis labels (show every 5th day) */}
          {displayData.map((day, index) => {
            if (index % 5 === 0 || index === displayData.length - 1) {
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

          {/* Y-axis label */}
          <text
            x={padding.left - 35}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#6B778C"
            transform={`rotate(-90, ${padding.left - 35}, ${padding.top + innerHeight / 2})`}
          >
            Average Age (days)
          </text>
        </svg>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: '#FF5722'}}></span>
            <span>Average Age of Open Tickets</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default DevOpsOpenTicketsAge;
