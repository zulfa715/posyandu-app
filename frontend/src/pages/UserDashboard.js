import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GrowthChart from '../components/GrowthChart';

function UserDashboard() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [growthData, setGrowthData] = useState({ dates: [], weights: [], heights: [] });
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.phone) {
      fetchMyChildren();
    }
  }, [user.phone]);

  const fetchMyChildren = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://zealous-compassion.railway.app/api/children/by-parent/${user.phone}`);
      setChildren(response.data.children);
    } catch (error) {
      console.error('Gagal ambil data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowthData = async (childId) => {
    try {
      const response = await axios.get(`https://zealous-compassion.railway.app/api/growth/${childId}`);
      const records = response.data.records;
      const dates = records.map(r => r.visit_date);
      const weights = records.map(r => r.weight_kg);
      const heights = records.map(r => r.height_cm);
      setGrowthData({ dates, weights, heights });
    } catch (error) {
      console.error('Gagal ambil data grafik:', error);
    }
  };

  const handleViewChart = async (child) => {
    setSelectedChild(child);
    setShowChart(true);
    await fetchGrowthData(child.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Memuat data...</h2>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        backgroundColor: '#2d3748',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>Posyandu Sehat - Dashboard Orang Tua</h1>
        <div>
          <span style={{ marginRight: '15px' }}>👋 {user.full_name || 'User'}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e53e3e',
              color: 'white',
              padding: '5px 15px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px',
          borderLeft: '4px solid #48bb78'
        }}>
          <h2 style={{ margin: 0, color: '#2f855a' }}>👋 Selamat Datang, {user.full_name}</h2>
          <p style={{ margin: '5px 0 0 0', color: '#4a5568' }}>Berikut adalah data perkembangan anak Anda:</p>
        </div>

        {children.length === 0 ? (
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h3>Belum ada data balita</h3>
            <p>Silakan hubungi kader posyandu untuk mendaftarkan anak Anda.</p>
          </div>
        ) : (
          <div>
            {children.map((child) => (
              <div key={child.id} style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                marginBottom: '20px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '10px',
                  marginBottom: '15px'
                }}>
                  <h2 style={{ margin: 0, color: '#2d3748' }}>{child.name}</h2>
                  <button
                    onClick={() => handleViewChart(child)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '8px 15px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Lihat Grafik Pertumbuhan
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div><strong>Tanggal Lahir:</strong> {child.birth_date}</div>
                  <div><strong>Jenis Kelamin:</strong> {child.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                  <div><strong>Terdaftar:</strong> {new Date(child.created_at).toLocaleDateString('id-ID')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showChart && selectedChild && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Grafik Pertumbuhan {selectedChild.name}</h2>
              <button onClick={() => setShowChart(false)} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
            </div>
            <GrowthChart growthData={growthData} childName={selectedChild.name} />
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;