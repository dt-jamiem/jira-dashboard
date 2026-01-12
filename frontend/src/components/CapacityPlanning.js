import React from 'react';
import './CapacityPlanning.css';

function CapacityPlanning({ data }) {
  if (!data) {
    return (
      <div className="capacity-planning">
        <h2>Capacity Planning</h2>
        <div className="loading-placeholder">
          <p>Loading capacity data...</p>
        </div>
      </div>
    );
  }

  const { summary, assigneeWorkload, ticketFlow } = data;

  // Calculate max values for bar chart scaling
  const maxWorkload = Math.max(...assigneeWorkload.map(a => a.openTickets), 1);

  // Find peak created/resolved for flow chart
  const maxCreated = Math.max(...ticketFlow.map(d => d.created), 1);
  const maxResolved = Math.max(...ticketFlow.map(d => d.resolved), 1);
  const maxFlow = Math.max(maxCreated, maxResolved);

  // Calculate net flow (created - resolved)
  const netFlow = summary.ticketsCreated - summary.ticketsResolved;
  const flowTrend = netFlow > 0 ? 'increasing' : netFlow < 0 ? 'decreasing' : 'stable';

  return (
    <div className="capacity-planning">
      <h2>Capacity Planning</h2>
      <p className="period-note">Last {summary.period} days</p>

      {/* Summary Cards */}
      <div className="capacity-summary-cards">
        <div className="capacity-card">
          <div className="capacity-card-label">Open Tickets</div>
          <div className="capacity-card-value">{summary.totalOpenTickets}</div>
        </div>
        <div className="capacity-card">
          <div className="capacity-card-label">Tickets Created</div>
          <div className="capacity-card-value">{summary.ticketsCreated}</div>
        </div>
        <div className="capacity-card">
          <div className="capacity-card-label">Tickets Resolved</div>
          <div className="capacity-card-value">{summary.ticketsResolved}</div>
        </div>
        <div className="capacity-card">
          <div className="capacity-card-label">Avg Resolution Time</div>
          <div className="capacity-card-value">{summary.avgResolutionTime} days</div>
        </div>
        <div className="capacity-card">
          <div className="capacity-card-label">Team Velocity</div>
          <div className="capacity-card-value">{summary.velocity} <span className="velocity-unit">tickets/week</span></div>
        </div>
        <div className={`capacity-card ${flowTrend === 'increasing' ? 'warning' : flowTrend === 'decreasing' ? 'positive' : ''}`}>
          <div className="capacity-card-label">Net Flow</div>
          <div className="capacity-card-value">
            {netFlow > 0 ? '+' : ''}{netFlow}
          </div>
          <div className="capacity-card-trend">{flowTrend}</div>
        </div>
      </div>

      {/* Team Workload */}
      <div className="capacity-section">
        <h3>Team Workload Distribution</h3>
        <div className="workload-table">
          <div className="workload-header">
            <div className="workload-col-assignee">Team Member</div>
            <div className="workload-col-tickets">Open Tickets</div>
            <div className="workload-col-age">Avg Age</div>
            <div className="workload-col-oldest">Oldest</div>
            <div className="workload-col-chart">Load</div>
          </div>
          {assigneeWorkload.slice(0, 15).map((assignee, index) => (
            <div key={index} className="workload-row">
              <div className="workload-col-assignee">{assignee.name}</div>
              <div className="workload-col-tickets">{assignee.openTickets}</div>
              <div className="workload-col-age">{assignee.avgAge} days</div>
              <div className="workload-col-oldest">
                <span className={assignee.oldestTicket > 30 ? 'age-warning' : ''}>
                  {assignee.oldestTicket} days
                </span>
              </div>
              <div className="workload-col-chart">
                <div className="workload-bar-container">
                  <div
                    className="workload-bar"
                    style={{ width: `${(assignee.openTickets / maxWorkload) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Flow Chart */}
      <div className="capacity-section">
        <h3>Ticket Flow Trend</h3>
        <div className="flow-chart">
          <div className="flow-legend">
            <div className="flow-legend-item">
              <span className="flow-legend-color created"></span>
              <span>Created</span>
            </div>
            <div className="flow-legend-item">
              <span className="flow-legend-color resolved"></span>
              <span>Resolved</span>
            </div>
          </div>
          <svg className="flow-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((factor, i) => (
              <line
                key={i}
                x1="0"
                y1={200 - (factor * 180)}
                x2="800"
                y2={200 - (factor * 180)}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}

            {/* Created line */}
            <polyline
              fill="none"
              stroke="#A9DE33"
              strokeWidth="2"
              points={ticketFlow.map((point, i) => {
                const x = (i / (ticketFlow.length - 1)) * 800;
                const y = 200 - ((point.created / maxFlow) * 180);
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Resolved line */}
            <polyline
              fill="none"
              stroke="#44546A"
              strokeWidth="2"
              points={ticketFlow.map((point, i) => {
                const x = (i / (ticketFlow.length - 1)) * 800;
                const y = 200 - ((point.resolved / maxFlow) * 180);
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
          <div className="flow-x-axis">
            <span>{ticketFlow[0]?.date}</span>
            <span>{ticketFlow[Math.floor(ticketFlow.length / 2)]?.date}</span>
            <span>{ticketFlow[ticketFlow.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="capacity-section">
        <h3>Capacity Insights</h3>
        <div className="capacity-insights">
          <div className={`insight-card ${flowTrend === 'increasing' ? 'warning' : 'positive'}`}>
            <div className="insight-label">Workload Trend</div>
            <div className="insight-value">
              {flowTrend === 'increasing' && 'Backlog Growing'}
              {flowTrend === 'decreasing' && 'Backlog Clearing'}
              {flowTrend === 'stable' && 'Stable Capacity'}
            </div>
            <div className="insight-detail">
              {netFlow > 0 && `${netFlow} more tickets created than resolved`}
              {netFlow < 0 && `${Math.abs(netFlow)} more tickets resolved than created`}
              {netFlow === 0 && 'Balanced ticket creation and resolution'}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-label">Team Utilization</div>
            <div className="insight-value">
              {assigneeWorkload.filter(a => a.name !== 'Unassigned').length} active members
            </div>
            <div className="insight-detail">
              Average {Math.round(summary.totalOpenTickets / Math.max(assigneeWorkload.filter(a => a.name !== 'Unassigned').length, 1))} tickets per person
            </div>
          </div>

          <div className={`insight-card ${summary.avgResolutionTime > 7 ? 'warning' : 'positive'}`}>
            <div className="insight-label">Resolution Speed</div>
            <div className="insight-value">{summary.avgResolutionTime} days average</div>
            <div className="insight-detail">
              {summary.avgResolutionTime <= 5 && 'Meeting target (≤5 days)'}
              {summary.avgResolutionTime > 5 && summary.avgResolutionTime <= 7 && 'Slightly above target'}
              {summary.avgResolutionTime > 7 && 'Exceeds target - may need attention'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CapacityPlanning;
