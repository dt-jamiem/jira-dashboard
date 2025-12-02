import React from 'react';
import './TeamPerformance.css';

function TeamPerformance({ performance }) {
  if (!performance) {
    return (
      <div className="team-performance">
        <h2>Team Performance Metrics</h2>
        <p>No performance data available</p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Average Cycle Time',
      value: performance.avgCycleTime,
      unit: 'days',
      description: 'Average time from start to completion'
    },
    {
      label: 'Average Lead Time',
      value: performance.avgLeadTime,
      unit: 'days',
      description: 'Average time from creation to completion'
    },
    {
      label: 'Weekly Throughput',
      value: performance.throughput,
      unit: 'issues/week',
      description: 'Issues completed per week'
    },
    {
      label: 'Total Issues',
      value: performance.totalIssues,
      unit: 'issues',
      description: `In the last ${performance.periodDays} days`
    },
    {
      label: 'Resolved Issues',
      value: performance.resolvedIssues,
      unit: 'issues',
      description: `Completed in the last ${performance.periodDays} days`
    },
    {
      label: 'In Progress',
      value: performance.inProgressIssues,
      unit: 'issues',
      description: 'Currently being worked on'
    }
  ];

  return (
    <div className="team-performance">
      <h2>Team Performance Metrics</h2>
      <p className="period-info">Last {performance.periodDays} days</p>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <h3>{metric.label}</h3>
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {metric.value}
                <span className="metric-unit">{metric.unit}</span>
              </div>
              <div className="metric-description">{metric.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="performance-insights">
        <h3>Insights</h3>
        <ul>
          <li>
            {performance.resolvedIssues > 0 && performance.totalIssues > 0
              ? `Completion rate: ${((performance.resolvedIssues / performance.totalIssues) * 100).toFixed(1)}%`
              : 'No completed issues in this period'}
          </li>
          <li>
            {performance.avgCycleTime > 0
              ? performance.avgCycleTime < 7
                ? 'Great! Average cycle time is under a week'
                : performance.avgCycleTime < 14
                ? 'Average cycle time is within two weeks'
                : 'Consider breaking down issues for faster completion'
              : 'Not enough data to calculate cycle time'}
          </li>
          <li>
            {performance.inProgressIssues > 0
              ? `${performance.inProgressIssues} issue${performance.inProgressIssues > 1 ? 's' : ''} currently in progress`
              : 'No issues currently in progress'}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default TeamPerformance;
