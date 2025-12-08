import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import TeamPerformance from './components/TeamPerformance';
import ProjectOverview from './components/ProjectOverview';
import ServiceDeskMetrics from './components/ServiceDeskMetrics';
import TechnologyInitiatives from './components/TechnologyInitiatives';
import ServiceDeskTrends from './components/ServiceDeskTrends';
import DevOpsServiceDesk from './components/DevOpsServiceDesk';
import DevOpsOpenTicketsAge from './components/DevOpsOpenTicketsAge';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [projects, setProjects] = useState(null);
  const [technologyInitiatives, setTechnologyInitiatives] = useState(null);
  const [serviceDeskTrends, setServiceDeskTrends] = useState(null);
  const [devopsServiceDesk, setDevopsServiceDesk] = useState(null);
  const [devopsOpenTicketsAge, setDevopsOpenTicketsAge] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [perfRes, projRes, techInitRes, serviceDeskRes, devopsRes, ageRes] = await Promise.all([
        axios.get('/api/performance?days=30'),
        axios.get('/api/overview'),
        axios.get('/api/technology-initiatives'),
        axios.get('/api/service-desk-trends?days=30'),
        axios.get('/api/service-desk-trends-devops?days=30'),
        axios.get('/api/devops-open-tickets-age?days=30')
      ]);

      setPerformance(perfRes.data);
      setProjects(projRes.data);
      setTechnologyInitiatives(techInitRes.data);
      setServiceDeskTrends(serviceDeskRes.data);
      setDevopsServiceDesk(devopsRes.data);
      setDevopsOpenTicketsAge(ageRes.data);
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
        <h1>
          <img src="/datatorque-logo.png" alt="DataTorque" className="logo-image" />
          Jira Dashboard
        </h1>
        <button className="refresh-btn" onClick={fetchData}>
          Refresh Data
        </button>
      </header>

      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'initiatives' ? 'active' : ''}`}
          onClick={() => setActiveTab('initiatives')}
        >
          Initiatives
        </button>
        <button
          className={`tab-btn ${activeTab === 'servicedesk' ? 'active' : ''}`}
          onClick={() => setActiveTab('servicedesk')}
        >
          Service Desk
        </button>
      </nav>

      <main className="dashboard-container">
        {activeTab === 'overview' && (
          <>
            <section className="dashboard-section">
              <ProjectOverview projects={projects} />
            </section>

            <section className="dashboard-section">
              <ServiceDeskMetrics
                combinedTrends={serviceDeskTrends}
                devopsTrends={devopsServiceDesk}
              />
            </section>

            <section className="dashboard-section">
              <TeamPerformance performance={performance} />
            </section>
          </>
        )}

        {activeTab === 'initiatives' && (
          <section className="dashboard-section">
            <TechnologyInitiatives initiatives={technologyInitiatives} />
          </section>
        )}

        {activeTab === 'servicedesk' && (
          <>
            <section className="dashboard-section">
              <ServiceDeskTrends trends={serviceDeskTrends} />
            </section>

            <section className="dashboard-section">
              <DevOpsServiceDesk trends={devopsServiceDesk} />
            </section>

            <section className="dashboard-section">
              <DevOpsOpenTicketsAge ageData={devopsOpenTicketsAge} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
