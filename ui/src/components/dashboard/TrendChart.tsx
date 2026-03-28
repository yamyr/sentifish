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
  brave: "hsl(243 75% 55%)",
  serper: "hsl(192 85% 48%)",
  tavily: "hsl(38 92% 50%)",
  tinyfish: "hsl(152 60% 42%)",
};

const MOCK_TREND = [
  { run: "Run 1", brave: 0.78, serper: 0.74, tavily: 0.82, tinyfish: 0.8 },
  { run: "Run 2", brave: 0.81, serper: 0.77, tavily: 0.85, tinyfish: 0.83 },
  { run: "Run 3", brave: 0.83, serper: 0.79, tavily: 0.87, tinyfish: 0.86 },
  { run: "Run 4", brave: 0.84, serper: 0.8, tavily: 0.89, tinyfish: 0.88 },
  { run: "Run 5", brave: 0.82, serper: 0.81, tavily: 0.88, tinyfish: 0.87 },
];

export default function TrendChart() {
  const { data: runs } = useRuns();

  const { chartData, providerKeys, isLive } = useMemo(() => {
    const completedRuns = (runs ?? [])
      .filter((r) => r.status === "completed" && r.scores.length > 0)
      .sort((a, b) => a.created_at - b.created_at);

    if (completedRuns.length < 2) {
      return {
        chartData: MOCK_TREND,
        providerKeys: ["brave", "serper", "tavily", "tinyfish"],
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
      for (const score of run.scores) {
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
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-cyan" />
              <CardTitle className="font-sans-brand text-lg">
                NDCG@K Trend
              </CardTitle>
            </div>
            {!isLive && (
              <span className="text-xs text-muted-foreground italic">
                Sample data -- needs 2+ completed runs
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220 13% 88%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="run"
                  tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }}
                  axisLine={{ stroke: "hsl(220 13% 88%)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 13% 88%)",
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
                    stroke={PROVIDER_STROKE[key] ?? "hsl(220 10% 46%)"}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
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
