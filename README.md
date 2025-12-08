# Jira Dashboard

A comprehensive dashboard for visualizing Jira data with React frontend and Node.js backend, styled with DataTorque's corporate branding.

## Recent Updates

### December 2025
- **Request Type Sub-Category Analysis**: Enhanced Service Desk Analytics with intelligent request type breakdown (December 9, 2025)
  - Added stacked bar chart visualization showing top 3 sub-categories for each major request type
  - Automated pattern detection within Access Requests (GitHub, Azure, VPN, SQL/Database, Jira, etc.)
  - Automated pattern detection within Build/Deployment Issues (Production, Sandbox, Certificates, Pipeline, etc.)
  - Automated pattern detection within General IT Help (Software Install, Licensing, MS Teams, Office Apps, etc.)
  - Interactive tooltips showing example tickets for each sub-category
  - Color-coded segments with counts and percentages for easy comparison
  - Replaced generic "Top Applications/Technologies" with actionable request type insights
- **Service Desk Analytics**: Added comprehensive Service Desk Analytics component with detailed insights (last 30 days)
  - Summary cards showing total tickets, resolution rate, incidents & build issues count, and average resolution time
  - Conditional formatting highlights when average resolution time exceeds 5-day target
  - Key insights section with automated analysis of access requests, workload distribution, and issue patterns
  - Visual analytics including top request types, applications/technologies, workload distribution, priority distribution, and top requesters
  - Integrated with existing metrics calculations to ensure consistency across dashboard
- **Incident Resolution Metrics**: Added dedicated incident resolution time tracking for critical issue types
  - Tracks average resolution time for [System] Incident, [System] Problem, and Build Issue types
  - Separate metrics for Combined Teams (DTI) and DevOps Team
  - Displays incident count and resolution times with conditional formatting
- **Service Desk Metrics on Overview**: Added Service Desk Resolution Metrics component to Overview tab
  - Shows key resolution metrics including average resolution time, incident resolution time, and resolution rates
  - Includes conditional formatting based on performance targets
- **Conditional Formatting**: Added color-coded metrics for Service Desk performance targets
  - Green: Meeting targets (≤5 days resolution time, ≥90% resolution rate)
  - Red/Orange: Below targets or exceeding thresholds
- **Metrics Period Update**: Changed Service Desk trends from 90 days to 30 days for more current insights
- **Corrected Metrics Calculations**: Fixed Service Desk metrics to accurately count tickets created/resolved within the specified period
- **Team Scope Correction**: Updated JQL queries to use correct team IDs matching manual queries

## Data Scope

The dashboard is configured to display data from a specific subset of projects and teams:
- Projects: **DevOps**, **TechOps**, **Technology Group**
- Project: **DTI** (filtered by specific team IDs)

Service Desk trends filter tickets by:
- **Combined View**: Three teams from the DTI project
- **DevOps View**: Single DevOps team from the DTI project

This filtering is applied across all dashboard sections and metrics.

## Features

The dashboard is organized into three main tabs:

### Overview Tab
- **Project Overview**: View filtered projects with issue counts and project leads
- **Service Desk Resolution Metrics**: Key performance metrics for service desk operations (last 30 days)
  - Average Resolution Time for all tickets (with conditional formatting)
  - Incident Resolution Time for critical issue types ([System] Incident, [System] Problem, Build Issue)
  - Total Created and Resolved ticket counts
  - Resolution Rate percentage
  - Separate metrics shown for Combined Teams (DTI) and DevOps Team
- **Team Performance Metrics**: Track cycle time, lead time, throughput, and other key metrics

### Initiatives Tab
- **Technology Initiatives**: Track progress of technology-related initiatives with custom fields and completion percentages

### Service Desk Tab
- **Service Desk Analytics**: Comprehensive analytics dashboard showing detailed service desk insights (last 30 days)
  - Summary cards with key metrics: total tickets, resolution rate, incidents & build issues, and average resolution time
  - Conditional formatting highlights average resolution time exceeding 5-day target in orange
  - Key insights section with automated analysis identifying trends in access requests, workload concentration, and technology patterns
  - Visual analytics charts showing:
    - Top request types (bar chart)
    - Top applications/technologies (bar chart)
    - Workload distribution across assignees with high-load warnings (>40% concentration)
    - Priority distribution (color-coded cards)
    - Top requesters (ranked list)
- **Service Desk Trends**: Combined view of service desk tickets across multiple teams with resolution metrics and 30-day trend graphs
  - Conditional formatting highlights metrics performance against targets (green for good, red for needs improvement)
  - Average resolution time target: ≤ 5 days
  - Resolution rate target: ≥ 90%
- **DevOps Service Desk**: Dedicated view for DevOps team service desk tickets with the same metrics and visualizations
  - Same conditional formatting and targets as Combined View
- **DevOps Open Tickets Age Trend**: Tracks the average age of open DevOps tickets over time with current metrics and 30-day trend visualization

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
    │   │   ├── TeamPerformance.js
    │   │   ├── TechnologyInitiatives.js
    │   │   ├── ServiceDeskMetrics.js
    │   │   ├── ServiceDeskMetrics.css
    │   │   ├── ServiceDeskAnalytics.js
    │   │   ├── ServiceDeskAnalytics.css
    │   │   ├── ServiceDeskTrends.js
    │   │   ├── ServiceDeskTrends.css
    │   │   ├── DevOpsServiceDesk.js
    │   │   └── DevOpsOpenTicketsAge.js
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
- `GET /api/technology-initiatives` - Get technology initiatives with custom fields
- `GET /api/service-desk-analytics?days=30` - Get comprehensive service desk analytics with insights including request type breakdown analysis (default: 30 days)
- `GET /api/service-desk-trends?days=30` - Get service desk trends for all configured teams (default: 30 days)
- `GET /api/service-desk-trends-devops?days=30` - Get service desk trends for DevOps team only (default: 30 days)
- `GET /api/devops-open-tickets-age?days=30` - Get average age trend of open DevOps tickets

