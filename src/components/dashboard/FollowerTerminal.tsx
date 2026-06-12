
"use client";

import { useMemo } from "react";
import { CheckCircle2, RefreshCcw, Unplug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";

export function FollowerTerminal() {
  const db = useFirestore();
  const followersQuery = useMemo(() => collection(db, "followers"), [db]);
  const { data: followers, loading } = useCollection(followersQuery);

  const fallbackFollowers: any[] = [];
  const displayData = followers.length > 0 ? followers : fallbackFollowers;

  return (
    <Card className="glass-card h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Unplug className="w-5 h-5 text-accent" strokeWidth={1.5} />
          Follower Terminal
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
            {displayData.filter((f: any) => f.status === 'online').length} ACTIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-[10px] uppercase font-headline tracking-wider">Follower</TableHead>
              <TableHead className="text-[10px] uppercase font-headline tracking-wider text-right">Balance</TableHead>
              <TableHead className="text-[10px] uppercase font-headline tracking-wider text-center">Trades</TableHead>
              <TableHead className="text-[10px] uppercase font-headline tracking-wider text-center">Unrealized P/L</TableHead>
              <TableHead className="text-[10px] uppercase font-headline tracking-wider text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-xs py-8">Syncing Cloud Terminal...</TableCell></TableRow>
            ) : displayData.map((f: any) => (
              <TableRow key={f.id} className="border-white/5 hover:bg-white/5 snappy-transition">
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{f.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{f.id}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">${f.balance.toLocaleString()}</TableCell>
                <TableCell className="text-center font-semibold">{f.activeTrades ?? '—'}</TableCell>
                <TableCell className={`text-center font-semibold ${f.profitLoss >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                  {f.profitLoss === undefined ? '—' : `${f.profitLoss >= 0 ? '+' : ''}$${f.profitLoss.toFixed(2)}`}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {f.status === 'online' ? (
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    ) : (
                      <RefreshCcw className="w-4 h-4 text-warning animate-spin" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
