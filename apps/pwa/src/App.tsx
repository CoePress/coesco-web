import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./pages/home";
import QRReader from "./pages/qr-reader";
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

function SplashScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
          <span className="text-blue-600 font-bold text-4xl">C</span>
        </div>
        <h1 className="text-white text-3xl font-bold mb-2">Coesco</h1>
        <p className="text-blue-100 text-lg mb-8">Internal Dashboard</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}></div>
        </div>
        <p className="text-blue-100 text-sm mt-4">Loading{dots}</p>
      </div>
    </div>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useScreenSize();
  const location = useLocation();
  const version = "0.0.4";

  useServiceWorkerUpdates();

  useEffect(() => {
    // Simulate app initialization time
    const initializeApp = async () => {
      // Wait for a minimum time to show splash screen
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Wait for service worker to be ready (if available)
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (error) {
          console.log("Service worker not available");
        }
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

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
        <Route
          path="/qr-reader"
          element={<QRReader />}
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
