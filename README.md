# Jira Dashboard

A comprehensive dashboard for visualizing Jira data with React frontend and Node.js backend, styled with DataTorque's corporate branding.

## Recent Updates

### December 2025
- **Three-Tab Dashboard Structure**: Reorganized dashboard for clearer separation of analytics and trends (December 11, 2025)
  - Service Desk tab: Analytics overview with 4 summary tiles and key insights
  - DevOps tab: DevOps analytics overview with 4 summary tiles and performance indicators
  - Trends tab: All trend visualizations and historical data in one dedicated view
- **DevOps Analytics Dashboard**: Added comprehensive DevOps insights with 4 summary tiles and key performance indicators (December 11, 2025)
  - Summary tiles: Total Requests, Resolution Rate, Avg Resolution Time, and Open Tickets with average age
  - Dynamic insights showing resolution performance, speed indicators, and aging ticket alerts
  - Conditional formatting with green for meeting targets (≤5 days resolution, ≥90% resolution rate)
- **Simplified Navigation**: Streamlined dashboard to focus on Service Desk and DevOps operations (December 11, 2025)
  - Removed Overview tab to reduce complexity
  - Service Desk tab now loads by default
  - Optimized API calls to only fetch required data
- **Enhanced Key Insights & Streamlined Analytics**: Improved Service Desk Analytics with data-driven insights and focused metrics (December 10, 2025)
  - Redesigned Key Insights with 5 dynamic, conditional insights based on actual performance:
    - Resolution Performance: Shows "Clearing backlog" (green) when >100% resolution rate, "Steady state" when 90-99%, or "Backlog building" (warning) when <90%
    - Top Request Type with Sub-Category detail for immediate actionable insights
    - Critical Issues Volume with top root cause displayed inline
    - Workload Imbalance warning (only when concentration >40%)
    - Resolution Speed indicator (green when ≤5 days, warning when exceeding target)
  - Updated analytics query to use `updated >= endOfDay(-30)` for active workload tracking
  - Tracks all tickets updated in the period (new, resolved, and in-progress work) for more accurate activity metrics
  - Streamlined analytics page by removing Priority Distribution, Workload Distribution, and Top Requesters graphs
  - Focused dashboard on highest-value metrics: Summary Cards, Key Insights, Request Type Breakdown, and Incident Root Cause Analysis
- **Incident Root Cause Analysis**: Added automated root cause pattern detection for incidents and build issues (December 9, 2025)
  - Analyzes [System] Incident, [System] Problem, and Build Issue types for common patterns
  - Identifies top 5 root causes: Application Error, Build Pipeline, Deployment, Database, Certificate, Performance, Network, Server/Infrastructure
  - Visual cards showing count, percentage, and recent examples for each root cause
  - Color-coded ranking badges and progress bars for quick identification
  - Hover effects on cards for better interactivity
  - Helps teams focus attention on systemic issues requiring preventive action
- **Request Type Sub-Category Analysis**: Enhanced Service Desk Analytics with intelligent request type breakdown (December 9, 2025)
  - Added stacked bar chart visualization showing top 3 sub-categories for each major request type
  - Automated pattern detection within Access Requests (GitHub, Azure, VPN, SQL/Database, Jira, etc.)
  - Automated pattern detection within Build/Deployment Issues (Production, Sandbox, Certificates, Pipeline, etc.)
  - Automated pattern detection within General IT Help (Software Install, Licensing, MS Teams, Office Apps, etc.)
  - Interactive tooltips showing example tickets for each sub-category
  - Color-coded segments with counts and percentages for easy comparison
  - Replaced generic "Top Applications/Technologies" with actionable request type insights
  - **Improved Layout**: Key Insights and Request Type Breakdown now displayed side-by-side for better data comparison and space efficiency
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

### Service Desk Tab (Default)
- **Service Desk Analytics**: Comprehensive analytics dashboard showing detailed service desk insights (last 30 days)
  - 4 Summary cards: Total Requests, Resolution Rate, Incidents & Build Issues, and Average Resolution Time
  - Conditional formatting highlights average resolution time exceeding 5-day target in orange
  - Key insights section with 5 dynamic, data-driven insights based on actual performance
  - Request Type Breakdown with stacked bar charts showing top 3 sub-categories
  - Incident Root Cause Analysis identifying patterns and systemic issues

### DevOps Tab
- **DevOps Analytics**: Comprehensive DevOps insights dashboard (last 30 days)
  - 4 Summary tiles: Total Requests, Resolution Rate, Average Resolution Time, and Open Tickets with average age
  - Conditional formatting with green for meeting targets (≤5 days resolution, ≥90% resolution rate)
  - Key insights showing resolution performance, speed indicators, and aging ticket alerts
  - Dynamic analysis identifying backlog trends and tickets requiring attention

