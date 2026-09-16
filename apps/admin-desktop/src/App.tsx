// React frontend. Never calls Tauri privileged APIs (fingerprint, license
// token, filesystem) directly — that's the Rust side's job (CLAUDE.md §10).
export function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>School Admin</h1>
      <p>Phase 1 scaffold — ADMIN desktop shell.</p>
    </main>
  );
}
