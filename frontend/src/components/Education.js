import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Education() {
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: 'Gizi',
    video_url: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? 'https://zealous-compassion.railway.app/api/educations'
        : `https://zealous-compassion.railway.app/api/educations/category/${selectedCategory}`;
      const response = await axios.get(url);
      setArticles(response.data.data);
    } catch (error) {
      console.error('Gagal ambil artikel:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const handleInputChange = (e) => {
    setNewArticle({ ...newArticle, [e.target.name]: e.target.value });
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://zealous-compassion.railway.app/api/educations', newArticle);
      alert('Artikel berhasil ditambahkan!');
      setShowForm(false);
      setNewArticle({ title: '', content: '', category: 'Gizi', video_url: '' });
      fetchArticles();
    } catch (error) {
      alert('Gagal menambahkan: ' + error.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Hapus "${title}"?`)) {
      try {
        await axios.delete(`https://zealous-compassion.railway.app/api/educations/${id}`);
        alert('Artikel dihapus!');
        fetchArticles();
      } catch (error) {
        alert('Gagal menghapus');
      }
    }
  };

  const categories = ['all', 'ASI', 'Gizi', 'Stunting', 'Imunisasi'];

  return (
    <div style={{ padding: '20px' }}>
      <h2>📚 Edukasi Kesehatan</h2>
      <p>Tips dan informasi penting untuk tumbuh kembang si kecil</p>

      {/* Filter kategori */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              backgroundColor: selectedCategory === cat ? '#4299e1' : '#e2e8f0',
              color: selectedCategory === cat ? 'white' : '#4a5568',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            {cat === 'all' ? 'Semua' : cat}
          </button>
        ))}
      </div>

      {/* Tombol tambah (hanya admin) */}
      {isAdmin && (
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: '#48bb78',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          + Tambah Artikel
        </button>
      )}

      {/* Form tambah artikel */}
      {showForm && isAdmin && (
        <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3>Tambah Artikel Baru</h3>
          <form onSubmit={handleAddArticle}>
            <div style={{ marginBottom: '10px' }}>
              <label>Judul</label>
              <input name="title" value={newArticle.title} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Konten</label>
              <textarea name="content" value={newArticle.content} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '8px', marginTop: '5px' }} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Kategori</label>
              <select name="category" value={newArticle.category} onChange={handleInputChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                <option>ASI</option>
                <option>Gizi</option>
                <option>Stunting</option>
                <option>Imunisasi</option>
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>URL Video (opsional)</label>
              <input name="video_url" value={newArticle.video_url} onChange={handleInputChange} placeholder="https://youtube.com/..." style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
            </div>
            <button type="submit" style={{ backgroundColor: '#4299e1', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Simpan</button>
          </form>
        </div>
      )}

      {/* Daftar artikel */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {articles.map(article => (
          <div key={article.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{article.title}</h3>
              {isAdmin && (
                <button onClick={() => handleDelete(article.id, article.title)} style={{ backgroundColor: '#e53e3e', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>🗑️</button>
              )}
            </div>
            <span style={{ display: 'inline-block', backgroundColor: '#edf2f7', padding: '2px 10px', borderRadius: '15px', fontSize: '12px', marginBottom: '10px' }}>{article.category}</span>
            <p style={{ color: '#4a5568' }}>{article.content}</p>
            {article.video_url && (
              <a href={article.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4299e1', textDecoration: 'none' }}>▶️ Tonton Video →</a>
            )}
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px' }}>Belum ada artikel. {isAdmin ? 'Klik "+ Tambah Artikel"' : 'Silakan cek lagi nanti'}</p>
      )}
    </div>
  );
}

export default Education;