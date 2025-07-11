'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f0f0f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          marginBottom: '10px'
        }}>😔</h1>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#333'
        }}>Coś poszło nie tak!</h2>
        
        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          Aplikacja napotkała niespodziewany błąd. Spróbuj odświeżyć stronę lub użyj Google Translate jako alternatywy.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0051D5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#007AFF'}
          >
            🔄 Spróbuj ponownie
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              backgroundColor: '#E5E5EA',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#D1D1D6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#E5E5EA'}
          >
            🏠 Strona główna
          </button>
        </div>
        
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f8f8f8',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>
            💡 Alternatywa:
          </p>
          <a 
            href="https://translate.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#007AFF',
              textDecoration: 'none'
            }}
          >
            Użyj Google Translate →
          </a>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details style={{
            marginTop: '20px',
            textAlign: 'left',
            fontSize: '12px',
            color: '#999'
          }}>
            <summary style={{ cursor: 'pointer' }}>Szczegóły błędu (dev)</summary>
            <pre style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px'
            }}>
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}