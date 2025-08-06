interface SafariHeaderProps {
  title: string;
  children?: React.ReactNode;
}

function SafariHeader({ title, children }: SafariHeaderProps) {
  return (
    <div className="flex items-center h-8 px-4 rounded-t-2xl bg-neutral-100 border-b border-neutral-200 relative">
      <span className="flex space-x-2">
        <span className="w-3 h-3 bg-red-400 rounded-full inline-block"></span>
        <span className="w-3 h-3 bg-yellow-300 rounded-full inline-block"></span>
        <span className="w-3 h-3 bg-green-400 rounded-full inline-block"></span>
      </span>
      <span className="mx-auto text-xs text-neutral-500 font-medium select-none">
        {title}
      </span>
      {children}
    </div>
  );
}

export default SafariHeader;
