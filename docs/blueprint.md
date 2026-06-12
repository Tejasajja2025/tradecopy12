# **App Name**: PulseCopy

## Core Features:

- Trade Command Center: A centralized dashboard for the master account to input and broadcast buy/sell signals instantly using the Firestore database.
- Real-time Signal Sync: Low-latency data synchronization that pushes trade parameters to MT5 EAs via specialized cloud webhooks.
- Risk Strategy Tool: An AI tool that reasons through account risk limits and market conditions to suggest optimized lot sizes for followers.
- Follower Terminal: A focused interface for follower accounts to monitor connection status and active mirrored trades.
- Connection Health Monitor: A status tracking system to ensure the link between the web app, MT5, and Vantage servers remains active.
- Ledger Log: Complete audit trail of all signals broadcasted by the master and executed on connected Vantage accounts.

## Style Guidelines:

- A dark 'High-Performance' theme using an Obsidian base (#0B0C10) for focus and depth.
- Primary Color: Vibrant Cobalt (#4F6BF5), suggesting trust and high-speed data transmission.
- Accent Color: Glacial Cyan (#3DB2D4), used for live data updates and buy signals to contrast against the primary.
- Headline Font: 'Space Grotesk' (sans-serif) for a precise, scientific data feel. Body Font: 'Inter' (sans-serif) for maximum legibility in complex data tables.
- Ultra-thin, monolinear stroke icons in varying line weights to denote different trade types and statuses.
- Bento-grid style dashboard layout with compact spacing to prioritize trade parameters over whitespace.
- Snappy, 200ms transitions for signal state changes to mirror the speed of financial markets.