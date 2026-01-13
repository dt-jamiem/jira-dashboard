require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Jira API configuration
const jiraConfig = {
  baseURL: `${process.env.JIRA_URL}/rest/api/3`,
  auth: {
    username: process.env.JIRA_EMAIL,
    password: process.env.JIRA_API_TOKEN
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// Create axios instance for Jira API
const jiraAPI = axios.create(jiraConfig);

// Custom JQL filter for specific projects and teams
const BASE_JQL_FILTER = 'Project IN (DevOps, TechOps, "Technology Group") OR (Project = DTI AND "Team[Team]" IN (01c3b859-1307-41e3-8a88-24c701dd1713, 9888ca76-8551-47b3-813f-4bf5df9e9762, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3, a092fa48-f541-4358-90b8-ba6caccceb72))';

// Helper function to calculate metrics
function calculateMetrics(issues) {
  const metrics = {
    totalIssues: issues.length,
    byStatus: {},
    byType: {},
    byPriority: {},
    byAssignee: {},
    cycleTimes: [],
    leadTimes: []
  };

  issues.forEach(issue => {
    const fields = issue.fields;

    // Count by status
    const status = fields.status?.name || 'Unknown';
    metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;

    // Count by type
    const type = fields.issuetype?.name || 'Unknown';
    metrics.byType[type] = (metrics.byType[type] || 0) + 1;

    // Count by priority
    const priority = fields.priority?.name || 'Unknown';
    metrics.byPriority[priority] = (metrics.byPriority[priority] || 0) + 1;

    // Count by assignee
    const assignee = fields.assignee?.displayName || 'Unassigned';
    metrics.byAssignee[assignee] = (metrics.byAssignee[assignee] || 0) + 1;

    // Calculate cycle time (time from In Progress to Done)
    if (fields.created && fields.resolutiondate) {
      const created = new Date(fields.created);
      const resolved = new Date(fields.resolutiondate);
      const cycleTime = Math.floor((resolved - created) / (1000 * 60 * 60 * 24)); // days
      metrics.cycleTimes.push(cycleTime);
      metrics.leadTimes.push(cycleTime);
    }
  });

  // Calculate average cycle time and lead time
  if (metrics.cycleTimes.length > 0) {
    metrics.avgCycleTime = Math.round(
      metrics.cycleTimes.reduce((a, b) => a + b, 0) / metrics.cycleTimes.length
    );
    metrics.avgLeadTime = Math.round(
      metrics.leadTimes.reduce((a, b) => a + b, 0) / metrics.leadTimes.length
    );
  } else {
    metrics.avgCycleTime = 0;
    metrics.avgLeadTime = 0;
  }

  return metrics;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jira Dashboard API is running' });
});

// Get all projects (filtered to specific projects)
app.get('/api/projects', async (req, res) => {
  try {
    const response = await jiraAPI.get('/project');

    // Filter to only include DevOps, TechOps, Technology Group, and DTI
    const filteredProjects = response.data
      .filter(p =>
        ['DevOps', 'TechOps', 'Technology Group', 'DTI'].includes(p.name) ||
        ['DevOps', 'TechOps', 'DTI'].includes(p.key)
      )
      .map(project => ({
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
        avatarUrls: project.avatarUrls,
        lead: project.lead?.displayName
      }));

    res.json(filteredProjects);
  } catch (error) {
    console.error('Error fetching projects:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error.response?.data || error.message
    });
  }
});

// Get issues for a specific project
app.get('/api/projects/:projectKey/issues', async (req, res) => {
  try {
    const { projectKey } = req.params;
    const maxResults = parseInt(req.query.maxResults) || 1000;

    const response = await jiraAPI.post('/search/jql', {
      jql: `(${BASE_JQL_FILTER}) AND project = ${projectKey} ORDER BY created DESC`,
      maxResults: maxResults,
      fields: ['summary', 'status', 'issuetype', 'priority', 'assignee', 'created', 'updated', 'resolutiondate', 'reporter']
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching issues:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch issues',
      details: error.response?.data || error.message
    });
  }
});

// Get all issues across all projects
app.get('/api/issues', async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults) || 1000;

    const response = await jiraAPI.post('/search/jql', {
      jql: `(${BASE_JQL_FILTER}) ORDER BY created DESC`,
      maxResults: maxResults,
      fields: ['summary', 'status', 'issuetype', 'priority', 'assignee', 'created', 'updated', 'resolutiondate', 'reporter', 'project']
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching all issues:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch issues',
      details: error.response?.data || error.message
    });
  }
});

// Get issue statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const limit = parseInt(req.query.maxResults) || 1000;
    let allIssues = [];
    let nextPageToken = null;

    // Fetch pages until we have enough issues or no more pages
    do {
      const requestBody = {
        jql: `(${BASE_JQL_FILTER}) ORDER BY created DESC`,
        fields: ['status', 'issuetype', 'priority', 'assignee', 'created', 'resolutiondate']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} issues, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      // Stop if we've hit our limit or this is the last page
      if (allIssues.length >= limit || response.data.isLast) {
        break;
      }
    } while (nextPageToken);

    // Trim to requested limit
    allIssues = allIssues.slice(0, limit);
    console.log(`Statistics: Collected ${allIssues.length} total issues`);

    const metrics = calculateMetrics(allIssues);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching statistics:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.response?.data || error.message
    });
  }
});

// Get team performance metrics
app.get('/api/performance', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    let allIssues = [];
    let nextPageToken = null;

    // Fetch all pages
    do {
      const requestBody = {
        jql: `(${BASE_JQL_FILTER}) AND (created >= "${dateStr}" OR resolved >= "${dateStr}") ORDER BY created DESC`,
        fields: ['status', 'assignee', 'created', 'resolutiondate', 'updated']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      if (response.data.isLast || allIssues.length >= 1000) {
        break;
      }
    } while (nextPageToken);

    const issues = allIssues.slice(0, 1000);
    const metrics = calculateMetrics(issues);

    // Calculate throughput (issues completed per week)
    const resolvedIssues = issues.filter(i => i.fields.resolutiondate);
    const throughput = Math.round((resolvedIssues.length / days) * 7);

    res.json({
      avgCycleTime: metrics.avgCycleTime,
      avgLeadTime: metrics.avgLeadTime,
      throughput,
      totalIssues: issues.length,
      resolvedIssues: resolvedIssues.length,
      inProgressIssues: issues.filter(i =>
        i.fields.status?.name?.toLowerCase().includes('progress')
      ).length,
      periodDays: days
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      details: error.response?.data || error.message
    });
  }
});

// Get project overview (projects with issue counts)
app.get('/api/overview', async (req, res) => {
  try {
    // First get all projects
    const projectsResponse = await jiraAPI.get('/project');
    const projects = projectsResponse.data;

    // Filter to only include DevOps, TechOps, Technology Group, and DTI
    const targetProjects = projects.filter(p =>
      ['DevOps', 'TechOps', 'Technology Group', 'DTI'].includes(p.name) ||
      ['DevOps', 'TechOps', 'DTI'].includes(p.key)
    );

    // Get issue counts for each filtered project
    const projectOverview = await Promise.all(
      targetProjects.map(async (project) => {
        try {
          const issuesResponse = await jiraAPI.post('/search/jql', {
            jql: `(${BASE_JQL_FILTER}) AND project = ${project.key}`,
            maxResults: 1
          });

          return {
            key: project.key,
            name: project.name,
            lead: project.lead?.displayName || 'Unknown',
            totalIssues: issuesResponse.data.total,
            avatarUrls: project.avatarUrls
          };
        } catch (err) {
          console.error(`Error fetching issues for project ${project.key}:`, err.response?.data || err.message);
          return {
            key: project.key,
            name: project.name,
            lead: project.lead?.displayName || 'Unknown',
            totalIssues: 0,
            avatarUrls: project.avatarUrls
          };
        }
      })
    );

    // Filter out projects with 0 issues
    const filteredOverview = projectOverview.filter(p => p.totalIssues > 0);

    res.json(filteredOverview);
  } catch (error) {
    console.error('Error fetching overview:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch overview',
      details: error.response?.data || error.message
    });
  }
});

// Get initiative completion data grouped by Project Short Name
app.get('/api/initiatives', async (req, res) => {
  try {
    const limit = parseInt(req.query.maxResults) || 1000;
    let allIssues = [];
    let nextPageToken = null;

    // Use JQL to filter for issues with Project Short Name populated
    const initiativesJQL = 'Project IN (DTI, DevOps, "Technology Group", TechOps) AND "Project Short Name[Short text]" IS NOT EMPTY';

    // Fetch all issues with pagination
    do {
      const requestBody = {
        jql: `${initiativesJQL} ORDER BY created DESC`,
        fields: ['summary', 'status', 'customfield_10574'] // customfield_10574 is Project Short Name
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} initiative issues, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      if (response.data.isLast || allIssues.length >= limit) {
        break;
      }
    } while (nextPageToken);

    console.log(`Initiatives: Collected ${allIssues.length} total issues with Project Short Name`);

    // Group issues by Project Short Name (customfield_10574)
    const initiatives = {};

    allIssues.forEach(issue => {
      if (!issue || !issue.fields) {
        return;
      }

      const projectShortName = issue.fields.customfield_10574 || 'Unassigned';
      const status = issue.fields.status?.name || 'Unknown';
      const isDone = ['Done', 'Closed', 'Resolved', 'Canceled'].includes(status);

      if (!initiatives[projectShortName]) {
        initiatives[projectShortName] = {
          name: projectShortName,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          issues: []
        };
      }

      initiatives[projectShortName].total++;
      if (isDone) {
        initiatives[projectShortName].completed++;
      } else if (status.toLowerCase().includes('progress')) {
        initiatives[projectShortName].inProgress++;
      } else {
        initiatives[projectShortName].todo++;
      }

      initiatives[projectShortName].issues.push({
        key: issue.key,
        summary: issue.fields.summary,
        status: status
      });
    });

    // Calculate completion percentage and convert to array
    const initiativesList = Object.values(initiatives)
      .map(initiative => ({
        ...initiative,
        completionPercentage: initiative.total > 0
          ? Math.round((initiative.completed / initiative.total) * 100)
          : 0
      }))
      .sort((a, b) => b.total - a.total);

    res.json(initiativesList);
  } catch (error) {
    console.error('Error fetching initiatives:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch initiatives',
      details: error.response?.data || error.message
    });
  }
});

