'use client';

import { useAuth } from '@/context/AuthContext';
import { redirectAfterLogout } from '@/lib/redirect-utils';
import { useState } from 'react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Redirect after logout with a small delay to show the loading state
      setTimeout(() => {
        redirectAfterLogout();
      }, 500);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || user?.email || 'User'}!</span>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="logout-btn"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>User Information</h2>
            <div className="user-details">
              <p><strong>ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Authentication Status</h2>
            <div className="auth-status">
              <p><strong>Status:</strong> <span className="status-authenticated">Authenticated</span></p>
              <p><strong>Session:</strong> Active</p>
              <p><strong>Last Login:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-btn primary">View Profile</button>
              <button className="action-btn secondary">Settings</button>
              <button className="action-btn secondary">Help</button>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">Just now</span>
                <span className="activity-text">Logged into dashboard</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">5 min ago</span>
                <span className="activity-text">Updated profile</span>
              </div>
              <div className="activity-item">
                <span className="activity-time">1 hour ago</span>
                <span className="activity-text">Changed password</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .dashboard-header h1 {
          color: white;
          margin: 0;
          font-size: 2rem;
          font-weight: 600;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 20px;
          color: white;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .logout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dashboard-main {
          padding: 40px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }

        .dashboard-card h2 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .user-details p, .auth-status p {
          margin: 10px 0;
          color: #555;
          line-height: 1.6;
        }

        .status-authenticated {
          color: #28a745;
          font-weight: 600;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-btn.secondary {
          background: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .activity-time {
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 500;
        }

        .activity-text {
          color: #495057;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 15px 20px;
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .dashboard-main {
            padding: 20px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
