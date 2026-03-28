import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRuns } from "@/hooks/useApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

const PROVIDER_STROKE: Record<string, string> = {
  brave: "hsl(255 45% 60%)",
  serper: "hsl(172 50% 40%)",
  tavily: "hsl(40 75% 55%)",
  exa: "hsl(0 60% 55%)",
  tinyfish: "hsl(158 45% 45%)",
};

const MOCK_TREND = [
  { run: "Run 1", brave: 0.78, serper: 0.74, tavily: 0.82, exa: 0.85, tinyfish: 0.8 },
  { run: "Run 2", brave: 0.81, serper: 0.77, tavily: 0.85, exa: 0.86, tinyfish: 0.83 },
  { run: "Run 3", brave: 0.83, serper: 0.79, tavily: 0.87, exa: 0.87, tinyfish: 0.86 },
  { run: "Run 4", brave: 0.84, serper: 0.8, tavily: 0.89, exa: 0.88, tinyfish: 0.88 },
  { run: "Run 5", brave: 0.82, serper: 0.81, tavily: 0.88, exa: 0.86, tinyfish: 0.87 },
];

export default function TrendChart() {
  const { data: runs } = useRuns();

  const { chartData, providerKeys, isLive } = useMemo(() => {
    const completedRuns = (runs ?? [])
      .filter((r) => r.status === "completed" && Array.isArray(r.scores) && r.scores.length > 0)
      .sort((a, b) => a.created_at - b.created_at);

    if (completedRuns.length < 2) {
      return {
        chartData: MOCK_TREND,
        providerKeys: ["brave", "serper", "tavily", "exa", "tinyfish"],
        isLive: false,
      };
    }

    const allProviders = new Set<string>();
    const data = completedRuns.map((run, idx) => {
      const point: Record<string, string | number> = {
        run: `Run ${idx + 1}`,
      };

      // Mean NDCG per provider in this run
      const ndcgByProvider: Record<string, number[]> = {};
      for (const score of run.scores ?? []) {
        allProviders.add(score.provider);
        if (!ndcgByProvider[score.provider]) ndcgByProvider[score.provider] = [];
        ndcgByProvider[score.provider].push(score.ndcg_at_k);
      }

      for (const [provider, values] of Object.entries(ndcgByProvider)) {
        point[provider] = +(
          values.reduce((a, b) => a + b, 0) / values.length
        ).toFixed(4);
      }

      return point;
    });

    return {
      chartData: data,
      providerKeys: Array.from(allProviders),
      isLive: true,
    };
  }, [runs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="gradient-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 ring-1 ring-brand-cyan/20">
                <TrendingUp className="h-4 w-4 text-brand-cyan" />
              </div>
              <CardTitle className="font-sans-brand text-lg">
                NDCG@K Trend
              </CardTitle>
            </div>
            {!isLive && (
              <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning ring-1 ring-warning/20">
                Sample data
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(210 20% 90%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="run"
                  tick={{ fontSize: 12, fill: "hsl(215 15% 48%)" }}
                  axisLine={{ stroke: "hsl(210 20% 90%)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fontSize: 12, fill: "hsl(215 15% 48%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1px solid hsl(210 20% 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  formatter={(value: number) => [value.toFixed(3), ""]}
                  labelStyle={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(value: string) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
                {providerKeys.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={PROVIDER_STROKE[key] ?? "hsl(215 15% 48%)"}
                    strokeWidth={2.5}
                    dot={{ r: 5, strokeWidth: 2, fill: "hsl(210 40% 99%)" }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