// Get Technology Group initiatives grouped by component
app.get('/api/technology-initiatives', async (req, res) => {
  try {
    const limit = parseInt(req.query.maxResults) || 1000;
    let allIssues = [];
    let nextPageToken = null;

    // JQL to filter for Technology Group issues with components
    const techInitiativesJQL = 'Project = "Technology Group" AND component IS NOT EMPTY';

    // Fetch all issues with pagination
    do {
      const requestBody = {
        jql: `${techInitiativesJQL} ORDER BY created DESC`,
        fields: ['summary', 'status', 'components']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} technology initiative issues, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      if (response.data.isLast || allIssues.length >= limit) {
        break;
      }
    } while (nextPageToken);

    console.log(`Technology Initiatives: Collected ${allIssues.length} total issues with components`);

    // Group issues by component
    const initiatives = {};

    allIssues.forEach(issue => {
      if (!issue || !issue.fields) {
        return;
      }

      const components = issue.fields.components || [];
      const status = issue.fields.status?.name || 'Unknown';
      const isDone = ['Done', 'Closed', 'Resolved', 'Canceled'].includes(status);

      // An issue can have multiple components, so we count it for each
      components.forEach(component => {
        const componentName = component.name || 'Unassigned';

        if (!initiatives[componentName]) {
          initiatives[componentName] = {
            name: componentName,
            total: 0,
            completed: 0,
            inProgress: 0,
            todo: 0,
            issues: []
          };
        }

        initiatives[componentName].total++;
        if (isDone) {
          initiatives[componentName].completed++;
        } else if (status.toLowerCase().includes('progress')) {
          initiatives[componentName].inProgress++;
        } else {
          initiatives[componentName].todo++;
        }

        initiatives[componentName].issues.push({
          key: issue.key,
          summary: issue.fields.summary,
          status: status
        });
      });
    });

    // Calculate completion percentage and convert to array
    const initiativesList = Object.values(initiatives)
      .map(initiative => ({
        ...initiative,
        completionPercentage: initiative.total > 0
          ? Math.round((initiative.completed / initiative.total) * 100)
          : 0
      }))
      .sort((a, b) => b.total - a.total);

    res.json(initiativesList);
  } catch (error) {
    console.error('Error fetching technology initiatives:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch technology initiatives',
      details: error.response?.data || error.message
    });
  }
});

// Get service desk trends for Project DTI
app.get('/api/service-desk-trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    let allIssues = [];
    let nextPageToken = null;

    // Fetch DTI tickets that were created OR resolved in the period, plus currently open tickets
    // This ensures we have all data needed for accurate metrics
    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" IN (9888ca76-8551-47b3-813f-4bf5df9e9762, a092fa48-f541-4358-90b8-ba6caccceb72, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND (created >= "${dateStr}" OR resolutiondate >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'priority', 'issuetype', 'customfield_10010']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} service desk issues, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      if (response.data.isLast || allIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    console.log(`Service Desk Trends: Collected ${allIssues.length} total issues (including older open tickets)`);

    // Group tickets by creation date (daily)
    const ticketsByDate = {};
    const resolvedByDate = {};
    const resolutionTimes = [];
    const incidentResolutionTimes = [];
    const periodStartDate = new Date(dateStr);
    const periodEndDate = new Date();
    periodEndDate.setHours(23, 59, 59, 999);

    let totalCreatedInPeriod = 0;
    let totalResolvedInPeriod = 0;

    // Helper function to check if issue is an incident
    const isIncident = (issue) => {
      const issueType = issue.fields.issuetype?.name;
      return issueType === '[System] Incident' || issueType === '[System] Problem' || issueType === 'Build Issue';
    };

    allIssues.forEach(issue => {
      const created = new Date(issue.fields.created);
      const dateKey = created.toISOString().split('T')[0];

      // Count created tickets by date
      ticketsByDate[dateKey] = (ticketsByDate[dateKey] || 0) + 1;

      // Count tickets created within the period
      if (created >= periodStartDate && created <= periodEndDate) {
        totalCreatedInPeriod++;
      }

      // Count resolved tickets by date and calculate resolution time
      if (issue.fields.resolutiondate) {
        const resolved = new Date(issue.fields.resolutiondate);
        const resolvedDateKey = resolved.toISOString().split('T')[0];
        resolvedByDate[resolvedDateKey] = (resolvedByDate[resolvedDateKey] || 0) + 1;

        // Only count resolution time for tickets resolved within the period
        if (resolved >= periodStartDate && resolved <= periodEndDate) {
          totalResolvedInPeriod++;
          const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60);
          resolutionTimes.push(resolutionTimeHours);

          // Track incident-specific resolution times
          if (isIncident(issue)) {
            incidentResolutionTimes.push(resolutionTimeHours);
          }
        }
      }
    });

    // Calculate average resolution time
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Calculate average incident resolution time
    const avgIncidentResolutionTime = incidentResolutionTimes.length > 0
      ? incidentResolutionTimes.reduce((a, b) => a + b, 0) / incidentResolutionTimes.length
      : 0;

    // Generate date range for the trend window
    const trendStartDate = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const volumeData = [];
    const currentDate = new Date(trendStartDate);

    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dateKey = currentDate.toISOString().split('T')[0];
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Count tickets that were:
      // 1. Created on or before this date
      // 2. Either not resolved, or resolved after this date
      const openOnThisDate = allIssues.filter(issue => {
        const createdDate = new Date(issue.fields.created);
        const isCreatedByThisDate = createdDate <= endOfDay;

        if (!isCreatedByThisDate) return false;

        if (!issue.fields.resolutiondate) {
          return true; // Not resolved, so it's open
        }

        const resolvedDate = new Date(issue.fields.resolutiondate);
        return resolvedDate > endOfDay; // Resolved after this date, so it was open on this date
      }).length;

      const created = ticketsByDate[dateKey] || 0;
      const resolved = resolvedByDate[dateKey] || 0;

      volumeData.push({
        date: dateKey,
        created,
        resolved,
        openTickets: openOnThisDate
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate current status breakdown
    const statusBreakdown = {};
    const priorityBreakdown = {};
    allIssues.forEach(issue => {
      const status = issue.fields.status?.name || 'Unknown';
      const priority = issue.fields.priority?.name || 'Unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
    });

    res.json({
      volumeData,
      resolutionMetrics: {
        avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
        avgResolutionTimeDays: Math.round((avgResolutionTime / 24) * 10) / 10,
        avgIncidentResolutionTimeHours: Math.round(avgIncidentResolutionTime * 10) / 10,
        avgIncidentResolutionTimeDays: Math.round((avgIncidentResolutionTime / 24) * 10) / 10,
        incidentCount: incidentResolutionTimes.length,
        totalResolved: totalResolvedInPeriod,
        totalCreated: totalCreatedInPeriod,
        resolutionRate: totalCreatedInPeriod > 0
          ? Math.round((totalResolvedInPeriod / totalCreatedInPeriod) * 100)
          : 0
      },
      statusBreakdown,
      priorityBreakdown,
      periodDays: days
    });
  } catch (error) {
    console.error('Error fetching service desk trends:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch service desk trends',
      details: error.response?.data || error.message
    });
  }
});

