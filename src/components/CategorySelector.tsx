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

  // Determine if we're on Closed End Funds pages
  const isOnClosedEndFundsPage = 
    location.pathname.startsWith("/cef") ||
    location.pathname === "/closed-end-funds" ||
    location.pathname.startsWith("/closed-end-funds");

  // Show the opposite option - if on Covered Call, show Closed End Funds, and vice versa
  const oppositeOption = isOnClosedEndFundsPage
    ? { label: "Covered Call Option ETFs", path: "/covered-call-etfs" }
    : { label: "Closed End Funds", path: "/closed-end-funds" };

  const handleNavigation = () => {
    navigate(oppositeOption.path);
  };

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
        <DropdownMenuItem
          onClick={handleNavigation}
          className="cursor-pointer"
        >
          {oppositeOption.label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

