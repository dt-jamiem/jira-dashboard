# Jira Dashboard

A comprehensive dashboard for visualizing Jira data with React frontend and Node.js backend.

## Data Scope

The dashboard is configured to display data from a specific subset of projects and teams:
- Projects: **DevOps**, **TechOps**, **Technology Group**
- Project: **DTI** (filtered by specific team IDs)

This filtering is applied across all dashboard sections and metrics.

## Features

- **Project Overview**: View filtered projects with issue counts and project leads
- **Issue Statistics**: Visual representations of issues by status, type, priority, and assignee
- **Team Performance Metrics**: Track cycle time, lead time, throughput, and other key metrics

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Jira account with API access

## Project Structure

```
jira-dashboard/
├── backend/
│   ├── server.js          # Express server with Jira API integration
│   ├── package.json       # Backend dependencies
│   ├── .env              # Environment variables (Jira credentials)
│   └── .gitignore
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ProjectOverview.js
    │   │   ├── IssueStatistics.js
    │   │   └── TeamPerformance.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json       # Frontend dependencies
```

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file has already been created with your Jira credentials:
- JIRA_URL: https://datatorque.atlassian.net
- JIRA_EMAIL: jamie.mcindoe@datatorque.com
- JIRA_API_TOKEN: (configured)

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
The backend will run on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000 and automatically open in your browser.

## API Endpoints

The backend provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/projects` - List all projects
- `GET /api/projects/:projectKey/issues` - Get issues for a specific project
- `GET /api/issues` - Get all issues
- `GET /api/statistics` - Get issue statistics (by status, type, priority, assignee)
- `GET /api/performance?days=30` - Get team performance metrics
- `GET /api/overview` - Get project overview with issue counts

## Dashboard Sections

### Project Overview
Displays all active projects with:
- Project name and key
- Total issue count
- Project lead

### Issue Statistics
Visualizes issues using:
- Pie charts for status and type distribution
- Bar charts for priority distribution
- Top 10 assignees by issue count

### Team Performance Metrics
Shows key performance indicators:
- Average cycle time (days)
- Average lead time (days)
- Weekly throughput
- Total and resolved issues
- Issues in progress
- Actionable insights

## Customization

### Modifying the Data Filter
To change which projects and teams are included in the dashboard, edit the `BASE_JQL_FILTER` constant in `backend/server.js`:

```javascript
const BASE_JQL_FILTER = 'Project IN (DevOps, TechOps, "Technology Group") OR (Project = DTI AND "Team[Team]" IN (01c3b859-1307-41e3-8a88-24c701dd1713, 9888ca76-8551-47b3-813f-4bf5df9e9762, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3, a092fa48-f541-4358-90b8-ba6caccceb72))';
```

After modifying, also update the project filter arrays in the `/api/projects` and `/api/overview` endpoints to match your new projects.

### Changing Data Refresh Interval
The dashboard loads data on mount and provides a refresh button. To auto-refresh, add this to `App.js`:

```javascript
useEffect(() => {
  const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
  return () => clearInterval(interval);
}, []);
```

### Filtering by Date Range
To filter performance metrics by a different date range, modify the API call in `App.js`:

```javascript
axios.get('/api/performance?days=60') // Last 60 days
```

### Modifying Charts
Charts are built using Recharts. To customize, edit the chart components in:
- `src/components/IssueStatistics.js`

## Security Notes

- The `.env` file contains sensitive credentials and should NEVER be committed to version control
- The `.gitignore` file is configured to exclude `.env` files
- For production deployments, use environment variables or a secure secrets management system

## Troubleshooting

### Backend Connection Issues
- Verify your Jira API token is valid
- Check that the Jira URL is correct
- Ensure your Jira account has appropriate permissions

### CORS Errors
- The backend uses CORS middleware to allow frontend requests
- If issues persist, check that both servers are running

### Chart Display Issues
- Ensure Recharts is properly installed: `npm install recharts`
- Check browser console for errors

## Technologies Used

- **Frontend**: React, Axios, Recharts
- **Backend**: Node.js, Express, Axios
- **API**: Jira REST API v3

## License

This project is for internal use only.
