import { Routes, Route } from "react-router-dom";
import { ChatPage, Login, Menu, MicrosoftCallback, Resources } from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<MicrosoftCallback />} />
      <Route path="/" element={<Menu />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="/resources" element={<Resources />} />
    </Routes>
  );
}

export default App;
