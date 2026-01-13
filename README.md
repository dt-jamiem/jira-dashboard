# Jira Dashboard

A comprehensive dashboard for visualizing Jira data with React frontend and Node.js backend, styled with DataTorque's corporate branding.

## Recent Updates

### January 2026
- **Capacity Planning Dashboard**: Added comprehensive capacity planning with team-based workload analysis (January 14, 2026)
  - Three-level hierarchical grouping for DTI Requests: DTI Requests > Teams > Epics/Items
  - Team-based workload calculation for DTI project using Atlassian Team field (customfield_10001)
  - Summary cards showing total workload, team velocity, completion forecast, and flow analysis
  - Workload by Assignee table with ticket counts, story point totals, and capacity days calculation
  - Parent Grouping view with expand/collapse functionality for hierarchical ticket organization
  - Cumulative flow chart tracking created vs resolved tickets over time
  - Capacity insights with dynamic analysis of workload distribution and forecasting
  - Debug endpoint `/api/debug-fields` for Jira field discovery and troubleshooting

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

The dashboard is organized into five main tabs:

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

### Capacity Planning Tab
- **Capacity Planning Dashboard**: Comprehensive team-based workload analysis and forecasting (last 30 days)
  - **Summary Cards**: Total story points, team velocity, completion forecast, and cumulative flow metrics
  - **Workload by Assignee**: Table showing each team member's workload with:
    - Total tickets (with breakdown of estimated vs unestimated)
    - Story points (estimated + guessed for unestimated tickets)
    - Capacity days calculation based on velocity
    - Ticket aging analysis with warnings for tickets older than 30 days
    - Visual progress bars showing relative workload
  - **Parent Grouping**: Three-level hierarchical view with expand/collapse functionality:
    - **Level 1**: DTI Requests grouped by internal team (Technology Operations, DBA, etc.)
    - **Level 2**: Teams containing related Epics or issue types
    - **Level 3**: Individual Epics with their constituent tickets
    - Team assignments extracted from Atlassian Team field (customfield_10001)
    - Click to expand/collapse groups for detailed exploration
  - **Cumulative Flow Chart**: Line graph tracking created vs resolved tickets over the 30-day period
  - **Capacity Insights**: Dynamic analysis cards showing workload distribution, bottlenecks, and forecasting
  - Uses team-based workload calculation for DTI project items via customfield_10001

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
    │   │   ├── DevOpsOpenTicketsAge.js
    │   │   ├── CapacityPlanning.js
    │   │   └── CapacityPlanning.css
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
- `GET /api/capacity-planning?days=30` - Get comprehensive capacity planning data with team-based workload analysis and hierarchical grouping (default: 30 days)
- `GET /api/debug-fields` - Debug endpoint to query all Jira field metadata and identify team-related fields (useful for troubleshooting custom field mappings)

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

### Capacity Planning Tab

#### Capacity Planning Dashboard
Comprehensive team-based workload analysis and forecasting dashboard (last 30 days):

**Summary Cards:**
- **Total Workload**: Combined story points from all team members (estimated + guessed for unestimated tickets)
- **Team Velocity**: Average story points completed per day based on the 30-day period
- **Completion Forecast**: Estimated days to complete current workload at current velocity
- **Cumulative Flow**: Net change in open tickets (created vs resolved) over the period

**Workload by Assignee:**
A detailed table showing each team member's current workload:
- **Assignee**: Team member name
- **Tickets**: Total ticket count with breakdown of estimated vs unestimated tickets
- **Estimated SP**: Story points for tickets with estimates
- **Guess SP**: Estimated story points for unestimated tickets (based on 8 SP average)
- **Total SP**: Combined story points (estimated + guessed)
- **Capacity Days**: Estimated days to complete workload based on team velocity
- **Avg Age**: Average age of tickets in days
- **Oldest Ticket**: Age of oldest ticket with warning indicator for tickets > 30 days
- **Visual Chart**: Progress bar showing relative workload distribution

**Parent Grouping - Three-Level Hierarchy:**
The Parent Grouping section provides a hierarchical view of tickets organized into three levels with expand/collapse functionality:

1. **Level 1 - DTI Requests by Team**: Top-level grouping showing internal teams
   - Teams extracted from Atlassian Team field (customfield_10001)
   - Examples: "Technology Operations", "DBA", etc.
   - Displays team name with expand icon
   - Shows aggregated metrics for all items in the team

2. **Level 2 - Epics or Issue Types**: Mid-level grouping under each team
   - Epics when available (e.g., "DTI-1234: Enhance Database Performance")
   - Issue types for non-epic items (e.g., "DTI: Task", "DTI: Story")
   - Indented 2rem from left for visual hierarchy
   - Click to expand/collapse epic details

3. **Level 3 - Individual Tickets**: Lowest-level items
   - Individual tickets within each epic or issue type group
   - Shows ticket key and summary
   - Indented 4rem from left for clear hierarchy
   - Displays individual ticket metrics (story points, days, etc.)

Each level displays:
- Issue type or group name
- Ticket count (estimated + unestimated breakdown)
- Story points (estimated, guessed, total)
- Capacity days
- Visual progress bar

**Team-Based Workload Calculation:**
- **DTI Project Items**: Uses Atlassian Team field (customfield_10001) for team assignment
  - Field structure: `{"id": "UUID", "name": "Technology Operations"}`
  - Extracts team name from `customfield_10001.name`
  - Groups all DTI items by their assigned team
- **Other Projects**: Uses assignee display name for workload calculation
- Maintains consistent metrics and visualization across both approaches

**Cumulative Flow Chart:**
A line graph showing ticket flow over the 30-day period:
- Created tickets line (green) showing new work incoming
- Resolved tickets line (dark gray) showing work completed
- X-axis: 30-day date range
- Y-axis: Cumulative ticket count
- Helps identify trends in backlog growth or reduction

**Capacity Insights:**
Dynamic analysis cards showing:
- Workload distribution across team members
- Bottleneck identification
- Completion time forecasting
- Team capacity utilization

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

### Jira Custom Field Mapping Issues

If you encounter issues with team names or other custom fields not displaying correctly:

1. **Use the Debug Endpoint**: Navigate to `http://localhost:5000/api/debug-fields` to view all available Jira fields
   - The endpoint returns all field metadata including IDs, names, clause names, and schemas
   - Search the output for fields related to your data (e.g., "team", "assignee", etc.)

2. **Identify the Correct Field**:
   - Look for the `clauseNames` property to match JQL query syntax
   - Example: If your JQL uses `"Team[Team]"`, look for a field with that clause name
   - The field ID will be something like `customfield_10001`

3. **Common Custom Fields**:
   - `customfield_10001`: Atlassian Team field (structure: `{"id": "UUID", "name": "Team Name"}`)
   - `customfield_10083`: Often used for project/client categorization (array format)
   - Other custom fields may vary by Jira instance

4. **Update the Backend Code**:
   - In `backend/server.js`, update the fields array around line 1760 to include your custom field
   - Update team extraction logic in the capacity planning endpoint (around lines 1897-1920)
   - For team fields, extract the name from the field structure: `teamField.name`

5. **Test Your Changes**:
   - Restart the backend server
   - Check the browser console and backend logs for any field-related errors
   - Verify team names display correctly in the Capacity Planning dashboard

## Technologies Used

- **Frontend**: React, Axios, Recharts, Custom SVG Charts
- **Backend**: Node.js, Express, Axios
- **API**: Jira REST API v3
- **Styling**: Custom CSS with DataTorque branding and responsive design
- **Design**: DataTorque corporate color scheme and typography (Calibri font family)

## License

This project is for internal use only.
