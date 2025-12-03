import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import IssueStatistics from './components/IssueStatistics';
import TeamPerformance from './components/TeamPerformance';
import ProjectOverview from './components/ProjectOverview';
import InitiativeProgress from './components/InitiativeProgress';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [projects, setProjects] = useState(null);
  const [initiatives, setInitiatives] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, perfRes, projRes, initRes] = await Promise.all([
        axios.get('/api/statistics'),
        axios.get('/api/performance?days=30'),
        axios.get('/api/overview'),
        axios.get('/api/initiatives')
      ]);

      setStatistics(statsRes.data);
      setPerformance(perfRes.data);
      setProjects(projRes.data);
      setInitiatives(initRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data from Jira');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Jira data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Jira Dashboard</h1>
        <button className="refresh-btn" onClick={fetchData}>
          Refresh Data
        </button>
      </header>

      <main className="dashboard-container">
        <section className="dashboard-section">
          <ProjectOverview projects={projects} />
        </section>

        <section className="dashboard-section">
          <IssueStatistics statistics={statistics} />
        </section>

        <section className="dashboard-section">
          <TeamPerformance performance={performance} />
        </section>

        <section className="dashboard-section">
          <InitiativeProgress initiatives={initiatives} />
        </section>
      </main>
    </div>
  );
}

export default App;
