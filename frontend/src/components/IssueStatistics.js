import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './IssueStatistics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

function IssueStatistics({ statistics }) {
  if (!statistics) {
    return (
      <div className="issue-statistics">
        <h2>Issue Statistics</h2>
        <p>No statistics available</p>
      </div>
    );
  }

  const statusData = Object.entries(statistics.byStatus || {}).map(([name, value]) => ({
    name,
    value
  }));

  const typeData = Object.entries(statistics.byType || {}).map(([name, value]) => ({
    name,
    value
  }));

  const priorityData = Object.entries(statistics.byPriority || {}).map(([name, value]) => ({
    name,
    value
  }));

  const assigneeData = Object.entries(statistics.byAssignee || {})
    .map(([name, value]) => ({
      name,
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="issue-statistics">
      <h2>Issue Statistics</h2>
      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-value">{statistics.totalIssues}</div>
          <div className="summary-label">Total Issues</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h3>Issues by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>Issues by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h3>Issues by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section full-width">
          <h3>Issues by Assignee (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assigneeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="value" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default IssueStatistics;
