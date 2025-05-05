type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={`bg-foreground rounded p-4 duration-300 border ${className}`}>
      {children}
    </div>
  );
};

export default Card;
