'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/translate');
      } else {
        setError(data.error || 'Nieprawidłowe hasło');
      }
    } catch (error) {
      setError('Błąd połączenia. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #4f46e5, #9333ea, #ec4899)',
      padding: '1rem',
    },
    form: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '3rem 2rem',
      borderRadius: '1.5rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center',
    },
    logo: {
      fontSize: '4rem',
      marginBottom: '1rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#6b7280',
      marginBottom: '2rem',
    },
    input: {
      width: '100%',
      padding: '1rem',
      fontSize: '1.125rem',
      border: '2px solid #e5e7eb',
      borderRadius: '0.75rem',
      marginBottom: '1rem',
      textAlign: 'center',
      transition: 'border-color 0.2s',
    },
    button: {
      width: '100%',
      padding: '1rem',
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: 'white',
      background: isLoading ? '#9ca3af' : '#4f46e5',
      borderRadius: '0.75rem',
      transition: 'all 0.2s',
      cursor: isLoading ? 'not-allowed' : 'pointer',
    },
    error: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '0.5rem',
      minHeight: '1.25rem',
    },
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.logo}>🔐</div>
        <h1 style={styles.title}>TravelSpeak Family</h1>
        <p style={styles.subtitle}>Wpisz hasło rodzinne</p>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          style={styles.input}
          disabled={isLoading}
          autoFocus
        />
        
        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading}
          onMouseEnter={(e) => !isLoading && (e.target.style.background = '#6366f1')}
          onMouseLeave={(e) => !isLoading && (e.target.style.background = '#4f46e5')}
        >
          {isLoading ? 'Sprawdzam...' : 'Zaloguj się'}
        </button>
        
        <div style={styles.error}>{error}</div>
      </form>
    </div>
  );
}