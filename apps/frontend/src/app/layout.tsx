type Props = {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-[100dvh] bg-red-500">Layout</div>
  )
}

export default Layout