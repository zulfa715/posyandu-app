const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Koneksi ke SQLite
const db = new sqlite3.Database(path.join(__dirname, 'posyandu.db'));

// Buat semua tabel
db.serialize(() => {
    // Tabel users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )`);

    // Tabel children (balita)
    db.run(`CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        gender TEXT,
        parent_phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabel growth_records (pemeriksaan)
    db.run(`CREATE TABLE IF NOT EXISTS growth_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER,
        weight_kg REAL,
        height_cm REAL,
        visit_date TEXT DEFAULT CURRENT_DATE
    )`);

    // Tabel edukasi (artikel & video)
    db.run(`CREATE TABLE IF NOT EXISTS educations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        video_url TEXT,
        category TEXT,
        image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabel jadwal posyandu (untuk notifikasi)
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        schedule_date TEXT NOT NULL,
        location TEXT,
        description TEXT,
        reminder_sent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Database SQLite siap!');

    // Insert data edukasi contoh jika kosong
    db.get('SELECT COUNT(*) as count FROM educations', [], (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO educations (title, content, category) VALUES 
                ('Pentingnya ASI Eksklusif', 'ASI eksklusif diberikan selama 6 bulan pertama untuk tumbuh kembang optimal bayi. ASI mengandung nutrisi lengkap dan antibodi untuk melindungi bayi dari penyakit.', 'ASI'),
                ('Makanan Pendamping ASI (MPASI)', 'MPASI diberikan mulai usia 6 bulan dengan tekstur yang sesuai. Mulai dari bubur encer, bubur kental, hingga makanan keluarga.', 'Gizi'),
                ('Cegah Stunting Sejak Dini', 'Stunting dapat dicegah dengan gizi seimbang, imunisasi lengkap, dan stimulasi yang tepat. Pastikan anak mendapatkan protein hewani setiap hari.', 'Stunting'),
                ('Jadwal Imunisasi Lengkap', 'Imunisasi dasar: BCG (0 bulan), DPT-HB-Hib (2,3,4 bulan), Polio (0,2,3,4 bulan), Campak (9 bulan). Lengkapi imunisasi anak tepat waktu.', 'Imunisasi')
            `);
            console.log('✅ Data edukasi contoh ditambahkan');
        }
    });
});

// ============ API ENDPOINTS ============

// Cek server
app.get('/health', (req, res) => {
    res.json({ status: 'Server Posyandu Aktif!', waktu: new Date() });
});

// REGISTER
app.post('/api/register', (req, res) => {
    const { phone, password, full_name, role } = req.body;
    
    db.run(
        'INSERT INTO users (phone, password, full_name, role) VALUES (?, ?, ?, ?)',
        [phone, password, full_name, role || 'user'],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ 
                success: true, 
                message: 'Registrasi berhasil!',
                user: { id: this.lastID, phone, full_name, role: role || 'user' }
            });
        }
    );
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { phone, password } = req.body;
    
    db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Nomor tidak ditemukan' });
        }
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Password salah' });
        }
        
        res.json({
            success: true,
            user: { 
                id: user.id, 
                phone: user.phone, 
                full_name: user.full_name, 
                role: user.role 
            }
        });
    });
});

// TAMBAH BALITA
app.post('/api/children', (req, res) => {
    const { name, birth_date, gender, parent_phone } = req.body;
    
    db.run(
        'INSERT INTO children (name, birth_date, gender, parent_phone) VALUES (?, ?, ?, ?)',
        [name, birth_date, gender, parent_phone],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ 
                success: true, 
                message: 'Balita berhasil ditambahkan!',
                child: { id: this.lastID, name, birth_date, gender, parent_phone }
            });
        }
    );
});

// LIHAT SEMUA BALITA (untuk ADMIN)
app.get('/api/children', (req, res) => {
    db.all('SELECT * FROM children ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, children: rows });
    });
});

// LIHAT BALITA BERDASARKAN NOMOR HP ORANG TUA (untuk USER)
app.get('/api/children/by-parent/:phone', (req, res) => {
    const { phone } = req.params;
    
    db.all('SELECT * FROM children WHERE parent_phone = ? ORDER BY id DESC', [phone], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, children: rows });
    });
});

// INPUT PEMERIKSAAN
app.post('/api/growth-records', (req, res) => {
    const { child_id, weight_kg, height_cm } = req.body;
    
    db.run(
        'INSERT INTO growth_records (child_id, weight_kg, height_cm, visit_date) VALUES (?, ?, ?, date("now"))',
        [child_id, weight_kg, height_cm],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ 
                success: true, 
                message: 'Data pemeriksaan disimpan!',
                record: { id: this.lastID, child_id, weight_kg, height_cm }
            });
        }
    );
});

// LIHAT RIWAYAT PERTUMBUHAN
app.get('/api/growth/:child_id', (req, res) => {
    const { child_id } = req.params;
    
    db.all(
        'SELECT * FROM growth_records WHERE child_id = ? ORDER BY visit_date ASC',
        [child_id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, records: rows });
        }
    );
});

// HAPUS BALITA (ADMIN ONLY)
app.delete('/api/children/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM growth_records WHERE child_id = ?', [id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        db.run('DELETE FROM children WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (this.changes === 0) return res.status(404).json({ success: false, message: 'Balita tidak ditemukan' });
            res.json({ success: true, message: 'Balita berhasil dihapus!' });
        });
    });
});

// HAPUS PEMERIKSAAN (ADMIN ONLY)
app.delete('/api/growth-records/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM growth_records WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, message: 'Data pemeriksaan tidak ditemukan' });
        res.json({ success: true, message: 'Data pemeriksaan berhasil dihapus!' });
    });
});

// ============ EDUKASI API ============

// GET semua edukasi
app.get('/api/educations', (req, res) => {
    db.all('SELECT * FROM educations ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

// GET edukasi by category
app.get('/api/educations/category/:category', (req, res) => {
    const { category } = req.params;
    db.all('SELECT * FROM educations WHERE category = ? ORDER BY id DESC', [category], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

// POST tambah edukasi (admin only)
app.post('/api/educations', (req, res) => {
    const { title, content, video_url, category, image_url } = req.body;
    db.run(
        'INSERT INTO educations (title, content, video_url, category, image_url) VALUES (?, ?, ?, ?, ?)',
        [title, content, video_url, category, image_url],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Edukasi ditambahkan!', id: this.lastID });
        }
    );
});

// DELETE edukasi (admin only)
app.delete('/api/educations/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM educations WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Edukasi dihapus!' });
    });
});

// ============ JADWAL & NOTIFIKASI API ============

// GET semua jadwal
app.get('/api/schedules', (req, res) => {
    db.all('SELECT * FROM schedules ORDER BY schedule_date ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: rows });
    });
});

// POST tambah jadwal
app.post('/api/schedules', (req, res) => {
    const { title, schedule_date, location, description } = req.body;
    db.run(
        'INSERT INTO schedules (title, schedule_date, location, description) VALUES (?, ?, ?, ?)',
        [title, schedule_date, location, description],
        function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Jadwal ditambahkan!', id: this.lastID });
        }
    );
});

// DELETE jadwal
app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM schedules WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Jadwal dihapus!' });
    });
});

// JALANKAN SERVER
app.listen(port, () => {
    console.log('====================');
    console.log('✅ SERVER POSYANDU LENGKAP!');
    console.log('📡 http://localhost:' + port);
    console.log('====================');
    console.log('📋 API TERSEDIA:');
    console.log('   POST   /api/register');
    console.log('   POST   /api/login');
    console.log('   POST   /api/children');
    console.log('   GET    /api/children');
    console.log('   GET    /api/children/by-parent/:phone');
    console.log('   POST   /api/growth-records');
    console.log('   GET    /api/growth/:child_id');
    console.log('   DELETE /api/children/:id');
    console.log('   DELETE /api/growth-records/:id');
    console.log('   GET    /api/educations');
    console.log('   POST   /api/educations');
    console.log('   DELETE /api/educations/:id');
    console.log('   GET    /api/schedules');
    console.log('   POST   /api/schedules');
    console.log('   DELETE /api/schedules/:id');
    console.log('====================');
});