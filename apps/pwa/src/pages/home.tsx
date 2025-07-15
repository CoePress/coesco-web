import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const quickActions = [
    { label: "New Quote", icon: "📋", color: "bg-blue-500", path: null },
    {
      label: "QR Scanner",
      icon: "📱",
      color: "bg-indigo-500",
      path: "/qr-reader",
    },
    { label: "Machine Status", icon: "🔧", color: "bg-green-500", path: null },
    { label: "Reports", icon: "📈", color: "bg-purple-500", path: null },
  ];

  const stats = [
    { label: "Active Quotes", value: "12", change: "+3" },
    { label: "Machines Online", value: "8/10", change: "+2" },
    { label: "Today's Orders", value: "5", change: "+1" },
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Good Morning</h2>
        <p className="text-gray-600 text-sm">
          Here's what's happening with your business today
        </p>
      </div>

      <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-3">
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

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.path && navigate(action.path)}
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
    </>
  );
};

export default Home;
