import React from 'react';
import './ServiceDeskTrends.css';

function ServiceDeskAgeTrend({ ageData }) {
  if (!ageData) {
    return (
      <div className="service-desk-trends">
        <h2>Service Desk - Average Age Trend</h2>
        <p>No age data available</p>
      </div>
    );
  }

  const { trendData, currentMetrics, periodDays } = ageData;

  // Get data for display
  const displayData = trendData || [];

  // Calculate chart dimensions and scale
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max and min values for scaling
  const maxAvgAge = Math.max(...displayData.map(d => d.avgAge || 0), 1);
  const minAvgAge = Math.min(...displayData.map(d => d.avgAge || 0));

  // Calculate Y-axis range with a floor to make differences more visible
  // Set floor to 80% of minimum value, rounded down to nearest 10 (or 0 if minimum is very small)
  const yMin = minAvgAge > 20 ? Math.floor((minAvgAge * 0.8) / 10) * 10 : 0;
  const yMax = maxAvgAge;
  const yRange = yMax - yMin;
  const yScale = yRange > 0 ? innerHeight / yRange : 1;
  const xScale = innerWidth / (displayData.length - 1 || 1);

  // Calculate insights metrics
  const firstDataPoint = displayData[0]?.avgAge || 0;
  const lastDataPoint = displayData[displayData.length - 1]?.avgAge || 0;
  const delta = lastDataPoint - firstDataPoint;
  const deltaPercent = firstDataPoint > 0 ? ((delta / firstDataPoint) * 100).toFixed(1) : 0;

  // Find dates for peak and lowest values
  const maxDay = displayData.find(d => d.avgAge === maxAvgAge);
  const minDay = displayData.find(d => d.avgAge === minAvgAge);
  const maxDate = maxDay ? new Date(maxDay.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  const minDate = minDay ? new Date(minDay.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

  // Generate line path for average age
  const linePath = displayData
    .map((day, index) => {
      const x = padding.left + (index * xScale);
      const y = padding.top + (innerHeight - ((day.avgAge || 0) - yMin) * yScale);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (fill under the line)
  const areaPath = `${linePath} L ${padding.left + innerWidth} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

  return (
    <div className="service-desk-trends">
      <h2>Service Desk - Average Age Trend</h2>
      <p className="subtitle">Project DTI - Service Desk Teams - Last {periodDays} days</p>

      {/* Key Insights */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-list">
          {/* Peak Average Age */}
          <div className="insight-item">
            <span className="insight-icon">📈</span>
            <span className="insight-text">
              <strong>Peak average age:</strong> {maxAvgAge.toFixed(1)} days on {maxDate}
            </span>
          </div>

          {/* Lowest Average Age */}
          <div className="insight-item">
            <span className="insight-icon">📉</span>
            <span className="insight-text">
              <strong>Lowest average age:</strong> {minAvgAge.toFixed(1)} days on {minDate}
            </span>
          </div>

          {/* Delta over period */}
          <div className={`insight-item ${delta > 0 ? 'warning' : delta < 0 ? 'success' : ''}`}>
            <span className="insight-icon">{delta > 0 ? '⬆️' : delta < 0 ? '⬇️' : '➡️'}</span>
            <span className="insight-text">
              <strong>Period trend:</strong> {delta > 0 ? 'Increased' : delta < 0 ? 'Decreased' : 'No change'} by {Math.abs(delta).toFixed(1)} days ({delta > 0 ? '+' : ''}{deltaPercent}%) from start to end of period
            </span>
          </div>
        </div>
      </div>

      {/* Average Age Trend */}
      <div className="volume-section">
        <h3>Average Age of Open Tickets (Last {periodDays} Days)</h3>
        <svg className="line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const value = (yMin + (yRange * ratio)).toFixed(1);
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
                  fontSize="16"
                  fontWeight={ratio === 0 || ratio === 1 ? "700" : "400"}
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
            fill="rgba(169, 222, 51, 0.1)"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#A9DE33"
            strokeWidth="3"
          />

          {/* Data points */}
          {displayData.map((day, index) => {
            const x = padding.left + (index * xScale);
            const y = padding.top + (innerHeight - ((day.avgAge || 0) - yMin) * yScale);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#A9DE33"
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
                  fontSize="16"
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
            <span className="legend-color" style={{backgroundColor: '#A9DE33'}}></span>
            <span>Average Age of Open Tickets</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ServiceDeskAgeTrend;
