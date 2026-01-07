import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import Topbar from './topbar'

const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout