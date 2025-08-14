import { Routes, Route } from "react-router-dom";
import { ChatPage, Data, Login, MainMenu, MicrosoftCallback, Resources } from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<MicrosoftCallback />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/data" element={<Data />} />
    </Routes>
  );
}

export default App;
