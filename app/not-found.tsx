export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: 'black', color: 'white', padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Page not found</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        The page you’re looking for doesn’t exist.
      </p>
    </main>
  );
}
