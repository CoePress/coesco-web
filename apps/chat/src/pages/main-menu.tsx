import { useNavigate } from "react-router-dom";

const MainMenu = () => {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Chat", path: "/chat", enabled: true },
    { name: "Resources", path: "/resources", enabled: false },
    { name: "Analytics", path: "/analytics", enabled: false },
    { name: "Settings", path: "/settings", enabled: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900">
      <h1 className="text-2xl font-semibold mb-8">Internal Hub</h1>
      <div className="grid grid-cols-1 gap-4 w-64">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => item.enabled && navigate(item.path)}
            disabled={!item.enabled}
            className={`px-4 py-3 rounded-lg border text-left font-medium ${
              item.enabled
                ? "bg-white hover:bg-slate-100 border-slate-300 cursor-pointer"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