### Trends Tab
- **Service Desk Trends**: Combined view of service desk tickets across multiple teams with resolution metrics and 30-day trend graphs
  - Conditional formatting highlights metrics performance against targets (green for good, red for needs improvement)
  - Average resolution time target: ≤ 5 days
  - Resolution rate target: ≥ 90%
- **DevOps Service Desk Trends**: Dedicated view for DevOps team service desk tickets with metrics and 30-day trend graphs
  - Same conditional formatting and targets as Service Desk tab
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
    │   │   ├── ServiceDeskAnalytics.js
    │   │   ├── ServiceDeskAnalytics.css
    │   │   ├── ServiceDeskTrends.js
    │   │   ├── ServiceDeskTrends.css
    │   │   ├── DevOpsAnalytics.js
    │   │   ├── DevOpsAnalytics.css
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
- `GET /api/service-desk-analytics?days=30` - Get comprehensive service desk analytics with insights including request type breakdown analysis (default: 30 days)
- `GET /api/service-desk-trends?days=30` - Get service desk trends for all configured teams (default: 30 days)
- `GET /api/service-desk-trends-devops?days=30` - Get service desk trends for DevOps team only (default: 30 days)
- `GET /api/devops-analytics?days=30` - Get combined DevOps analytics with trends and open tickets age data (default: 30 days)
- `GET /api/devops-open-tickets-age?days=30` - Get average age trend of open DevOps tickets (default: 30 days)

## Dashboard Sections

### Service Desk Tab (Default)

#### Service Desk Analytics
Comprehensive analytics dashboard providing detailed insights into service desk operations (last 30 days):
- **Summary Cards**: Key metrics with conditional formatting
  - Total tickets created within the period
  - Resolution rate percentage (tickets resolved / tickets created)
  - Incidents & Build Issues count with percentage of total tickets
  - Average resolution time (orange warning when exceeding 5-day target)
- **Key Insights**: 5 dynamic, data-driven insights with conditional logic
  - **Resolution Performance**: Color-coded status showing if team is clearing backlog (green), at steady state, or backlog building (warning)
  - **Top Request Type Analysis**: Dominant request type with top sub-category breakdown for immediate action
  - **Critical Issues Volume**: Count and percentage of incidents/build issues with top root cause inline
  - **Workload Imbalance**: Only displayed when single assignee handles >40% of tickets (red flag indicator)
  - **Resolution Speed**: Average resolution time with performance indicator (green when meeting ≤5 day target, warning when exceeding)
- **Request Type Breakdown**: Stacked bar chart showing top 3 sub-categories for each major request type
  - Automated pattern detection for Access Requests (GitHub, Azure, VPN, SQL/Database, Jira, etc.)
  - Build/Deployment Issues breakdown (Production, Sandbox, Certificates, Pipeline, etc.)
  - General IT Help categorization (Software Install, Licensing, MS Teams, Office Apps, etc.)
  - Interactive tooltips with example tickets and color-coded segments
- **Incident Root Cause Analysis**: Automated pattern detection for incidents and build issues
  - Analyzes [System] Incident, [System] Problem, and Build Issue types
  - Displays top 3 root causes with visual cards showing:
    - Category name with ranking badge
    - Issue count and percentage of total incidents
    - Progress bar visualization
    - Recent example tickets with keys and summaries
  - Identifies patterns: Application Error, Build Pipeline, Deployment, Database, Certificate, Performance, Network, Server/Infrastructure
  - Helps teams focus on systemic issues requiring preventive action

### DevOps Tab

#### DevOps Analytics
Comprehensive DevOps insights dashboard (last 30 days):
- **4 Summary Tiles**: Total Requests, Resolution Rate, Average Resolution Time, and Open Tickets with average age
- **Conditional Formatting**: Green for meeting targets (≤5 days resolution, ≥90% resolution rate), orange/red for warnings
- **Key Insights**: Dynamic insights showing:
  - Resolution performance (clearing backlog, steady state, or backlog building)
  - Resolution speed indicator with target comparison
  - Open ticket age analysis
  - Aging ticket alerts for tickets >30 days old

### Trends Tab

#### Service Desk Trends
Shows metrics for all configured service desk teams:
- Average resolution time (days and hours) - calculated from tickets resolved in the 30-day period
- Total tickets created vs resolved - counts tickets created/resolved within the 30-day period
- Resolution rate percentage - calculated as (resolved / created) within the period
- 30-day trend line graph showing open tickets over time
- **Conditional Formatting**: Metrics display in green when meeting targets (≤5 days resolution time, ≥90% resolution rate), red when below targets

#### DevOps Service Desk Trends
Dedicated view for DevOps team with:
- Same metrics as Service Desk Trends
- Filtered specifically to DevOps team tickets
- Independent 30-day trend visualization
- **Conditional Formatting**: Same targets and color coding as Service Desk Trends

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
