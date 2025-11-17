import { Lock } from "lucide-react";

interface PremiumLockIconProps {
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
  label?: string;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
}

export const PremiumLockIcon = ({ 
  size = "md", 
  withLabel = false, 
  label,
  onClick,
  className = ""
}: PremiumLockIconProps) => {
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const containerSizes = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2"
  };

  if (withLabel) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-slate-300 hover:border-primary/50 hover:from-primary/5 hover:to-accent/5 transition-all duration-200 group ${className}`}
      >
        <div className={`${containerSizes[size]} rounded-md bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors`}>
          <Lock className={`${sizes[size]} text-primary group-hover:text-accent transition-colors`} />
        </div>
        {label && <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{label}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center ${containerSizes[size]} rounded-md bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20 hover:border-primary/40 transition-all duration-200 group ${className}`}
      title="Premium Feature"
    >
      <Lock className={`${sizes[size]} text-primary group-hover:text-accent transition-colors`} />
    </button>
  );
};

