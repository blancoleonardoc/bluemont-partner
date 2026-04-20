'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginInner() {
  const params = useSearchParams();
  const error = params.get('error');
  const unauthorized = error === 'unauthorized' || error === 'AccessDenied';

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.brand}>bluemont<small style={styles.small}> · partner</small></h1>
        <p style={styles.sub}>acesso restrito</p>
        {unauthorized && (
          <div style={styles.err}>
            este e-mail não tem permissão. fale com o administrador.
          </div>
        )}
        <button style={styles.btn} onClick={() => signIn('google', { callbackUrl: '/index.html' })}>
          entrar com google
        </button>
        <p style={styles.footer}>v1.0 — bluemont partner</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050d1a', color: '#e9edf2', fontFamily: 'Rockwell, Georgia, serif' },
  card: { background: '#0b1626', border: '1px solid #1a2740', borderRadius: 12, padding: '40px 36px', width: 360, textAlign: 'center' },
  brand: { fontSize: 28, margin: 0, color: '#00d4e8' },
  small: { color: '#e9edf2', fontSize: 14 },
  sub: { color: '#8892a6', margin: '8px 0 24px', fontSize: 14 },
  btn: { width: '100%', padding: '12px 16px', background: '#00d4e8', color: '#050d1a', border: 0, borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  err: { background: '#2a1418', border: '1px solid #5a1f28', color: '#ff8a99', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  footer: { color: '#8892a6', fontSize: 11, marginTop: 24, marginBottom: 0 },
};
