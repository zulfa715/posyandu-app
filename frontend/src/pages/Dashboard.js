import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GrowthChart from '../components/GrowthChart';
import Education from '../components/Education';
import ExportPDF from '../components/ExportPDF';

function Dashboard() {
  const [children, setChildren] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [growthData, setGrowthData] = useState({ dates: [], weights: [], heights: [] });
  const [showChart, setShowChart] = useState(false);
  const [activeTab, setActiveTab] = useState('children');
  const [newChild, setNewChild] = useState({
    name: '',
    birth_date: '',
    gender: 'L',
    parent_phone: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await axios.get('https://zealous-compassion.railway.app/api/children');
      setChildren(response.data.children);
    } catch (error) {
      console.error('Gagal ambil data:', error);
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

  const handleInputChange = (e) => {
    setNewChild({ ...newChild, [e.target.name]: e.target.value });
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://zealous-compassion.railway.app/api/children', newChild);
      alert('Balita berhasil ditambahkan!');
      setShowForm(false);
      setNewChild({ name: '', birth_date: '', gender: 'L', parent_phone: '' });
      fetchChildren();
    } catch (error) {
      alert('Gagal menambahkan: ' + error.message);
    }
  };

  const handleInputWeight = async (childId) => {
    const weight = prompt('Masukkan berat badan (kg):');
    const height = prompt('Masukkan tinggi badan (cm):');
    if (weight && height) {
      try {
        await axios.post('https://zealous-compassion.railway.app/api/growth-records', {
          child_id: childId,
          weight_kg: parseFloat(weight),
          height_cm: parseFloat(height)
        });
        alert('Data pemeriksaan disimpan!');
        fetchChildren();
      } catch (error) {
        alert('Gagal menyimpan data');
      }
    }
  };

  const handleDeleteChild = async (childId, childName) => {
    const confirm = window.confirm(`Hapus ${childName}? Semua data pemeriksaan akan ikut terhapus.`);
    if (!confirm) return;
    try {
      await axios.delete(`https://zealous-compassion.railway.app/api/children/${childId}`);
      alert(`${childName} berhasil dihapus!`);
      fetchChildren();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ backgroundColor: '#2d3748', color: 'white', padding: '15px 20px' }}>
        <h1 style={{ margin: 0 }}>Posyandu Sehat - Dashboard Admin</h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <button 
            onClick={() => setActiveTab('children')} 
            style={{ 
              backgroundColor: activeTab === 'children' ? '#4299e1' : 'transparent', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            👶 Data Balita
          </button>
          <button 
            onClick={() => setActiveTab('education')} 
            style={{ 
              backgroundColor: activeTab === 'education' ? '#4299e1' : 'transparent', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            📚 Edukasi Kesehatan
          </button>
        </div>
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
          <ExportPDF children={children} />
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

      {/* Konten */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'children' ? (
          <>
            {/* Tombol Tambah Balita */}
            <button 
              onClick={() => setShowForm(!showForm)} 
              style={{ backgroundColor: '#48bb78', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
            >
              + Tambah Balita
            </button>

            {/* Form Tambah Balita */}
            {showForm && (
              <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <h2>Tambah Balita Baru</h2>
                <form onSubmit={handleAddChild}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nama Balita</label>
                    <input name="name" value={newChild.name} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Tanggal Lahir</label>
                    <input type="date" name="birth_date" value={newChild.birth_date} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Jenis Kelamin</label>
                    <select name="gender" value={newChild.gender} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nomor HP Orang Tua</label>
                    <input name="parent_phone" value={newChild.parent_phone} onChange={handleInputChange} placeholder="081234567890" style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
                  </div>
                  <button type="submit" style={{ backgroundColor: '#4299e1', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>Simpan</button>
                </form>
              </div>
            )}

            {/* Tabel Balita */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#edf2f7' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Nama</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Tanggal Lahir</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>JK</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>HP Orang Tua</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px' }}>{child.name}</td>
                      <td style={{ padding: '12px' }}>{child.birth_date}</td>
                      <td style={{ padding: '12px' }}>{child.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                      <td style={{ padding: '12px' }}>{child.parent_phone}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleInputWeight(child.id)} style={{ backgroundColor: '#4299e1', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Input Pemeriksaan</button>
                        <button onClick={() => handleViewChart(child)} style={{ backgroundColor: '#f59e0b', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', marginLeft: '5px' }}>📊 Grafik</button>
                        <button onClick={() => handleDeleteChild(child.id, child.name)} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', marginLeft: '5px' }}>🗑️ Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {children.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>Belum ada data balita</p>}
            </div>
          </>
        ) : (
          <Education />
        )}
      </div>

      {/* Modal Grafik */}
      {showChart && selectedChild && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', width: '90%', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto', padding: '20px' }}>
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

export default Dashboard;