import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ChevronDown, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const CategorySelector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current category based on route (table pages)
  const getCurrentCategory = (): "cef" | "cc" => {
    if (location.pathname.startsWith("/cef")) {
      return "cef";
    }
    // Default to CC if on home page or CC pages
    return "cc";
  };

  const currentCategory = getCurrentCategory();

  // Filter options - navigate to TABLE pages (not docs)
  const options = [
    { 
      label: "Covered Call Option ETFs", 
      path: "/",  // Goes to CC table
      category: "cc" as const
    },
    { 
      label: "Closed End Funds", 
      path: "/cef",  // Goes to CEF table
      category: "cef" as const
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-100 hover:text-foreground transition-colors rounded-md flex items-center gap-1"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Filter</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.path}
            onClick={() => navigate(option.path)}
            className={`cursor-pointer ${currentCategory === option.category ? 'bg-slate-100 font-semibold' : ''}`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

