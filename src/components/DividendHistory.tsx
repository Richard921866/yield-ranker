/**
 * Dividend History Component
 * 
 * Displays:
 * - Bar chart of dividend amounts over time
 * - Detailed table with Year, Amount, Ex-Date, Pay Date, etc.
 */

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronDown, ChevronUp, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { fetchDividends, type DividendData, type DividendRecord } from "@/services/tiingoApi";

interface DividendHistoryProps {
  ticker: string;
  annualDividend?: number | null;  // Pass from ETF data if available
}

interface YearlyDividend {
  year: number;
  total: number;
  count: number;
  avgAmount: number;
  dividends: DividendRecord[];
}

export function DividendHistory({ ticker, annualDividend }: DividendHistoryProps) {
  const [dividendData, setDividendData] = useState<DividendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const loadDividends = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchDividends(ticker, 10);
        setDividendData(data);
      } catch (err) {
        console.error('Error loading dividends:', err);
        setError('Failed to load dividend history');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDividends();
  }, [ticker]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error || !dividendData) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          {error || 'No dividend data available'}
        </div>
      </Card>
    );
  }

  // Group dividends by year
  const yearlyDividends: YearlyDividend[] = [];
  const dividendsByYear = new Map<number, DividendRecord[]>();
  
  dividendData.dividends.forEach(d => {
    const year = new Date(d.exDate).getFullYear();
    if (!dividendsByYear.has(year)) {
      dividendsByYear.set(year, []);
    }
    dividendsByYear.get(year)!.push(d);
  });
  
  dividendsByYear.forEach((divs, year) => {
    const total = divs.reduce((sum, d) => sum + d.amount, 0);
    yearlyDividends.push({
      year,
      total,
      count: divs.length,
      avgAmount: total / divs.length,
      dividends: divs,
    });
  });
  
  yearlyDividends.sort((a, b) => b.year - a.year);

  // Prepare chart data (last 5 years, chronological)
  const chartData = yearlyDividends
    .slice(0, 5)
    .reverse()
    .map(y => ({
      year: y.year.toString(),
      total: Number(y.total.toFixed(4)),
      count: y.count,
    }));

  // Calculate year-over-year growth
  const yoyGrowth = yearlyDividends.length >= 2
    ? ((yearlyDividends[0].total - yearlyDividends[1].total) / yearlyDividends[1].total) * 100
    : null;

  // Records to display in table
  const displayedRecords = showAllRecords 
    ? dividendData.dividends 
    : dividendData.dividends.slice(0, 12);

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Dividend History</h2>
          <p className="text-sm text-muted-foreground">
            {dividendData.paymentsPerYear} payments per year • 
            Last dividend: ${dividendData.lastDividend?.toFixed(4) || 'N/A'}
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Annual Dividend</p>
            <p className="text-lg font-bold text-green-600">
              ${(dividendData.annualizedDividend ?? annualDividend)?.toFixed(2) || 'N/A'}
            </p>
          </div>
          {yoyGrowth !== null && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">YoY Growth</p>
              <p className={`text-lg font-bold flex items-center justify-center ${
                yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {yoyGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart - Annual Dividends */}
      {chartData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-4">Annual Dividend Totals</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(4)}`,
                  'Total Dividends'
                ]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === chartData.length - 1 ? '#3b82f6' : '#93c5fd'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dividend Table */}
      <div>
        <h3 className="text-sm font-medium mb-4">Dividend Payments</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Year</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Ex-Date</TableHead>
                <TableHead className="font-semibold">Pay Date</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRecords.map((div, idx) => {
                const exDate = new Date(div.exDate);
                const payDate = div.payDate ? new Date(div.payDate) : null;
                
                return (
                  <TableRow key={idx} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {exDate.getFullYear()}
                    </TableCell>
                    <TableCell className="font-mono text-green-600">
                      ${div.amount.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      {exDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      {payDate
                        ? payDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                        {div.type || 'Cash'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Show More Button */}
        {dividendData.dividends.length > 12 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllRecords(!showAllRecords)}
              className="gap-2"
            >
              {showAllRecords ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show All ({dividendData.dividends.length} records)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-muted-foreground">
        <p>
          <DollarSign className="h-3 w-3 inline mr-1" />
          Amounts shown are per-share cash dividends.
        </p>
      </div>
    </Card>
  );
}

export default DividendHistory;
