const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'posyandu_db',
    password: 'postgres',
    port: 5432,
});

const JWT_SECRET = 'rahasia_posyandu_2026';

// Membuat tabel (URUTAN PENTING: users dulu, baru balita)
async function initDatabase() {
    try {
        // Tabel users (dibuat pertama)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabel users siap');

        // Tabel balita (dibuat setelah users)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS balita (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                nama VARCHAR(100) NOT NULL,
                berat_badan DECIMAL(5,2) NOT NULL,
                tinggi_badan DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabel balita siap');

        // Buat admin jika belum ada
        const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@posyandu.com'");
        if (adminCheck.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (nama, email, password_hash, role) VALUES ($1, $2, $3, $4)",
                ['Admin Posyandu', 'admin@posyandu.com', hashedPassword, 'admin']
            );
            console.log('✅ Admin created: admin@posyandu.com / admin123');
        }

        // Ambil ID admin
        const adminUser = await pool.query("SELECT id FROM users WHERE email = 'admin@posyandu.com'");
        const adminId = adminUser.rows[0].id;

        // Tambah data contoh jika tabel balita kosong
        const balitaCount = await pool.query("SELECT COUNT(*) FROM balita");
        if (parseInt(balitaCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO balita (user_id, nama, berat_badan, tinggi_badan) VALUES 
                ($1, 'Ahmad', 8.5, 72),
                ($1, 'Bunga', 7.2, 68),
                ($1, 'Cipto', 9.5, 75),
                ($1, 'Dina', 6.8, 65),
                ($1, 'Eka', 10.2, 78),
                ($1, 'Fani', 5.5, 60)
            `, [adminId]);
            console.log('✅ 6 data contoh balita ditambahkan');
        }

        console.log('✅ Database siap!');
    } catch (err) {
        console.error('❌ Database error:', err.message);
    }
}
initDatabase();

// Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Akses ditolak. Silakan login.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token tidak valid' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Akses khusus admin' });
    next();
};

// API Endpoints
app.get('/', (req, res) => {
    res.json({ message: 'Posyandu API Running', status: 'OK' });
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });
        
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Email atau password salah' });
        
        const token = jwt.sign({ id: user.id, nama: user.nama, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ success: true, token, user: { id: user.id, nama: user.nama, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register
app.post('/api/register', async (req, res) => {
    const { nama, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (nama, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nama, email, role',
            [nama, email, hashedPassword]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: 'Email sudah terdaftar' });
    }
});

// Get semua balita (admin only)
app.get('/api/balita', authMiddleware, isAdmin, async (req, res) => {
    const result = await pool.query('SELECT * FROM balita ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
});

// Get balita milik user sendiri
app.get('/api/balita/my', authMiddleware, async (req, res) => {
    const result = await pool.query('SELECT * FROM balita WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
});

// Tambah balita
app.post('/api/balita', authMiddleware, async (req, res) => {
    const { nama, berat_badan, tinggi_badan } = req.body;
    const targetUserId = req.user.id;
    const result = await pool.query(
        'INSERT INTO balita (user_id, nama, berat_badan, tinggi_badan) VALUES ($1, $2, $3, $4) RETURNING *',
        [targetUserId, nama, berat_badan, tinggi_badan]
    );
    res.json({ success: true, data: result.rows[0] });
});

// Hapus balita (admin only)
app.delete('/api/balita/:id', authMiddleware, isAdmin, async (req, res) => {
    await pool.query('DELETE FROM balita WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 SERVER BERJALAN!');
    console.log('📡 http://localhost:' + PORT);
    console.log('========================================');
    console.log('👤 Login: admin@posyandu.com / admin123');
});