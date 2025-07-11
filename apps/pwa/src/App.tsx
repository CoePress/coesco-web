import { useState, useEffect } from "react";

// Custom hook to detect screen size
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

// Custom hook to handle service worker updates and auto-refresh
function useServiceWorkerUpdates() {
  useEffect(() => {
    // Handle service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // New service worker has taken control, reload the page
        window.location.reload();
      });

      // Check for updates on app start
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every time the app is opened
        registration.update();
      });
    }
  }, []);
}

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const isMobile = useScreenSize();

  const version = "0.0.4";

  // Enable service worker updates and auto-refresh
  useServiceWorkerUpdates();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "sales", label: "Sales", icon: "💰" },
    { id: "production", label: "Production", icon: "🏭" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ];

  const quickActions = [
    { label: "New Quote", icon: "📋", color: "bg-blue-500" },
    { label: "Machine Status", icon: "🔧", color: "bg-green-500" },
    { label: "Reports", icon: "📈", color: "bg-purple-500" },
    { label: "Settings", icon: "⚙️", color: "bg-gray-500" },
  ];

  const stats = [
    { label: "Active Quotes", value: "12", change: "+3" },
    { label: "Machines Online", value: "8/10", change: "+2" },
    { label: "Today's Orders", value: "5", change: "+1" },
  ];

  // Desktop Header Component
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

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <aside className="w-64 bg-white shadow-sm border-r">
      <div className="p-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Navigation
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );

  // Mobile Header Component
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

  // Mobile Bottom Navigation
  const MobileBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="grid grid-cols-4 gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`p-4 text-center transition-colors ${
              activeSection === item.id
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            <div className="text-xl mb-1">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );

  // Main Content Component
  const MainContent = () => (
    <main className={`flex-1 p-6 ${isMobile ? "pb-20" : ""} overflow-auto`}>
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Good Morning</h2>
        <p className="text-gray-600 text-sm">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid gap-4 mb-6 ${isMobile ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 lg:grid-cols-3 xl:grid-cols-4"}`}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </h3>
        <div
          className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
              <div
                className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                <span className="text-white text-xl">{action.icon}</span>
              </div>
              <p className="font-medium text-gray-900">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Recent Activity
        </h3>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📋</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New quote created
                </p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🔧</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Machine #5 came online
                </p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Weekly report generated
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <MobileHeader />
        <MainContent />
        <MobileBottomNav />
      </div>
    );
  }

  // Desktop Layout
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

export default App;
