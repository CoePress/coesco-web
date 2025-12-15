type Props = {
  children: React.ReactNode;
}

const ErrorBoundary = ({ children }: Props) => {
  return (
    <div>ErrorBoundary</div>
  )
}

export default ErrorBoundary