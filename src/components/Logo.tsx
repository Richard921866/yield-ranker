interface LogoProps {
  className?: string;
  textClassName?: string;
  simple?: boolean;
}

export const Logo = ({ className = "", textClassName = "", simple = false }: LogoProps) => {
  if (simple) {
    return (
      <div className={`flex items-center ${className}`}>
        <span className="text-2xl font-black tracking-tight text-slate-900">D</span>
        <span className="text-2xl font-black tracking-tight text-slate-900 mx-0.5">&</span>
        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">TR</span>
      </div>
    );
  }

  if (textClassName === "sidebar") {
    return (
      <div className={`flex items-center ${className}`}>
        <span className="text-base font-semibold tracking-tight text-slate-700">
          Dividends & Total Returns
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center">
        <span className="text-2xl font-black tracking-tight text-slate-900">D</span>
        <span className="text-2xl font-black tracking-tight text-slate-900 mx-0.5">&</span>
        <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">TR</span>
      </div>
      <div className="h-6 w-px bg-slate-300"></div>
      <span className={`text-sm font-semibold tracking-tight text-slate-700 ${textClassName}`}>
        Dividends & Total Returns
      </span>
    </div>
  );
};

