import { useInstallPrompt } from "./hooks/use-install-prompt";

function App() {
  const { isSupported, promptInstall } = useInstallPrompt();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-4">Coesco PWA</h1>
      {isSupported ? (
        <button
          onClick={promptInstall}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          Install App
        </button>
      ) : (
        <p className="text-sm text-gray-500">
          App is installed or not supported
        </p>
      )}
    </div>
  );
}

export default App;
