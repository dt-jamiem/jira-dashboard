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

    // Fetch ALL DTI tickets (including older ones that might still be open)
    // We need all tickets to accurately calculate open ticket counts at any point in time
    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" In (9b7aba3a-a76b-46b8-8a3b-658baad7c1a3, a092fa48-f541-4358-90b8-ba6caccceb72, 9888ca76-8551-47b3-813f-4bf5df9e9762) AND (created >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'priority', 'issuetype']
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

    allIssues.forEach(issue => {
      const created = new Date(issue.fields.created);
      const dateKey = created.toISOString().split('T')[0];

      // Count created tickets by date
      ticketsByDate[dateKey] = (ticketsByDate[dateKey] || 0) + 1;

      // Count resolved tickets by date and calculate resolution time
      if (issue.fields.resolutiondate) {
        const resolved = new Date(issue.fields.resolutiondate);
        const resolvedDateKey = resolved.toISOString().split('T')[0];
        resolvedByDate[resolvedDateKey] = (resolvedByDate[resolvedDateKey] || 0) + 1;

        // Calculate resolution time in hours
        const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60);
        resolutionTimes.push(resolutionTimeHours);
      }
    });

    // Calculate average resolution time
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Generate date range for the trend window
    const trendStartDate = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const volumeData = [];
    const currentDate = new Date(trendStartDate);

    while (currentDate <= today) {
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
        totalResolved: resolutionTimes.length,
        totalCreated: allIssues.length,
        resolutionRate: allIssues.length > 0
          ? Math.round((resolutionTimes.length / allIssues.length) * 100)
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

// Get DevOps-specific service desk trends
app.get('/api/service-desk-trends-devops', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    let allIssues = [];
    let nextPageToken = null;

    // Fetch ALL DevOps team tickets (including older ones that might still be open)
    // We need all tickets to accurately calculate open ticket counts at any point in time
    do {
      const requestBody = {
        jql: `Project = DTI AND "Team[Team]" In (9b7aba3a-a76b-46b8-8a3b-658baad7c1a3) AND (created >= "${dateStr}" OR statusCategory != Done) ORDER BY created DESC`,
        fields: ['summary', 'status', 'created', 'resolutiondate', 'priority', 'issuetype']
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

    allIssues.forEach(issue => {
      const created = new Date(issue.fields.created);
      const dateKey = created.toISOString().split('T')[0];

      // Count created tickets by date
      ticketsByDate[dateKey] = (ticketsByDate[dateKey] || 0) + 1;

      // Count resolved tickets by date and calculate resolution time
      if (issue.fields.resolutiondate) {
        const resolved = new Date(issue.fields.resolutiondate);
        const resolvedDateKey = resolved.toISOString().split('T')[0];
        resolvedByDate[resolvedDateKey] = (resolvedByDate[resolvedDateKey] || 0) + 1;

        // Calculate resolution time in hours
        const resolutionTimeHours = (resolved - created) / (1000 * 60 * 60);
        resolutionTimes.push(resolutionTimeHours);
      }
    });

    // Calculate average resolution time
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Generate date range for the trend window
    const trendStartDate = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const volumeData = [];
    const currentDate = new Date(trendStartDate);

    while (currentDate <= today) {
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
        totalResolved: resolutionTimes.length,
        totalCreated: allIssues.length,
        resolutionRate: allIssues.length > 0
          ? Math.round((resolutionTimes.length / allIssues.length) * 100)
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

app.listen(PORT, () => {
  console.log(`Jira Dashboard API running on http://localhost:${PORT}`);
  console.log(`Connecting to Jira: ${process.env.JIRA_URL}`);
});
