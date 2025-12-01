interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div
      className={`bg-foreground rounded p-2 duration-300 border flex flex-col ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
