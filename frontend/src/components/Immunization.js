import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Immunization({ childId, childName, onClose }) {
  const [immunizations, setImmunizations] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [givenDate, setGivenDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImmunizations();
    fetchHistory();
  }, [childId]);

  const fetchImmunizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/immunizations');
      setImmunizations(response.data.data);
    } catch (error) {
      console.error('Gagal ambil data imunisasi:', error);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/child-immunizations/${childId}`);
      setHistory(response.data.data);
    } catch (error) {
      console.error('Gagal ambil riwayat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImmunization = async () => {
    if (!selectedVaccine) {
      alert('Pilih jenis imunisasi');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/child-immunizations', {
        child_id: childId,
        immunization_id: selectedVaccine,
        given_date: givenDate,
        notes: 'Diberikan oleh kader'
      });
      alert('Imunisasi berhasil dicatat!');
      setSelectedVaccine('');
      setGivenDate(new Date().toISOString().split('T')[0]);
      fetchHistory();
    } catch (error) {
      alert('Gagal mencatat: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus riwayat imunisasi ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/child-immunizations/${id}`);
        alert('Berhasil dihapus!');
        fetchHistory();
      } catch (error) {
        alert('Gagal menghapus');
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span style={{ backgroundColor: '#48bb78', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>✅ Sudah</span>;
    }
    return <span style={{ backgroundColor: '#ed8936', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>⏳ Terjadwal</span>;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '10px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflow: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>💉 Riwayat Imunisasi - {childName}</h2>
          <button onClick={onClose} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Tutup</button>
        </div>

        <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>+ Catat Imunisasi Baru</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={selectedVaccine} onChange={(e) => setSelectedVaccine(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}>
              <option value="">Pilih Jenis Imunisasi</option>
              {immunizations.map(v => (
                <option key={v.id} value={v.id}>{v.name} (usia {v.due_month} bulan) - {v.description}</option>
              ))}
            </select>
            <input type="date" value={givenDate} onChange={(e) => setGivenDate(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
            <button onClick={handleAddImmunization} style={{ backgroundColor: '#4299e1', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Simpan</button>
          </div>
        </div>

        <h3>📋 Riwayat Imunisasi</h3>
        {loading ? (
          <p>Memuat data...</p>
        ) : history.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fef3c7', borderRadius: '10px' }}>Belum ada catatan imunisasi. Silakan tambahkan di atas.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#edf2f7' }}>
              <tr><th style={{ padding: '10px', textAlign: 'left' }}>Jenis Imunisasi</th><th style={{ padding: '10px', textAlign: 'left' }}>Tanggal</th><th style={{ padding: '10px', textAlign: 'left' }}>Usia</th><th style={{ padding: '10px', textAlign: 'left' }}>Status</th><th style={{ padding: '10px', textAlign: 'left' }}>Aksi</th></tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}><strong>{item.name}</strong><br /><small>{item.description}</small></td>
                  <td style={{ padding: '10px' }}>{item.given_date}</td>
                  <td style={{ padding: '10px' }}>{item.due_month} bulan</td>
                  <td style={{ padding: '10px' }}>{getStatusBadge(item.status)}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Immunization;