## Dashboard Sections

### Overview Tab

#### Project Overview
Displays all active projects with:
- Project name and key
- Total issue count
- Project lead

#### Service Desk Resolution Metrics
Shows critical service desk performance metrics for the last 30 days:
- **Combined Teams (DTI)**: Metrics across all configured service desk teams
  - Average resolution time (days and hours) with conditional formatting
  - Incident resolution time for [System] Incident, [System] Problem, and Build Issue types
  - Total tickets created and resolved within the period
  - Resolution rate percentage
- **DevOps Team**: Same metrics filtered to DevOps team only
- Color-coded metrics: Green when meeting targets (≤5 days, ≥90% resolution rate), Red when below targets

#### Team Performance Metrics
Shows key performance indicators:
- Average cycle time (days)
- Average lead time (days)
- Weekly throughput
- Total and resolved issues
- Issues in progress
- Actionable insights

### Initiatives Tab

#### Technology Initiatives
Tracks technology-focused initiatives with:
- Initiative name and key
- Status and type
- Completion percentage based on custom field
- Priority level
- Assignee information

### Service Desk Tab

#### Service Desk Analytics
Comprehensive analytics dashboard providing detailed insights into service desk operations (last 30 days):
- **Summary Cards**: Key metrics with conditional formatting
  - Total tickets created within the period
  - Resolution rate percentage (tickets resolved / tickets created)
  - Incidents & Build Issues count with percentage of total tickets
  - Average resolution time (orange warning when exceeding 5-day target)
- **Key Insights**: Automated analysis highlighting important trends
  - Access request dominance and volume
  - Workload concentration warnings (assignees handling >40% of tickets)
  - Most referenced technologies
  - Build/deployment issue patterns
- **Visual Analytics**: Interactive charts showing
  - **Request Type Breakdown**: Stacked bar chart showing top 3 sub-categories for each major request type (Access Request, Build/Deployment Issues, General IT Help) with interactive tooltips and color-coded segments
  - Workload distribution across top 5 assignees with high-load indicators
  - Priority distribution (Highest, High, Medium, Low)
  - Top 5 requesters by ticket count

#### Service Desk Trends (Combined Teams)
Shows metrics for all configured service desk teams:
- Average resolution time (days and hours) - calculated from tickets resolved in the 30-day period
- Total tickets created vs resolved - counts tickets created/resolved within the 30-day period
- Resolution rate percentage - calculated as (resolved / created) within the period
- 30-day trend line graph showing open tickets over time
- **Conditional Formatting**: Metrics display in green when meeting targets (≤5 days resolution time, ≥90% resolution rate), red when below targets

#### DevOps Service Desk Trends
Dedicated view for DevOps team with:
- Same metrics as combined view
- Filtered specifically to DevOps team tickets
- Independent 30-day trend visualization
- **Conditional Formatting**: Same targets and color coding as Combined Teams view

#### DevOps Open Tickets Age Trend
Tracks the average age of currently open DevOps tickets:
- Current average age of all open tickets (in days)
- Total count of open tickets
- Age of the oldest open ticket
- 30-day trend line showing how average age has changed over time
- Status breakdown of open tickets
- Uses `statusCategory != Done` for accurate open ticket filtering

## Design & Branding

The dashboard features DataTorque's corporate branding and styling:

### Visual Design
- **Logo**: DataTorque logo prominently displayed in the header
- **Color Scheme**:
  - Primary Green: `#A9DE33` (buttons, accents, active states)
  - Dark Charcoal: `#323E48` (headers, primary text)
  - Light Gray: `#E7E6E6` (background)
  - Secondary Dark: `#44546A` (header gradient)
- **Typography**: Calibri font family throughout for a professional, consistent look
  - Headers: Calibri Light (300 weight)
  - Body text: Calibri
- **Layout**: Centered text in metric cards and statistics for improved readability

### Consistent Styling
All components follow DataTorque's design language:
- Header with dark gradient background
- Green accent colors for interactive elements
- Clean, professional metric cards with centered content
- Light color palette for reduced eye strain during extended viewing

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
Charts are built using Recharts for the Overview tab. To customize, edit the chart components in:
- `src/components/IssueStatistics.js`

Service Desk trend graphs use custom SVG line charts in:
- `src/components/ServiceDeskTrends.js`
- `src/components/DevOpsServiceDesk.js`
- `src/components/DevOpsOpenTicketsAge.js`

### Modifying Service Desk Filters
To change which teams are included in service desk trends, update the JQL queries in `backend/server.js`:

**Combined Service Desk** (line ~534):
```javascript
jql: `Project = DTI AND "Team[Team]" IN (9888ca76-8551-47b3-813f-4bf5df9e9762, a092fa48-f541-4358-90b8-ba6caccceb72, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND (created >= "${dateStr}" OR resolutiondate >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`
```

**DevOps Service Desk** (line ~691):
```javascript
jql: `Project = DTI AND "Team[Team]" IN (9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND (created >= "${dateStr}" OR resolutiondate >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`
```

Note: The queries fetch tickets that were created OR resolved in the period, plus any currently open tickets. This ensures accurate metrics calculations for tickets created/resolved within the specified timeframe.

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

- **Frontend**: React, Axios, Recharts, Custom SVG Charts
- **Backend**: Node.js, Express, Axios
- **API**: Jira REST API v3
- **Styling**: Custom CSS with DataTorque branding and responsive design
- **Design**: DataTorque corporate color scheme and typography (Calibri font family)

## License

This project is for internal use only.
