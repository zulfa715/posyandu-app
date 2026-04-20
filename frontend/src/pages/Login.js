import React, { useState } from 'react';
import axios from 'axios';

function Login() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post('https://zealous-compassion.railway.app/api/login', {
                phone: phone,
                password: password
            });
            
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setMessage('✅ Login berhasil!');
                window.location.href = '/dashboard';
            }
        } catch (error) {
            setMessage('❌ Login gagal: ' + (error.response?.data?.message || 'Coba lagi'));
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    color: '#4a5568',
                    marginBottom: '10px'
                }}>
                    Posyandu Sehat
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: '#718096',
                    marginBottom: '30px'
                }}>
                    Sistem Manajemen Posyandu
                </p>
                
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Nomor WhatsApp
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="081234567890"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px'
                            }}
                            required
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '16px'
                            }}
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            backgroundColor: '#667eea',
                            color: 'white',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        Masuk
                    </button>
                </form>
                
                {message && (
                    <p style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        color: message.includes('✅') ? '#48bb78' : '#e53e3e'
                    }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Login;