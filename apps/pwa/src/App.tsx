import { useInstallPrompt } from "./hooks/use-install-prompt";

function App() {
  const {
    isSupported,
    isIOS,
    isIOSSafari,
    isIOSChrome,
    isInstalled,
    promptInstall,
  } = useInstallPrompt();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-4">Coesco PWA</h1>

      {isInstalled ? (
        <div className="text-center">
          <p className="text-lg text-green-600 mb-2">
            ✅ App is installed! Version: 0.0.1
          </p>
          <p className="text-sm text-gray-600">
            You're running the PWA version
          </p>
        </div>
      ) : isSupported ? (
        <div className="text-center">
          {isIOSSafari ? (
            <div className="max-w-md">
              <p className="text-lg mb-4">Install this app on your iPhone:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <ol className="text-left text-sm space-y-2">
                  <li>
                    1. Tap the <strong>Share</strong> button (⬆️) in Safari
                  </li>
                  <li>
                    2. Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </li>
                  <li>
                    3. Tap <strong>"Add"</strong> to install
                  </li>
                </ol>
              </div>
              <p className="text-xs text-gray-500">
                Instructions for Safari on iOS
              </p>
            </div>
          ) : isIOSChrome ? (
            <div className="max-w-md">
              <p className="text-lg mb-4">Install this app on your iPhone:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <ol className="text-left text-sm space-y-2">
                  <li>
                    1. Tap the <strong>three dots</strong> (⋯) menu in Chrome
                  </li>
                  <li>
                    2. Tap <strong>"Add to Home Screen"</strong>
                  </li>
                  <li>
                    3. Tap <strong>"Add"</strong> to install
                  </li>
                </ol>
              </div>
              <p className="text-xs text-gray-500">
                Instructions for Chrome on iOS
              </p>
            </div>
          ) : (
            <button
              onClick={promptInstall}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
              Install App
            </button>
          )}
        </div>
      ) : (
        <div className="text-center max-w-md">
          <p className="text-sm text-gray-500 mb-2">
            {isIOS
              ? "To install this app, open it in Safari or Chrome browser"
              : "App installation not supported on this browser"}
          </p>
          <p className="text-xs text-gray-400">
            PWA installation requires a compatible browser
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