// Get Service Desk average age trends
app.get('/api/service-desk-age-trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    let allIssues = [];
    let nextPageToken = null;

    // Fetch DTI tickets that were created OR resolved in the period, plus currently open tickets
    // This ensures we have all data needed for accurate metrics
    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" IN (9888ca76-8551-47b3-813f-4bf5df9e9762, a092fa48-f541-4358-90b8-ba6caccceb72, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND (created >= "${dateStr}" OR resolutiondate >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'priority', 'issuetype', 'customfield_10010']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} service desk age issues, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      if (response.data.isLast || allIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    console.log(`Service Desk Age Trends: Collected ${allIssues.length} total issues (including older open tickets)`);

    // Generate date range for the trend window
    const trendStartDate = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const trendData = [];
    const currentDate = new Date(trendStartDate);

    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dateKey = currentDate.toISOString().split('T')[0];
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find tickets that were open on this date
      const openOnThisDate = allIssues.filter(issue => {
        const createdDate = new Date(issue.fields.created);
        const isCreatedByThisDate = createdDate <= endOfDay;

        if (!isCreatedByThisDate) return false;

        if (!issue.fields.resolutiondate) {
          return true; // Not resolved, so it's open
        }

        const resolvedDate = new Date(issue.fields.resolutiondate);
        return resolvedDate > endOfDay; // Resolved after this date, so it was open on this date
      });

      // Calculate average age for open tickets on this date
      let totalAge = 0;
      openOnThisDate.forEach(issue => {
        const createdDate = new Date(issue.fields.created);
        const ageDays = (endOfDay - createdDate) / (1000 * 60 * 60 * 24);
        totalAge += ageDays;
      });

      const avgAge = openOnThisDate.length > 0
        ? Math.round((totalAge / openOnThisDate.length) * 10) / 10
        : 0;

      trendData.push({
        date: dateKey,
        avgAge: avgAge,
        openCount: openOnThisDate.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate current metrics
    const currentOpenIssues = allIssues.filter(issue => !issue.fields.resolutiondate);
    let currentTotalAge = 0;
    let oldestTicketAge = 0;

    currentOpenIssues.forEach(issue => {
      const createdDate = new Date(issue.fields.created);
      const ageDays = (today - createdDate) / (1000 * 60 * 60 * 24);
      currentTotalAge += ageDays;
      if (ageDays > oldestTicketAge) {
        oldestTicketAge = ageDays;
      }
    });

    const currentAvgAge = currentOpenIssues.length > 0
      ? Math.round((currentTotalAge / currentOpenIssues.length) * 10) / 10
      : 0;

    res.json({
      trendData,
      currentMetrics: {
        avgAge: currentAvgAge,
        totalOpen: currentOpenIssues.length,
        oldestTicketAge: Math.round(oldestTicketAge)
      },
      periodDays: days
    });
  } catch (error) {
    console.error('Error fetching service desk age trends:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch service desk age trends',
      details: error.response?.data || error.message
    });
  }
});

// Get DevOps-specific service desk trends
app.get('/api/service-desk-trends-devops', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    let allIssues = [];
    let nextPageToken = null;

    // Fetch DevOps tickets that were created OR resolved in the period, plus currently open tickets
    // This ensures we have all data needed for accurate metrics
    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" IN (9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND (created >= "${dateStr}" OR resolutiondate >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'priority', 'issuetype', 'customfield_10010']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} DevOps service desk issues, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      if (response.data.isLast || allIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    console.log(`DevOps Service Desk Trends: Collected ${allIssues.length} total issues (including older open tickets)`);

    // Group tickets by creation date (daily)
    const ticketsByDate = {};
    const resolvedByDate = {};
    const resolutionTimes = [];
    const incidentResolutionTimes = [];
    const periodStartDate = new Date(dateStr);
    const periodEndDate = new Date();
    periodEndDate.setHours(23, 59, 59, 999);

    let totalCreatedInPeriod = 0;
    let totalResolvedInPeriod = 0;

    // Helper function to check if issue is an incident
    const isIncident = (issue) => {
      const issueType = issue.fields.issuetype?.name;
      return issueType === '[System] Incident' || issueType === '[System] Problem' || issueType === 'Build Issue';
    };

    allIssues.forEach(issue => {
      const created = new Date(issue.fields.created);
      const dateKey = created.toISOString().split('T')[0];

      // Count created tickets by date
      ticketsByDate[dateKey] = (ticketsByDate[dateKey] || 0) + 1;

      // Count tickets created within the period
      if (created >= periodStartDate && created <= periodEndDate) {
        totalCreatedInPeriod++;
      }

      // Count resolved tickets by date and calculate resolution time
      if (issue.fields.resolutiondate) {
        const resolved = new Date(issue.fields.resolutiondate);
        const resolvedDateKey = resolved.toISOString().split('T')[0];
        resolvedByDate[resolvedDateKey] = (resolvedByDate[resolvedDateKey] || 0) + 1;

        // Only count resolution time for tickets resolved within the period
        if (resolved >= periodStartDate && resolved <= periodEndDate) {
          totalResolvedInPeriod++;
          const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60);
          resolutionTimes.push(resolutionTimeHours);

          // Track incident-specific resolution times
          if (isIncident(issue)) {
            incidentResolutionTimes.push(resolutionTimeHours);
          }
        }
      }
    });

    // Calculate average resolution time
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Calculate average incident resolution time
    const avgIncidentResolutionTime = incidentResolutionTimes.length > 0
      ? incidentResolutionTimes.reduce((a, b) => a + b, 0) / incidentResolutionTimes.length
      : 0;

    // Generate date range for the trend window
    const trendStartDate = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const volumeData = [];
    const currentDate = new Date(trendStartDate);

    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dateKey = currentDate.toISOString().split('T')[0];
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Count tickets that were:
      // 1. Created on or before this date
      // 2. Either not resolved, or resolved after this date
      const openOnThisDate = allIssues.filter(issue => {
        const createdDate = new Date(issue.fields.created);
        const isCreatedByThisDate = createdDate <= endOfDay;

        if (!isCreatedByThisDate) return false;

        if (!issue.fields.resolutiondate) {
          return true; // Not resolved, so it's open
        }

        const resolvedDate = new Date(issue.fields.resolutiondate);
        return resolvedDate > endOfDay; // Resolved after this date, so it was open on this date
      }).length;

      const created = ticketsByDate[dateKey] || 0;
      const resolved = resolvedByDate[dateKey] || 0;

      volumeData.push({
        date: dateKey,
        created,
        resolved,
        openTickets: openOnThisDate
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate current status breakdown
    const statusBreakdown = {};
    const priorityBreakdown = {};
    allIssues.forEach(issue => {
      const status = issue.fields.status?.name || 'Unknown';
      const priority = issue.fields.priority?.name || 'Unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
    });

    res.json({
      volumeData,
      resolutionMetrics: {
        avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
        avgResolutionTimeDays: Math.round((avgResolutionTime / 24) * 10) / 10,
        avgIncidentResolutionTimeHours: Math.round(avgIncidentResolutionTime * 10) / 10,
        avgIncidentResolutionTimeDays: Math.round((avgIncidentResolutionTime / 24) * 10) / 10,
        incidentCount: incidentResolutionTimes.length,
        totalResolved: totalResolvedInPeriod,
        totalCreated: totalCreatedInPeriod,
        resolutionRate: totalCreatedInPeriod > 0
          ? Math.round((totalResolvedInPeriod / totalCreatedInPeriod) * 100)
          : 0
      },
      statusBreakdown,
      priorityBreakdown,
      periodDays: days
    });
  } catch (error) {
    console.error('Error fetching DevOps service desk trends:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch DevOps service desk trends',
      details: error.response?.data || error.message
    });
  }
});

// Get average age of open DevOps tickets trend
app.get('/api/devops-open-tickets-age', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    // Fetch currently open tickets for DevOps team
    let allIssues = [];
    let nextPageToken = null;

    const jql = `Project = DTI AND "Team[Team]" = 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3 AND statusCategory != Done ORDER BY created DESC`;

    do {
      const requestBody = {
        jql,
        maxResults: 50,
        fields: ['created', 'status', 'priority', 'summary', 'key']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);

      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      console.log(`Fetched ${response.data.issues?.length || 0} open DevOps tickets, total so far: ${allIssues.length}, isLast: ${response.data.isLast}`);

      if (response.data.isLast || allIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    console.log(`DevOps Open Tickets: Collected ${allIssues.length} total open issues`);

    // Calculate age trend over the last N days
    const now = new Date();
    const trendData = [];

    for (let i = days - 1; i >= 0; i--) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Filter tickets that were open on this date
      const ticketsOpenOnDate = allIssues.filter(issue => {
        const createdDate = new Date(issue.fields.created);
        // Ticket was created before or on this date
        return createdDate < nextDate;
      });

      // Calculate average age in days for tickets open on this date
      let totalAge = 0;
      ticketsOpenOnDate.forEach(issue => {
        const createdDate = new Date(issue.fields.created);
        const ageInDays = Math.floor((checkDate - createdDate) / (1000 * 60 * 60 * 24));
        totalAge += ageInDays;
      });

      const avgAge = ticketsOpenOnDate.length > 0
        ? Math.round((totalAge / ticketsOpenOnDate.length) * 10) / 10
        : 0;

      trendData.push({
        date: checkDate.toISOString().split('T')[0],
        avgAge: avgAge,
        openCount: ticketsOpenOnDate.length
      });
    }

    // Current stats
    const currentTotalAge = allIssues.reduce((sum, issue) => {
      const createdDate = new Date(issue.fields.created);
      const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      return sum + ageInDays;
    }, 0);

    const currentAvgAge = allIssues.length > 0
      ? Math.round((currentTotalAge / allIssues.length) * 10) / 10
      : 0;

    // Status breakdown of open tickets
    const statusBreakdown = {};
    allIssues.forEach(issue => {
      const status = issue.fields.status?.name || 'Unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    res.json({
      trendData,
      currentMetrics: {
        avgAge: currentAvgAge,
        totalOpen: allIssues.length,
        oldestTicketAge: allIssues.length > 0
          ? Math.max(...allIssues.map(issue => {
              const createdDate = new Date(issue.fields.created);
              return Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            }))
          : 0
      },
      statusBreakdown,
      periodDays: days
    });
  } catch (error) {
    console.error('Error fetching DevOps open tickets age:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch DevOps open tickets age',
      details: error.response?.data || error.message
    });
  }
});

