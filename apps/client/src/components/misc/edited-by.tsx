type Props = {
  isLocked: boolean;
  editorName?: string;
};

const EditedBy = ({ isLocked, editorName }: Props) => {
  if (!isLocked || !editorName) return null;

  return (
    <div className="flex items-center space-x-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm px-3 py-1.5 rounded-lg shadow-sm max-w-fit">
      <svg
        className="w-4 h-4 text-yellow-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 9V5a2 2 0 114 0v4m4 2v8H6v-8m14 0a2 2 0 00-2-2H6a2 2 0 00-2 2"
        />
      </svg>
      <span>
        <strong>{editorName}</strong> is currently editing this document
      </span>
    </div>
  );
};

export default EditedBy;
