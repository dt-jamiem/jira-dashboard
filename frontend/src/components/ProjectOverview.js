import React from 'react';
import './ProjectOverview.css';

function ProjectOverview({ projects }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="project-overview">
        <h2>Project Overview</h2>
        <p>No projects found</p>
      </div>
    );
  }

  return (
    <div className="project-overview">
      <h2>Project Overview</h2>
      <div className="projects-grid">
        {projects.map(project => (
          <div key={project.key} className="project-card">
            <div className="project-header">
              {project.avatarUrls && (
                <img
                  src={project.avatarUrls['48x48']}
                  alt={project.name}
                  className="project-avatar"
                />
              )}
              <div className="project-info">
                <h3>{project.name}</h3>
                <span className="project-key">{project.key}</span>
              </div>
            </div>
            <div className="project-stats">
              <div className="stat">
                <span className="stat-label">Total Issues</span>
                <span className="stat-value">{project.totalIssues}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Lead</span>
                <span className="stat-value">{project.lead}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectOverview;
