import { Routes, Route } from "react-router-dom"
import { Layout } from "./components"
import { Chat, Login, MicrosoftCallback } from "./pages"

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<MicrosoftCallback />} />
      
      <Route path="/" element={<Layout>
        <Chat />
      </Layout>} />
    </Routes>
  )
}

export default App