// Analytics endpoint for Service Desk insights
app.get('/api/service-desk-analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    console.log(`Fetching Service Desk analytics for last ${days} days (since ${dateStr})`);

    let allIssues = [];
    let nextPageToken = null;

    // Fetch DTI tickets that have been updated in the period (shows active workload)
    // This includes new, resolved, and in-progress tickets that have been touched
    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" IN (9b7aba3a-a76b-46b8-8a3b-658baad7c1a3, 9888ca76-8551-47b3-813f-4bf5df9e9762, a092fa48-f541-4358-90b8-ba6caccceb72) AND updated >= endOfDay(-${days}) ORDER BY updated DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'priority', 'issuetype', 'customfield_10010', 'reporter', 'assignee', 'description', 'updated']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);
      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      if (response.data.isLast || allIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    console.log(`Analytics: Collected ${allIssues.length} total tickets (including older open tickets)`);

    // Define period boundaries - matches service-desk-trends logic
    const periodStartDate = new Date(dateStr);
    const periodEndDate = new Date();
    periodEndDate.setHours(23, 59, 59, 999);

    // Analytics counters
    const issueTypeCounts = {};
    const requestTypeCounts = {};
    const priorityCounts = {};
    const reporterCounts = {};
    const assigneeCounts = {};
    const statusCounts = {};
    const applicationMentions = {};
    const applicationExamples = {}; // Store examples for each app

    // Common application keywords to search for in summaries and descriptions
    const appKeywords = [
      'sharepoint', 'teams', 'outlook', 'excel', 'power bi', 'powerbi',
      'azure', 'sql', 'database', 'jira', 'confluence', 'slack', 'zoom', 'vpn',
      'active directory', 'exchange', 'onedrive', 'windows', 'macos', 'linux',
      'tableau', 'salesforce', 'sap', 'oracle', 'aws', 'google', 'microsoft'
    ];

    // Count tickets resolved within the period and calculate resolution times
    let totalResolvedInPeriod = 0;
    const resolutionTimes = [];
    allIssues.forEach(issue => {
      if (issue.fields.resolutiondate) {
        const resolved = new Date(issue.fields.resolutiondate);
        const created = new Date(issue.fields.created);
        if (resolved >= periodStartDate && resolved <= periodEndDate) {
          totalResolvedInPeriod++;
          const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60);
          resolutionTimes.push(resolutionTimeHours);
        }
      }
    });

    // Calculate average resolution time
    const avgResolutionTimeHours = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;
    const avgResolutionTimeDays = avgResolutionTimeHours / 24;

    // All fetched tickets are already filtered by updated date via JQL
    // For certain metrics (like creation-based ones), we filter to tickets created in period
    const ticketsCreatedInPeriod = allIssues.filter(issue => {
      const created = new Date(issue.fields.created);
      return created >= periodStartDate && created <= periodEndDate;
    });

    console.log(`Analytics: Total ${allIssues.length} tickets updated in the period`);
    console.log(`Analytics: ${ticketsCreatedInPeriod.length} tickets created within the period`);
    console.log(`Analytics: ${totalResolvedInPeriod} tickets resolved within the period`);

    // For workload distribution and other activity-based metrics, use all updated tickets
    allIssues.forEach(issue => {
      // Count assignees (active workload - anyone who worked on a ticket)
      const assignee = issue.fields.assignee?.displayName || 'Unassigned';
      assigneeCounts[assignee] = (assigneeCounts[assignee] || 0) + 1;

      // Count statuses
      const status = issue.fields.status?.name || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // For creation-based metrics, use only tickets created in the period
    ticketsCreatedInPeriod.forEach(issue => {
      // Count issue types
      const issueType = issue.fields.issuetype?.name || 'Unknown';
      issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;

      // Count request types
      const requestType = issue.fields.customfield_10010?.requestType?.name || 'Unknown';
      requestTypeCounts[requestType] = (requestTypeCounts[requestType] || 0) + 1;

      // Count priorities
      const priority = issue.fields.priority?.name || 'Unknown';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;

      // Count reporters
      const reporter = issue.fields.reporter?.displayName || 'Unknown';
      reporterCounts[reporter] = (reporterCounts[reporter] || 0) + 1;

      // Search for application mentions in summary and description
      const summary = (issue.fields.summary || '').toLowerCase();
      // Description might be an object or string - handle both cases
      let description = '';
      if (issue.fields.description) {
        if (typeof issue.fields.description === 'string') {
          description = issue.fields.description.toLowerCase();
        } else if (typeof issue.fields.description === 'object' && issue.fields.description.content) {
          // Handle Jira's Document format
          description = JSON.stringify(issue.fields.description).toLowerCase();
        }
      }
      const fullText = `${summary} ${description}`;

      appKeywords.forEach(keyword => {
        // Use word boundary regex to avoid false matches (e.g., "ad" matching "add")
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
        if (regex.test(fullText)) {
          const normalizedKey = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          applicationMentions[normalizedKey] = (applicationMentions[normalizedKey] || 0) + 1;

          // Store up to 3 examples per keyword
          if (!applicationExamples[normalizedKey]) {
            applicationExamples[normalizedKey] = [];
          }
          if (applicationExamples[normalizedKey].length < 3) {
            applicationExamples[normalizedKey].push({
              key: issue.key,
              summary: issue.fields.summary
            });
          }
        }
      });
    });

    // Convert to sorted arrays (top 10)
    const sortByCount = (obj) => {
      return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
    };

    // Calculate resolution rate (matches service-desk-trends logic)
    const resolutionRate = ticketsCreatedInPeriod.length > 0
      ? Math.round((totalResolvedInPeriod / ticketsCreatedInPeriod.length) * 100)
      : 0;

    // Analyze sub-categories within each top request type
    const requestTypeBreakdown = {};

    // Define keywords for each major request type
    const requestTypeKeywords = {
      'Access request': [
        { pattern: /\b(github|git)\b/i, label: 'GitHub/Git' },
        { pattern: /\bazure\b/i, label: 'Azure' },
        { pattern: /\b(vpn|watchguard)\b/i, label: 'VPN' },
        { pattern: /\b(sql|database)\b/i, label: 'SQL/Database' },
        { pattern: /\bjira\b/i, label: 'Jira' },
        { pattern: /\b(active directory|ad group)\b/i, label: 'Active Directory' },
        { pattern: /\b(sharepoint|confluence)\b/i, label: 'SharePoint/Confluence' },
        { pattern: /\b(claude|ai|copilot)\b/i, label: 'AI Tools' },
        { pattern: /\b(office 365|teams|outlook)\b/i, label: 'Office 365' },
        { pattern: /\b(license|subscription)\b/i, label: 'Licenses' }
      ],
      'Build or Deployment Issues': [
        { pattern: /\b(production|prod)\b/i, label: 'Production Issues' },
        { pattern: /\b(sandbox|test|dev)\b/i, label: 'Sandbox/Test Env' },
        { pattern: /\b(deployment|deploy)\b/i, label: 'Deployment' },
        { pattern: /\b(build|pipeline)\b/i, label: 'Build Pipeline' },
        { pattern: /\b(database|sql|bi refresh)\b/i, label: 'Database/BI' },
        { pattern: /\b(certificate|ssl|tls)\b/i, label: 'Certificates' },
        { pattern: /\b(infrastructure|server)\b/i, label: 'Infrastructure' },
        { pattern: /\b(package|dependency|npm)\b/i, label: 'Dependencies' }
      ],
      'General IT Help': [
        { pattern: /\b(install|installation)\b/i, label: 'Software Install' },
        { pattern: /\b(license|subscription|renewal)\b/i, label: 'Licensing' },
        { pattern: /\b(teams|channel)\b/i, label: 'MS Teams' },
        { pattern: /\b(office|excel|word|powerpoint|project)\b/i, label: 'Office Apps' },
        { pattern: /\bjira\b/i, label: 'Jira Config' },
        { pattern: /\b(sharepoint|onedrive)\b/i, label: 'SharePoint/OneDrive' },
        { pattern: /\b(laptop|hardware|device)\b/i, label: 'Hardware' },
        { pattern: /\b(email|outlook|inbox)\b/i, label: 'Email' },
        { pattern: /\b(power bi|power automate|power platform)\b/i, label: 'Power Platform' },
        { pattern: /\b(account|password|login)\b/i, label: 'Account Issues' }
      ],
      'New software': [
        { pattern: /\b(visual studio|vs code|ide)\b/i, label: 'Development Tools' },
        { pattern: /\b(office|excel|word|project)\b/i, label: 'Office Suite' },
        { pattern: /\b(power bi|power automate|power platform)\b/i, label: 'Power Platform' },
        { pattern: /\b(adobe|design|creative)\b/i, label: 'Adobe/Design Tools' },
        { pattern: /\b(license|subscription)\b/i, label: 'Licenses' }
      ],
      'Server or infrastructure request': [
        { pattern: /\b(azure|cloud)\b/i, label: 'Azure/Cloud' },
        { pattern: /\b(database|sql)\b/i, label: 'Database' },
        { pattern: /\b(certificate|ssl)\b/i, label: 'Certificates' },
        { pattern: /\b(vm|virtual machine)\b/i, label: 'Virtual Machines' },
        { pattern: /\b(storage|disk)\b/i, label: 'Storage' }
      ]
    };

    // Group tickets by request type and analyze
    ticketsCreatedInPeriod.forEach(issue => {
      const requestType = issue.fields.customfield_10010?.requestType?.name;
      if (!requestType || !requestTypeKeywords[requestType]) return;

      if (!requestTypeBreakdown[requestType]) {
        requestTypeBreakdown[requestType] = {
          total: 0,
          subCategories: {}
        };
      }

      requestTypeBreakdown[requestType].total++;

      const summary = (issue.fields.summary || '').toLowerCase();
      let description = '';
      if (issue.fields.description) {
        if (typeof issue.fields.description === 'string') {
          description = issue.fields.description.toLowerCase();
        } else if (typeof issue.fields.description === 'object' && issue.fields.description.content) {
          description = JSON.stringify(issue.fields.description).toLowerCase();
        }
      }
      const fullText = `${summary} ${description}`;

      // Check for keyword matches
      let matched = false;
      requestTypeKeywords[requestType].forEach(({ pattern, label }) => {
        if (pattern.test(fullText)) {
          if (!requestTypeBreakdown[requestType].subCategories[label]) {
            requestTypeBreakdown[requestType].subCategories[label] = {
              count: 0,
              examples: []
            };
          }
          requestTypeBreakdown[requestType].subCategories[label].count++;

          // Store up to 2 examples
          if (requestTypeBreakdown[requestType].subCategories[label].examples.length < 2) {
            requestTypeBreakdown[requestType].subCategories[label].examples.push({
              key: issue.key,
              summary: issue.fields.summary
            });
          }
          matched = true;
        }
      });

      // If no match, categorize as "Other"
      if (!matched) {
        if (!requestTypeBreakdown[requestType].subCategories['Other']) {
          requestTypeBreakdown[requestType].subCategories['Other'] = {
            count: 0,
            examples: []
          };
        }
        requestTypeBreakdown[requestType].subCategories['Other'].count++;
        if (requestTypeBreakdown[requestType].subCategories['Other'].examples.length < 2) {
          requestTypeBreakdown[requestType].subCategories['Other'].examples.push({
            key: issue.key,
            summary: issue.fields.summary
          });
        }
      }
    });

    // Convert sub-categories to sorted arrays
    Object.keys(requestTypeBreakdown).forEach(requestType => {
      const subCats = requestTypeBreakdown[requestType].subCategories;
      requestTypeBreakdown[requestType].subCategories = Object.entries(subCats)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => ({
          name,
          count: data.count,
          examples: data.examples
        }));
    });

    // Analyze incident and build issue root causes
    const incidentAnalysis = {
      totalIncidents: 0,
      rootCauses: []
    };

    // Filter for incidents, problems, and build issues (from created tickets)
    const criticalIssues = ticketsCreatedInPeriod.filter(issue => {
      const issueType = issue.fields.issuetype?.name || '';
      return issueType === '[System] Incident' ||
             issueType === '[System] Problem' ||
             issueType === 'Build Issue';
    });

    incidentAnalysis.totalIncidents = criticalIssues.length;

    // Define root cause patterns in priority order (most specific first)
    const rootCausePatterns = [
      { name: 'Certificate', pattern: /\b(certificate|ssl|tls|cert|expired)\b/i, tickets: [] },
      { name: 'Database', pattern: /\b(database|sql|db|query|table|bi refresh)\b/i, tickets: [] },
      { name: 'Network', pattern: /\b(network|connectivity|connection|dns)\b/i, tickets: [] },
      { name: 'Performance', pattern: /\b(slow|performance|timeout|hang|latency)\b/i, tickets: [] },
      { name: 'Build Pipeline', pattern: /\b(build|pipeline|compile|nuget|package)\b/i, tickets: [] },
      { name: 'Deployment', pattern: /\b(deploy|deployment|release)\b/i, tickets: [] },
      { name: 'Server/Infrastructure', pattern: /\b(server|infrastructure|vm|memory|disk|cpu)\b/i, tickets: [] },
      { name: 'Application Error', pattern: /\b(crash|error|exception|fail|down)\b/i, tickets: [] }
    ];

    // Analyze each critical issue (assign to first matching category only)
    criticalIssues.forEach(issue => {
      const summary = (issue.fields.summary || '').toLowerCase();
      let description = '';
      if (issue.fields.description) {
        if (typeof issue.fields.description === 'string') {
          description = issue.fields.description.toLowerCase();
        } else if (typeof issue.fields.description === 'object') {
          description = JSON.stringify(issue.fields.description).toLowerCase();
        }
      }
      const fullText = `${summary} ${description}`;

      // Find first matching category (most specific wins)
      for (let i = 0; i < rootCausePatterns.length; i++) {
        if (rootCausePatterns[i].pattern.test(fullText)) {
          rootCausePatterns[i].tickets.push({
            key: issue.key,
            type: issue.fields.issuetype.name,
            summary: issue.fields.summary,
            status: issue.fields.status?.name || 'Unknown',
            priority: issue.fields.priority?.name || 'Unknown'
          });
          break; // Only assign to first matching category
        }
      }
    });

    // Convert to sorted array
    incidentAnalysis.rootCauses = rootCausePatterns
      .map(pattern => ({
        category: pattern.name,
        count: pattern.tickets.length,
        percentage: criticalIssues.length > 0
          ? Math.round((pattern.tickets.length / criticalIssues.length) * 100)
          : 0,
        examples: pattern.tickets.slice(0, 3)
      }))
      .filter(rc => rc.count > 0)
      .sort((a, b) => b.count - a.count);

    res.json({
      totalTickets: ticketsCreatedInPeriod.length,
      totalResolvedInPeriod: totalResolvedInPeriod,
      resolutionRate: resolutionRate,
      avgResolutionTimeHours: avgResolutionTimeHours,
      avgResolutionTimeDays: avgResolutionTimeDays,
      periodDays: days,
      topIssueTypes: sortByCount(issueTypeCounts),
      topRequestTypes: sortByCount(requestTypeCounts),
      topPriorities: sortByCount(priorityCounts),
      topReporters: sortByCount(reporterCounts),
      topAssignees: sortByCount(assigneeCounts),
      topStatuses: sortByCount(statusCounts),
      topApplications: sortByCount(applicationMentions),
      applicationExamples: applicationExamples,
      requestTypeBreakdown: requestTypeBreakdown,
      incidentAnalysis: incidentAnalysis,
      allCounts: {
        issueTypes: issueTypeCounts,
        requestTypes: requestTypeCounts,
        priorities: priorityCounts,
        statuses: statusCounts
      }
    });

  } catch (error) {
    console.error('Error fetching Service Desk analytics:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch Service Desk analytics',
      details: error.response?.data || error.message
    });
  }
});

