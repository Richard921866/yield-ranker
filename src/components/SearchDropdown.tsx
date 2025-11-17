import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, FileText, BookOpen, X } from "lucide-react";
import { Input } from "./ui/input";
import { mockETFs } from "@/data/mockETFs";

export const SearchDropdown = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const pages = [
    { name: "Our Focus", path: "/our-focus", icon: FileText },
    { name: "Resources", path: "/resources", icon: BookOpen },
  ];

  const filteredETFs = mockETFs.filter((etf) =>
    etf.symbol.toLowerCase().includes(query.toLowerCase()) ||
    etf.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredETFs.length > 0 || filteredPages.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search ETFs..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-12 pr-10 h-11 bg-muted/50 border-border/50 focus:bg-background text-base rounded-xl [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {hasResults ? (
              <div className="max-h-96 overflow-y-auto">
                {filteredETFs.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30">
                      ETFs
                    </div>
                    {filteredETFs.map((etf) => (
                      <button
                        key={etf.symbol}
                        onClick={() => handleSelect(`/etf/${etf.symbol}`)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground">{etf.symbol}</div>
                          <div className="text-sm text-muted-foreground truncate">{etf.name}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">${etf.price.toFixed(2)}</div>
                          <div className={etf.totalReturn1Mo && etf.totalReturn1Mo >= 0 ? "text-green-600" : "text-red-600"}>
                            {etf.totalReturn1Mo ? `${etf.totalReturn1Mo > 0 ? "+" : ""}${etf.totalReturn1Mo.toFixed(2)}%` : "N/A"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredPages.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 border-t">
                      Pages
                    </div>
                    {filteredPages.map((page) => {
                      const Icon = page.icon;
                      return (
                        <button
                          key={page.path}
                          onClick={() => handleSelect(page.path)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="font-medium text-foreground">{page.name}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
        </div>
      )}
    </div>
  );
};

