import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./pages/home";
import IndexedDBExample from "./components/IndexedDBExample";

function useScreenSize() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isMobile;
}

function useServiceWorkerUpdates() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }
  }, []);
}

function AppContent() {
  const isMobile = useScreenSize();
  const location = useLocation();
  const version = "0.0.4";

  useServiceWorkerUpdates();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
    { id: "sales", label: "Sales", icon: "💰", path: "/sales" },
    { id: "production", label: "Production", icon: "🏭", path: "/production" },
    { id: "admin", label: "Admin", icon: "⚙️", path: "/admin" },
  ];

  const DesktopHeader = () => (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Coesco</h1>
            <p className="text-xs text-gray-500">Internal Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            v{version}
          </span>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">👤</span>
          </div>
        </div>
      </div>
    </header>
  );

  const DesktopSidebar = () => (
    <aside className="w-64 bg-white shadow-sm border-r">
      <div className="p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Navigation
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );

  const MobileHeader = () => (
    <header className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Coesco</h1>
            <p className="text-xs text-gray-500">Internal Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            v{version}
          </span>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">👤</span>
          </div>
        </div>
      </div>
    </header>
  );

  const MobileBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="grid grid-cols-4 gap-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`p-4 text-center transition-colors ${
              location.pathname === item.path
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            <div className="text-xl mb-1">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );

  const MainContent = () => (
    <main
      className={`flex-1 p-6 ${isMobile ? "pb-20" : ""} overflow-auto no-scrollbar`}>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/sales"
          element={<IndexedDBExample />}
        />
        <Route
          path="/production"
          element={<div>Production Page - Coming Soon</div>}
        />
        <Route
          path="/admin"
          element={<div>Admin Page - Coming Soon</div>}
        />
      </Routes>
    </main>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col no-scrollbar">
        <MobileHeader />
        <MainContent />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DesktopHeader />
      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar />
        <MainContent />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