// Get DevOps analytics combining trends and age data
app.get('/api/devops-analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    console.log(`Fetching DevOps analytics for last ${days} days (since ${dateStr})`);

    // Make parallel requests to get trends and age data
    const trendsPromise = axios.get(`http://localhost:${PORT}/api/service-desk-trends-devops?days=${days}`);
    const agePromise = axios.get(`http://localhost:${PORT}/api/devops-open-tickets-age?days=${days}`);

    // Fetch DevOps team tickets for request type breakdown
    let allIssues = [];
    let nextPageToken = null;

    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" IN (9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND updated >= endOfDay(-${days}) ORDER BY updated DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'issuetype', 'customfield_10010', 'description']
      };

      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await jiraAPI.post('/search/jql', requestBody);
      allIssues = allIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;

      if (response.data.isLast || allIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    console.log(`DevOps Analytics: Collected ${allIssues.length} total tickets`);

    // Define period boundaries
    const periodStartDate = new Date(dateStr);
    const periodEndDate = new Date();
    periodEndDate.setHours(23, 59, 59, 999);

    // Filter to tickets created in the period
    const ticketsCreatedInPeriod = allIssues.filter(issue => {
      const created = new Date(issue.fields.created);
      return created >= periodStartDate && created <= periodEndDate;
    });

    console.log(`DevOps Analytics: ${ticketsCreatedInPeriod.length} tickets created within the period`);

    // Analyze sub-categories within each top request type
    const requestTypeBreakdown = {};

    // Define keywords for each major request type
    const requestTypeKeywords = {
      'Access request': [
        { pattern: /\b(github|git)\b/i, label: 'GitHub/Git' },
        { pattern: /\bazure\b/i, label: 'Azure' },
        { pattern: /\b(vpn|watchguard)\b/i, label: 'VPN' },
        { pattern: /\b(sql|database)\b/i, label: 'SQL/Database' },
        { pattern: /\bjira\b/i, label: 'Jira' },
        { pattern: /\b(active directory|ad group)\b/i, label: 'Active Directory' },
        { pattern: /\b(sharepoint|confluence)\b/i, label: 'SharePoint/Confluence' },
        { pattern: /\b(claude|ai|copilot)\b/i, label: 'AI Tools' },
        { pattern: /\b(office 365|teams|outlook)\b/i, label: 'Office 365' },
        { pattern: /\b(license|subscription)\b/i, label: 'Licenses' }
      ],
      'Build or Deployment Issues': [
        { pattern: /\b(production|prod)\b/i, label: 'Production Issues' },
        { pattern: /\b(sandbox|test|dev)\b/i, label: 'Sandbox/Test Env' },
        { pattern: /\b(deployment|deploy)\b/i, label: 'Deployment' },
        { pattern: /\b(build|pipeline)\b/i, label: 'Build Pipeline' },
        { pattern: /\b(database|sql|bi refresh)\b/i, label: 'Database/BI' },
        { pattern: /\b(certificate|ssl|tls)\b/i, label: 'Certificates' },
        { pattern: /\b(infrastructure|server)\b/i, label: 'Infrastructure' },
        { pattern: /\b(package|dependency|npm)\b/i, label: 'Dependencies' }
      ],
      'General IT Help': [
        { pattern: /\b(install|installation)\b/i, label: 'Software Install' },
        { pattern: /\b(license|subscription|renewal)\b/i, label: 'Licensing' },
        { pattern: /\b(teams|channel)\b/i, label: 'MS Teams' },
        { pattern: /\b(office|excel|word|powerpoint|project)\b/i, label: 'Office Apps' },
        { pattern: /\bjira\b/i, label: 'Jira Config' },
        { pattern: /\b(sharepoint|onedrive)\b/i, label: 'SharePoint/OneDrive' },
        { pattern: /\b(laptop|hardware|device)\b/i, label: 'Hardware' },
        { pattern: /\b(email|outlook|inbox)\b/i, label: 'Email' },
        { pattern: /\b(power bi|power automate|power platform)\b/i, label: 'Power Platform' },
        { pattern: /\b(account|password|login)\b/i, label: 'Account Issues' }
      ],
      'New software': [
        { pattern: /\b(visual studio|vs code|ide)\b/i, label: 'Development Tools' },
        { pattern: /\b(office|excel|word|project)\b/i, label: 'Office Suite' },
        { pattern: /\b(power bi|power automate|power platform)\b/i, label: 'Power Platform' },
        { pattern: /\b(adobe|design|creative)\b/i, label: 'Adobe/Design Tools' },
        { pattern: /\b(license|subscription)\b/i, label: 'Licenses' }
      ],
      'Server or infrastructure request': [
        { pattern: /\b(azure|cloud)\b/i, label: 'Azure/Cloud' },
        { pattern: /\b(database|sql)\b/i, label: 'Database' },
        { pattern: /\b(certificate|ssl)\b/i, label: 'Certificates' },
        { pattern: /\b(vm|virtual machine)\b/i, label: 'Virtual Machines' },
        { pattern: /\b(storage|disk)\b/i, label: 'Storage' }
      ]
    };

    // Group tickets by request type and analyze
    ticketsCreatedInPeriod.forEach(issue => {
      const requestType = issue.fields.customfield_10010?.requestType?.name;
      if (!requestType || !requestTypeKeywords[requestType]) return;

      if (!requestTypeBreakdown[requestType]) {
        requestTypeBreakdown[requestType] = {
          total: 0,
          subCategories: {}
        };
      }

      requestTypeBreakdown[requestType].total++;

      const summary = (issue.fields.summary || '').toLowerCase();
      let description = '';
      if (issue.fields.description) {
        if (typeof issue.fields.description === 'string') {
          description = issue.fields.description.toLowerCase();
        } else if (typeof issue.fields.description === 'object' && issue.fields.description.content) {
          description = JSON.stringify(issue.fields.description).toLowerCase();
        }
      }
      const fullText = `${summary} ${description}`;

      // Check for keyword matches
      let matched = false;
      requestTypeKeywords[requestType].forEach(({ pattern, label }) => {
        if (pattern.test(fullText)) {
          if (!requestTypeBreakdown[requestType].subCategories[label]) {
            requestTypeBreakdown[requestType].subCategories[label] = {
              count: 0,
              examples: []
            };
          }
          requestTypeBreakdown[requestType].subCategories[label].count++;

          // Store up to 2 examples
          if (requestTypeBreakdown[requestType].subCategories[label].examples.length < 2) {
            requestTypeBreakdown[requestType].subCategories[label].examples.push({
              key: issue.key,
              summary: issue.fields.summary
            });
          }
          matched = true;
        }
      });

      // If no match, categorize as "Other"
      if (!matched) {
        if (!requestTypeBreakdown[requestType].subCategories['Other']) {
          requestTypeBreakdown[requestType].subCategories['Other'] = {
            count: 0,
            examples: []
          };
        }
        requestTypeBreakdown[requestType].subCategories['Other'].count++;
        if (requestTypeBreakdown[requestType].subCategories['Other'].examples.length < 2) {
          requestTypeBreakdown[requestType].subCategories['Other'].examples.push({
            key: issue.key,
            summary: issue.fields.summary
          });
        }
      }
    });

    // Convert sub-categories to sorted arrays
    Object.keys(requestTypeBreakdown).forEach(requestType => {
      const subCats = requestTypeBreakdown[requestType].subCategories;
      requestTypeBreakdown[requestType].subCategories = Object.entries(subCats)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => ({
          name,
          count: data.count,
          examples: data.examples
        }));
    });

    const [trendsResponse, ageResponse] = await Promise.all([trendsPromise, agePromise]);

    res.json({
      trends: trendsResponse.data,
      ageData: ageResponse.data,
      requestTypeBreakdown: requestTypeBreakdown
    });

  } catch (error) {
    console.error('Error fetching DevOps analytics:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch DevOps analytics',
      details: error.response?.data || error.message
    });
  }
});

