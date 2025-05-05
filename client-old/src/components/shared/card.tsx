type CardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const Card = ({ title, description, children }: CardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
      {children}
    </div>
  );
};

export default Card;
