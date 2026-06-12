
"use client";

import { useMemo } from "react";
import { History, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export function LedgerLog() {
  const db = useFirestore();
  const signalsQuery = useMemo(() => {
    return query(collection(db, "signals"), orderBy("timestamp", "desc"), limit(10));
  }, [db]);
  
  const { data: logs, loading } = useCollection(signalsQuery);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-headline font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <History className="w-4 h-4 text-primary" strokeWidth={1.5} />
          Signal Ledger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">Loading cloud ledger...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No signals broadcasted yet.</p>
            ) : logs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group border border-transparent hover:border-white/10 snappy-transition">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-8 rounded-full ${log.direction === 'BUY' ? 'bg-accent' : 'bg-destructive'}`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold flex items-center gap-1 uppercase">
                      {log.currencyPair}
                      <ArrowRight className="w-2 h-2 text-muted-foreground" />
                      {log.entryPrice}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                      <Clock className="w-2 h-2" /> {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : '...'} • {log.id.substring(0, 5)}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 group-hover:border-primary/50 group-hover:text-primary">
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
