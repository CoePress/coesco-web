type ToastProps = {
  children: React.ReactNode;
};

const Toast = ({ children }: ToastProps) => {
  return <div>{children}</div>;
};

export default Toast;
