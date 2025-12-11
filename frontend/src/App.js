import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ServiceDeskTrends from './components/ServiceDeskTrends';
import DevOpsServiceDesk from './components/DevOpsServiceDesk';
import DevOpsOpenTicketsAge from './components/DevOpsOpenTicketsAge';
import ServiceDeskAnalytics from './components/ServiceDeskAnalytics';
import DevOpsAnalytics from './components/DevOpsAnalytics';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceDeskTrends, setServiceDeskTrends] = useState(null);
  const [devopsServiceDesk, setDevopsServiceDesk] = useState(null);
  const [devopsOpenTicketsAge, setDevopsOpenTicketsAge] = useState(null);
  const [serviceDeskAnalytics, setServiceDeskAnalytics] = useState(null);
  const [devopsAnalytics, setDevopsAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('servicedesk');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [serviceDeskRes, devopsRes, ageRes, analyticsRes, devopsAnalyticsRes] = await Promise.all([
        axios.get('/api/service-desk-trends?days=30'),
        axios.get('/api/service-desk-trends-devops?days=30'),
        axios.get('/api/devops-open-tickets-age?days=30'),
        axios.get('/api/service-desk-analytics?days=30'),
        axios.get('/api/devops-analytics?days=30')
      ]);

      setServiceDeskTrends(serviceDeskRes.data);
      setDevopsServiceDesk(devopsRes.data);
      setDevopsOpenTicketsAge(ageRes.data);
      setServiceDeskAnalytics(analyticsRes.data);
      setDevopsAnalytics(devopsAnalyticsRes.data);
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
          Service Desk
        </button>
        <button
          className={`tab-btn ${activeTab === 'devops' ? 'active' : ''}`}
          onClick={() => setActiveTab('devops')}
        >
          DevOps
        </button>
        <button
          className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
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
          <>
            <section className="dashboard-section-half">
              <ServiceDeskTrends trends={serviceDeskTrends} />
            </section>

            <section className="dashboard-section dashboard-section-split">
              <div className="split-container">
                <div className="split-item">
                  <DevOpsServiceDesk trends={devopsServiceDesk} />
                </div>
                <div className="split-item">
                  <DevOpsOpenTicketsAge ageData={devopsOpenTicketsAge} />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