// Capacity Planning endpoint
app.get('/api/capacity-planning', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const date = new Date();
    date.setDate(date.getDate() - days);
    const dateStr = date.toISOString().split('T')[0];

    // Base JQL for capacity planning - aligned with dashboard filters
    const baseJQL = '(Project IN (DEVOPS, TechOps, "Technology Group", "Technology Roadmap") OR (Project = DTI AND "Team[Team]" IN (01c3b859-1307-41e3-8a88-24c701dd1713, 9888ca76-8551-47b3-813f-4bf5df9e9762, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3, a092fa48-f541-4358-90b8-ba6caccceb72)))';

    // Fetch open tickets for current workload with pagination
    const openTicketsJQL = `${baseJQL} AND statusCategory NOT IN (Done) ORDER BY created DESC`;
    let openIssues = [];
    let nextPageToken = null;
    do {
      const requestBody = {
        jql: openTicketsJQL,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'created', 'updated', 'issuetype', 'priority', 'resolutiondate', 'timeoriginalestimate', 'project', 'parent', 'issuelinks']
      };
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      const response = await jiraAPI.post('/search/jql', requestBody);
      openIssues = openIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;
      console.log(`Fetched ${response.data.issues?.length || 0} open tickets, total so far: ${openIssues.length}, isLast: ${response.data.isLast}`);
      if (response.data.isLast || openIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    // Fetch recently created tickets with pagination
    const recentTicketsJQL = `${baseJQL} AND created >= "${dateStr}" ORDER BY created DESC`;
    let recentIssues = [];
    nextPageToken = null;
    do {
      const requestBody = {
        jql: recentTicketsJQL,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'created', 'updated', 'issuetype', 'priority', 'resolutiondate', 'timeoriginalestimate', 'project']
      };
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      const response = await jiraAPI.post('/search/jql', requestBody);
      recentIssues = recentIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;
      if (response.data.isLast || recentIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    // Fetch recently resolved tickets with pagination
    const resolvedTicketsJQL = `${baseJQL} AND statusCategory IN (Done) AND resolutiondate >= "${dateStr}" ORDER BY resolutiondate DESC`;
    let resolvedIssues = [];
    nextPageToken = null;
    do {
      const requestBody = {
        jql: resolvedTicketsJQL,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'created', 'updated', 'issuetype', 'priority', 'resolutiondate', 'timeoriginalestimate', 'project']
      };
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      const response = await jiraAPI.post('/search/jql', requestBody);
      resolvedIssues = resolvedIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;
      if (response.data.isLast || resolvedIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    // Fetch Discovery Ideas from Technology Roadmap
    // Try fetching all TR issues first to debug
    const discoveryIdeasJQL = 'Project = TR ORDER BY created DESC';
    let discoveryIdeas = [];
    nextPageToken = null;
    try {
      do {
        const requestBody = {
          jql: discoveryIdeasJQL,
          maxResults: 50,
          fields: ['summary', 'status', 'created', 'updated', 'issuetype', 'project', 'issuelinks']
        };
        if (nextPageToken) {
          requestBody.nextPageToken = nextPageToken;
        }
        const response = await jiraAPI.post('/search/jql', requestBody);
        discoveryIdeas = discoveryIdeas.concat(response.data.issues || []);
        nextPageToken = response.data.nextPageToken;
        if (response.data.isLast || discoveryIdeas.length >= 200) {
          break;
        }
      } while (nextPageToken);

      console.log(`TR Query returned ${discoveryIdeas.length} items`);
      if (discoveryIdeas.length > 0) {
        // Log the issue types we're seeing
        const issueTypes = discoveryIdeas.map(i => i.fields.issuetype?.name).filter((v, i, a) => a.indexOf(v) === i);
        console.log(`TR Issue types found: ${issueTypes.join(', ')}`);
        // Log first few items as examples
        console.log('First 3 TR items:', discoveryIdeas.slice(0, 3).map(i => ({
          key: i.key,
          type: i.fields.issuetype?.name,
          summary: i.fields.summary
        })));
      }
    } catch (err) {
      console.error('Error fetching TR items:', err.message);
      discoveryIdeas = [];
    }

    console.log(`Capacity Planning: Collected ${openIssues.length} open tickets, ${recentIssues.length} recent tickets, ${resolvedIssues.length} resolved tickets, ${discoveryIdeas.length} discovery ideas`);

    // Helper function to calculate default estimate
    const getDefaultEstimate = (issue) => {
      // Check if original estimate exists
      if (issue.fields.timeoriginalestimate) {
        return 0; // No default needed
      }

      // Check if item qualifies for default estimate
      const projectKey = issue.fields.project?.key;
      const issueTypeName = issue.fields.issuetype?.name;
      const statusCategory = issue.fields.status?.statusCategory?.name;

      // Apply to DTI project items or User Stories/Tasks in other projects
      const qualifies = projectKey === 'DTI' ||
                       issueTypeName === 'Story' ||
                       issueTypeName === 'Task';

      if (!qualifies) {
        return 0;
      }

      // Determine default hours based on status
      if (statusCategory === 'To Do') {
        return 4 * 3600; // 4 hours in seconds
      } else if (statusCategory === 'In Progress') {
        return 2 * 3600; // 2 hours in seconds
      } else {
        return 0; // Done or other status
      }
    };

    // Calculate assignee workload
    const assigneeWorkload = {};
    openIssues.forEach(issue => {
      const assignee = issue.fields.assignee?.displayName || 'Unassigned';
      if (!assigneeWorkload[assignee]) {
        assigneeWorkload[assignee] = {
          openTickets: 0,
          byPriority: {},
          oldestTicket: null,
          avgAge: 0,
          tickets: [],
          estimateSeconds: 0,
          defaultSeconds: 0,
          ticketsWithEstimate: 0,
          ticketsWithDefault: 0
        };
      }
      assigneeWorkload[assignee].openTickets++;

      const priority = issue.fields.priority?.name || 'None';
      assigneeWorkload[assignee].byPriority[priority] = (assigneeWorkload[assignee].byPriority[priority] || 0) + 1;

      const ticketAge = Math.floor((new Date() - new Date(issue.fields.created)) / (1000 * 60 * 60 * 24));
      assigneeWorkload[assignee].tickets.push(ticketAge);

      if (!assigneeWorkload[assignee].oldestTicket || ticketAge > assigneeWorkload[assignee].oldestTicket) {
        assigneeWorkload[assignee].oldestTicket = ticketAge;
      }

      // Track original estimates and defaults
      if (issue.fields.timeoriginalestimate) {
        assigneeWorkload[assignee].estimateSeconds += issue.fields.timeoriginalestimate;
        assigneeWorkload[assignee].ticketsWithEstimate++;
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          assigneeWorkload[assignee].defaultSeconds += defaultEst;
          assigneeWorkload[assignee].ticketsWithDefault++;
        }
      }
    });

    // Calculate average age and convert estimates to hours for each assignee
    Object.keys(assigneeWorkload).forEach(assignee => {
      const ages = assigneeWorkload[assignee].tickets;
      if (ages.length > 0) {
        assigneeWorkload[assignee].avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
      }
      delete assigneeWorkload[assignee].tickets; // Remove the raw data

      // Convert estimates from seconds to hours
      assigneeWorkload[assignee].estimateHours = Math.round(assigneeWorkload[assignee].estimateSeconds / 3600);
      assigneeWorkload[assignee].defaultHours = Math.round(assigneeWorkload[assignee].defaultSeconds / 3600);
      assigneeWorkload[assignee].totalHours = assigneeWorkload[assignee].estimateHours + assigneeWorkload[assignee].defaultHours;

      delete assigneeWorkload[assignee].estimateSeconds; // Remove seconds, keep hours
      delete assigneeWorkload[assignee].defaultSeconds;
    });

    // Calculate resolution metrics
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    resolvedIssues.forEach(issue => {
      if (issue.fields.created && issue.fields.resolutiondate) {
        const created = new Date(issue.fields.created);
        const resolved = new Date(issue.fields.resolutiondate);
        const resolutionTime = Math.floor((resolved - created) / (1000 * 60 * 60 * 24));
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    });

    const avgResolutionTime = resolutionCount > 0 ? Math.round(totalResolutionTime / resolutionCount) : 0;

    // Calculate ticket flow by day
    const ticketFlow = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      ticketFlow[dateKey] = { created: 0, resolved: 0 };
    }

    recentIssues.forEach(issue => {
      const createdDate = issue.fields.created.split('T')[0];
      if (ticketFlow[createdDate]) {
        ticketFlow[createdDate].created++;
      }
    });

    resolvedIssues.forEach(issue => {
      if (issue.fields.resolutiondate) {
        const resolvedDate = issue.fields.resolutiondate.split('T')[0];
        if (ticketFlow[resolvedDate]) {
          ticketFlow[resolvedDate].resolved++;
        }
      }
    });

    // Convert to array and sort by date
    const flowData = Object.entries(ticketFlow)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate team velocity (tickets resolved per week)
    const weeksInPeriod = Math.ceil(days / 7);
    const velocity = weeksInPeriod > 0 ? Math.round(resolvedIssues.length / weeksInPeriod) : 0;

    // Calculate original estimates and default estimates (in seconds, convert to hours)
    let totalOpenEstimate = 0;
    let totalOpenDefault = 0;
    let openTicketsWithEstimate = 0;
    let openTicketsWithDefault = 0;

    let totalCreatedEstimate = 0;
    let totalCreatedDefault = 0;
    let createdTicketsWithEstimate = 0;
    let createdTicketsWithDefault = 0;

    let totalResolvedEstimate = 0;
    let totalResolvedDefault = 0;
    let resolvedTicketsWithEstimate = 0;
    let resolvedTicketsWithDefault = 0;

    openIssues.forEach(issue => {
      if (issue.fields.timeoriginalestimate) {
        totalOpenEstimate += issue.fields.timeoriginalestimate;
        openTicketsWithEstimate++;
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          totalOpenDefault += defaultEst;
          openTicketsWithDefault++;
        }
      }
    });

    recentIssues.forEach(issue => {
      if (issue.fields.timeoriginalestimate) {
        totalCreatedEstimate += issue.fields.timeoriginalestimate;
        createdTicketsWithEstimate++;
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          totalCreatedDefault += defaultEst;
          createdTicketsWithDefault++;
        }
      }
    });

    resolvedIssues.forEach(issue => {
      if (issue.fields.timeoriginalestimate) {
        totalResolvedEstimate += issue.fields.timeoriginalestimate;
        resolvedTicketsWithEstimate++;
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          totalResolvedDefault += defaultEst;
          resolvedTicketsWithDefault++;
        }
      }
    });

    // Convert from seconds to hours
    const openEstimateHours = Math.round(totalOpenEstimate / 3600);
    const openDefaultHours = Math.round(totalOpenDefault / 3600);
    const openTotalHours = openEstimateHours + openDefaultHours;

    const createdEstimateHours = Math.round(totalCreatedEstimate / 3600);
    const createdDefaultHours = Math.round(totalCreatedDefault / 3600);
    const createdTotalHours = createdEstimateHours + createdDefaultHours;

    const resolvedEstimateHours = Math.round(totalResolvedEstimate / 3600);
    const resolvedDefaultHours = Math.round(totalResolvedDefault / 3600);
    const resolvedTotalHours = resolvedEstimateHours + resolvedDefaultHours;

    // Sort assignees by workload (total hours including defaults, then by open tickets)
    const sortedAssignees = Object.entries(assigneeWorkload)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => {
        // Sort by total hours first, then by ticket count
        if (b.totalHours !== a.totalHours) {
          return b.totalHours - a.totalHours;
        }
        return b.openTickets - a.openTickets;
      });

    // Helper function to find Discovery Idea from issue links
    const findDiscoveryIdea = (issue) => {
      if (!issue.fields.issuelinks || issue.fields.issuelinks.length === 0) {
        return null;
      }

      for (const link of issue.fields.issuelinks) {
        // Check if the linked issue is an Idea or Initiative from TR project (inward or outward link)
        const linkedIssue = link.inwardIssue || link.outwardIssue;
        if (linkedIssue) {
          const issueType = linkedIssue.fields?.issuetype?.name;
          const projectKey = linkedIssue.key?.split('-')[0];
          if (projectKey === 'TR' && (issueType === 'Idea' || issueType === 'Initiative')) {
            return {
              key: linkedIssue.key,
              summary: linkedIssue.fields.summary
            };
          }
        }
      }
      return null;
    };

    // First pass: Collect all unique Epic keys and fetch their details including issuelinks
    const epicKeys = new Set();
    openIssues.forEach(issue => {
      if (issue.fields.parent?.key) {
        epicKeys.add(issue.fields.parent.key);
      }
    });

    // Fetch Epic details with issuelinks
    const epics = [];
    if (epicKeys.size > 0) {
      const epicKeysArray = Array.from(epicKeys);
      // Batch fetch epics (max 100 per request)
      for (let i = 0; i < epicKeysArray.length; i += 100) {
        const batch = epicKeysArray.slice(i, i + 100);
        const epicJQL = `key IN (${batch.join(',')})`;
        try {
          const epicResponse = await jiraAPI.post('/search/jql', {
            jql: epicJQL,
            maxResults: 100,
            fields: ['summary', 'issuetype', 'issuelinks']
          });
          epics.push(...(epicResponse.data.issues || []));
        } catch (err) {
          console.error('Error fetching epic details:', err.message);
        }
      }
    }

    // Map Epics to Discovery Ideas based on:
    // 1. Epic's own direct links to TR items
    // 2. Child tickets' links to TR items
    const epicToDiscoveryIdea = {};

    // Check Epic's own links first
    epics.forEach(epic => {
      const discoveryIdea = findDiscoveryIdea(epic);
      if (discoveryIdea) {
        epicToDiscoveryIdea[epic.key] = discoveryIdea;
      }
    });

    // Then check child tickets' links (only if Epic doesn't already have a mapping)
    openIssues.forEach(issue => {
      const parentEpic = issue.fields.parent?.key;
      if (parentEpic && !epicToDiscoveryIdea[parentEpic]) {
        const discoveryIdea = findDiscoveryIdea(issue);
        if (discoveryIdea) {
          epicToDiscoveryIdea[parentEpic] = discoveryIdea;
        }
      }
    });

    // Group work hierarchically: Discovery Idea > DTI Requests > Epic/Project
    const parentGrouping = {};
    openIssues.forEach(issue => {
      const projectKey = issue.fields.project?.key;
      const issueTypeName = issue.fields.issuetype?.name;
      let groupKey, groupName, groupType, parentGroup;

      // Check if this ticket has a parent Epic
      const parentEpic = issue.fields.parent?.key;

      // If the parent Epic is linked to a Discovery Idea, group Epic under that Discovery Idea
      if (parentEpic && epicToDiscoveryIdea[parentEpic]) {
        groupKey = parentEpic;
        groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
        groupType = 'Epic';
        parentGroup = `${epicToDiscoveryIdea[parentEpic].key}: ${epicToDiscoveryIdea[parentEpic].summary}`;
      }
      // Check for direct Discovery Idea link on the ticket itself
      else {
        const discoveryIdea = findDiscoveryIdea(issue);
        if (discoveryIdea) {
          // If this issue has an Epic parent, group the Epic under the Discovery Idea
          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = `${discoveryIdea.key}: ${discoveryIdea.summary}`;
          }
          // If no Epic parent, group the issue itself under the Discovery Idea
          else {
            groupKey = issue.key;
            groupName = `${issue.key}: ${issue.fields.summary}`;
            groupType = issueTypeName;
            parentGroup = `${discoveryIdea.key}: ${discoveryIdea.summary}`;
          }
        }
        // For DTI project items, group under "DTI Requests"
        else if (projectKey === 'DTI') {
          // If has Epic parent, use Epic but group under DTI Requests
          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = 'DTI Requests';
          } else {
            groupKey = `DTI-${issueTypeName}`;
            groupName = `DTI: ${issueTypeName}`;
            groupType = 'Issue Type';
            parentGroup = 'DTI Requests';
          }
        }
        // If issue has a parent (Epic), use that and group under project
        else if (issue.fields.parent) {
          groupKey = issue.fields.parent.key;
          groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
          groupType = 'Epic';
          // Group Epic under its project
          const projectName = issue.fields.project?.name || projectKey;
          parentGroup = `${projectKey}: ${projectName}`;
        }
        // For other projects without parent, group by issue type
        else {
          groupKey = `${projectKey}-${issueTypeName}`;
          groupName = `${projectKey}: ${issueTypeName}`;
          groupType = 'Issue Type';
          parentGroup = null;
        }
      }

      if (!parentGrouping[groupKey]) {
        parentGrouping[groupKey] = {
          name: groupName,
          type: groupType,
          parentGroup: parentGroup,
          tickets: 0,
          estimateHours: 0,
          defaultHours: 0,
          totalHours: 0
        };
      }

      parentGrouping[groupKey].tickets++;

      // Calculate estimates
      if (issue.fields.timeoriginalestimate) {
        parentGrouping[groupKey].estimateHours += Math.round(issue.fields.timeoriginalestimate / 3600);
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          parentGrouping[groupKey].defaultHours += Math.round(defaultEst / 3600);
        }
      }
      parentGrouping[groupKey].totalHours = parentGrouping[groupKey].estimateHours + parentGrouping[groupKey].defaultHours;
    });

    // Create hierarchical structure
    const hierarchicalGroups = [];
    const groupsByParent = {};

    // First pass: organize by parent group
    Object.entries(parentGrouping).forEach(([key, data]) => {
      if (data.parentGroup) {
        if (!groupsByParent[data.parentGroup]) {
          groupsByParent[data.parentGroup] = [];
        }
        groupsByParent[data.parentGroup].push({ key, ...data });
      } else {
        hierarchicalGroups.push({ key, ...data, children: [] });
      }
    });

    // Second pass: add children to parent groups
    Object.entries(groupsByParent).forEach(([parentName, children]) => {
      // Sort children by total hours
      children.sort((a, b) => b.totalHours - a.totalHours);

      // Calculate totals for parent group
      const parentTotals = children.reduce((acc, child) => ({
        tickets: acc.tickets + child.tickets,
        estimateHours: acc.estimateHours + child.estimateHours,
        defaultHours: acc.defaultHours + child.defaultHours,
        totalHours: acc.totalHours + child.totalHours
      }), { tickets: 0, estimateHours: 0, defaultHours: 0, totalHours: 0 });

      hierarchicalGroups.push({
        key: parentName,
        name: parentName,
        type: 'Project Group',
        ...parentTotals,
        children: children
      });
    });

    // Third pass: add Discovery Ideas from Technology Roadmap and update their type
    // These should appear as parent groups even if they don't have linked work items
    discoveryIdeas.forEach(idea => {
      const ideaKey = idea.key;
      const ideaName = `${idea.key}: ${idea.fields.summary}`;
      const ideaType = 'Initiative';

      // Check if this Discovery Idea already exists (has children)
      const existingGroup = hierarchicalGroups.find(g => g.name === ideaName || g.key === ideaKey);
      if (existingGroup) {
        // Update the type to Initiative if it already exists
        existingGroup.type = ideaType;
      } else {
        // Add as a new parent group with no children
        hierarchicalGroups.push({
          key: ideaKey,
          name: ideaName,
          type: ideaType,
          tickets: 0,
          estimateHours: 0,
          defaultHours: 0,
          totalHours: 0,
          children: []
        });
      }
    });

    // Filter out "Issue Type" groups
    const filteredGroups = hierarchicalGroups.filter(group => group.type !== 'Issue Type');

    // Categorize groups into three sections
    const bauGroups = filteredGroups.filter(group =>
      group.name === 'DTI Requests' || group.key === 'DTI Requests'
    ).sort((a, b) => b.totalHours - a.totalHours);

    // Helper function to check if a group or its children are Initiatives
    const isInitiativeRelated = (group) => {
      // Check if group itself is an Initiative
      if (group.type === 'Initiative') return true;
      // Check if any children are Initiatives
      if (group.children && group.children.length > 0) {
        return group.children.some(child => child.type === 'Initiative');
      }
      return false;
    };

    const improveGroups = filteredGroups.filter(group =>
      isInitiativeRelated(group)
    ).sort((a, b) => b.totalHours - a.totalHours);

    const deliverGroups = filteredGroups.filter(group => {
      // Everything that's not BAU or Improve goes into Deliver
      const isBau = group.name === 'DTI Requests' || group.key === 'DTI Requests';
      const isImprove = isInitiativeRelated(group);
      return !isBau && !isImprove;
    }).sort((a, b) => b.totalHours - a.totalHours);

    res.json({
      summary: {
        totalOpenTickets: openIssues.length,
        ticketsCreated: recentIssues.length,
        ticketsResolved: resolvedIssues.length,
        avgResolutionTime: avgResolutionTime,
        velocity: velocity,
        period: days,
        openEstimateHours: openEstimateHours,
        openDefaultHours: openDefaultHours,
        openTotalHours: openTotalHours,
        openTicketsWithEstimate: openTicketsWithEstimate,
        openTicketsWithDefault: openTicketsWithDefault,
        createdEstimateHours: createdEstimateHours,
        createdDefaultHours: createdDefaultHours,
        createdTotalHours: createdTotalHours,
        createdTicketsWithEstimate: createdTicketsWithEstimate,
        createdTicketsWithDefault: createdTicketsWithDefault,
        resolvedEstimateHours: resolvedEstimateHours,
        resolvedDefaultHours: resolvedDefaultHours,
        resolvedTotalHours: resolvedTotalHours,
        resolvedTicketsWithEstimate: resolvedTicketsWithEstimate,
        resolvedTicketsWithDefault: resolvedTicketsWithDefault
      },
      assigneeWorkload: sortedAssignees,
      ticketFlow: flowData,
      parentGrouping: {
        bau: bauGroups,
        deliver: deliverGroups,
        improve: improveGroups
      }
    });

  } catch (error) {
    console.error('Error fetching capacity planning data:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch capacity planning data',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Jira Dashboard API running on http://localhost:${PORT}`);
  console.log(`Connecting to Jira: ${process.env.JIRA_URL}`);
});
