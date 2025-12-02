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

app.listen(PORT, () => {
  console.log(`Jira Dashboard API running on http://localhost:${PORT}`);
  console.log(`Connecting to Jira: ${process.env.JIRA_URL}`);
});
