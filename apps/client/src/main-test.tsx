import { createRoot } from "react-dom/client";

// Minimal test app
function TestApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Test App</h1>
      <p>If you can see this, React is working correctly.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<TestApp />);
