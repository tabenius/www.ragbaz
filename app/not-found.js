export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.8rem",
        background: "#0a0908",
        color: "#d8c29d",
        fontFamily: '"Intel One Mono", ui-monospace, monospace',
      }}
    >
      <div style={{ color: "#f3c46c", letterSpacing: "0.14em" }}>
        // 404 · not found
      </div>
      <a href="/" style={{ color: "#ff9900", textDecoration: "none" }}>
        ↩ ragbaz.cc
      </a>
    </main>
  );
}
