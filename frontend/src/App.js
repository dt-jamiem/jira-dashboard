import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ServiceDeskTrends from './components/ServiceDeskTrends';
import ServiceDeskAgeTrend from './components/ServiceDeskAgeTrend';
import ServiceDeskAnalytics from './components/ServiceDeskAnalytics';
import DevOpsAnalytics from './components/DevOpsAnalytics';
import DevOpsServiceDesk from './components/DevOpsServiceDesk';
import DevOpsOpenTicketsAge from './components/DevOpsOpenTicketsAge';
import CapacityPlanning from './components/CapacityPlanning';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceDeskTrends, setServiceDeskTrends] = useState(null);
  const [serviceDeskAgeTrend, setServiceDeskAgeTrend] = useState(null);
  const [serviceDeskAnalytics, setServiceDeskAnalytics] = useState(null);
  const [devopsAnalytics, setDevopsAnalytics] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [activeTab, setActiveTab] = useState('servicedesk');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [serviceDeskRes, serviceDeskAgeRes, analyticsRes, devopsAnalyticsRes, capacityRes] = await Promise.all([
        axios.get('/api/service-desk-trends?days=30'),
        axios.get('/api/service-desk-age-trends?days=30'),
        axios.get('/api/service-desk-analytics?days=30'),
        axios.get('/api/devops-analytics?days=30'),
        axios.get('/api/capacity-planning?days=30')
      ]);

      setServiceDeskTrends(serviceDeskRes.data);
      setServiceDeskAgeTrend(serviceDeskAgeRes.data);
      setServiceDeskAnalytics(analyticsRes.data);
      setDevopsAnalytics(devopsAnalyticsRes.data);
      setCapacityData(capacityRes.data);
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
          className={`tab-btn ${activeTab === 'servicedesk' ? 'active' : ''}`}
          onClick={() => setActiveTab('servicedesk')}
        >
          All Technology
        </button>
        <button
          className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Technology Trends
        </button>
        <button
          className={`tab-btn ${activeTab === 'devops' ? 'active' : ''}`}
          onClick={() => setActiveTab('devops')}
        >
          DevOps
        </button>
        <button
          className={`tab-btn ${activeTab === 'devopstrends' ? 'active' : ''}`}
          onClick={() => setActiveTab('devopstrends')}
        >
          DevOps Trends
        </button>
        <button
          className={`tab-btn ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          Capacity Planning
        </button>
      </nav>

      <main className="dashboard-container">
        {activeTab === 'servicedesk' && (
          <section className="dashboard-section">
            <ServiceDeskAnalytics analytics={serviceDeskAnalytics} />
          </section>
        )}

        {activeTab === 'devops' && (
          <section className="dashboard-section">
            <DevOpsAnalytics analytics={devopsAnalytics} />
          </section>
        )}

        {activeTab === 'trends' && (
          <section className="dashboard-section dashboard-section-split">
            <div className="split-container">
              <div className="split-item">
                <ServiceDeskTrends trends={serviceDeskTrends} />
              </div>
              <div className="split-item">
                <ServiceDeskAgeTrend ageData={serviceDeskAgeTrend} />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'devopstrends' && (
          <section className="dashboard-section dashboard-section-split">
            <div className="split-container">
              <div className="split-item">
                <DevOpsServiceDesk trends={devopsAnalytics?.trends} />
              </div>
              <div className="split-item">
                <DevOpsOpenTicketsAge ageData={devopsAnalytics?.ageData} />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'capacity' && (
          <section className="dashboard-section">
            <CapacityPlanning data={capacityData} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
