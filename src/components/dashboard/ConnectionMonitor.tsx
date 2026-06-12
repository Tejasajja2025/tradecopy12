
"use client";

import { useMemo } from "react";
import { Activity, ShieldCheck, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";

export function ConnectionMonitor() {
  const db = useFirestore();
  const bridgeQuery = useMemo(() => collection(db, "bridges"), [db]);
  const { data: bridges } = useCollection(bridgeQuery);

  const staticConnections = [
    { service: "Firestore Ledger", status: "online", latency: 12 },
    { service: "Mirroring Grid", status: "online", latency: 45 },
    { service: "GenAI Risk Engine", status: "online", latency: 240 },
  ];

  return (
    <Card className="glass-card snappy-transition hover:border-accent/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-headline font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" strokeWidth={1.5} />
          Network Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MT5 EA Dynamic Connections */}
        {bridges.map((bridge: any) => (
          <div key={bridge.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                bridge.status === 'online' ? "bg-accent shadow-[0_0_8px_hsl(var(--accent))]" : "bg-destructive"
              )} />
              <div className="flex flex-col">
                <span className="text-[11px] font-medium leading-none mb-1">MT5 Terminal: {bridge.terminalId}</span>
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Terminal className="w-2.5 h-2.5 text-primary" /> EA v{bridge.version || '1.0'} Active
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent uppercase font-bold tracking-tighter">
                {bridge.status}
              </span>
            </div>
          </div>
        ))}

        {staticConnections.map((conn) => (
          <div key={conn.service} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                conn.status === 'online' ? "bg-white/20" : "bg-destructive"
              )} />
              <div className="flex flex-col">
                <span className="text-[11px] font-medium leading-none mb-1">{conn.service}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground/50">{conn.latency}ms</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/50 border border-white/5 uppercase">
                {conn.status}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
