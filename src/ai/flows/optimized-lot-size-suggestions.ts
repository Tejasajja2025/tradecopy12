'use server';
/**
 * @fileOverview An AI-powered risk strategy tool that suggests optimized lot sizes for followers.
 *
 * - optimizedLotSizeSuggestions - A function that calculates optimized lot size suggestions.
 * - OptimizedLotSizeSuggestionsInput - The input type for the optimizedLotSizeSuggestions function.
 * - OptimizedLotSizeSuggestionsOutput - The return type for the optimizedLotSizeSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizedLotSizeSuggestionsInputSchema = z.object({
  tradeDetails: z.object({
    currencyPair: z.string().describe('The currency pair for the trade (e.g., "EURUSD").'),
    direction: z.enum(['BUY', 'SELL']).describe('The direction of the trade (BUY or SELL).'),
    entryPrice: z.number().describe('The entry price for the trade.'),
    stopLossPrice: z.number().describe('The stop loss price for the trade.'),
    takeProfitPrice: z.number().describe('The take profit price for the trade.'),
  }).describe('Details about the master trade being placed.'),
  marketVolatility: z.object({
    averageTrueRange: z.number().describe('The current Average True Range (ATR) indicating market volatility.'),
    recentPriceSwingPips: z.number().describe('The recent average price swing in pips.'),
  }).describe('Current market volatility conditions.'),
  followers: z.array(z.object({
    id: z.string().describe('Unique identifier for the follower account.'),
    accountBalance: z.number().describe('The current balance of the follower account.'),
    maxRiskPerTradePercentage: z.number().min(0).max(1).describe('The maximum percentage of the account balance a follower is willing to risk per trade (e.g., 0.01 for 1%).'),
  })).describe('A list of follower accounts with their risk profiles.'),
});

export type OptimizedLotSizeSuggestionsInput = z.infer<typeof OptimizedLotSizeSuggestionsInputSchema>;

const OptimizedLotSizeSuggestionsOutputSchema = z.object({
  lotSizeSuggestions: z.array(z.object({
    followerId: z.string().describe('The unique identifier of the follower account.'),
    suggestedLotSize: z.number().min(0).describe('The calculated optimized lot size for the follower.'),
    rationale: z.string().describe('An explanation for the suggested lot size, including risk calculations.'),
  })).describe('A list of optimized lot size suggestions for each follower.'),
});

export type OptimizedLotSizeSuggestionsOutput = z.infer<typeof OptimizedLotSizeSuggestionsOutputSchema>;

export async function optimizedLotSizeSuggestions(input: OptimizedLotSizeSuggestionsInput): Promise<OptimizedLotSizeSuggestionsOutput> {
  return optimizedLotSizeSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizedLotSizeSuggestionsPrompt',
  input: { schema: OptimizedLotSizeSuggestionsInputSchema },
  output: { schema: OptimizedLotSizeSuggestionsOutputSchema },
  prompt: `You are an expert risk management analyst for forex trading. Your task is to calculate and suggest optimized lot sizes for various follower accounts based on a master trade's details, current market volatility, and each follower's individual risk tolerance.

Here are the details:

Master Trade Details:
Currency Pair: {{{tradeDetails.currencyPair}}}
Direction: {{{tradeDetails.direction}}}
Entry Price: {{{tradeDetails.entryPrice}}}
Stop Loss Price: {{{tradeDetails.stopLossPrice}}}
Take Profit Price: {{{tradeDetails.takeProfitPrice}}}

Market Volatility (for general context and adjustment):
Average True Range (ATR): {{{marketVolatility.averageTrueRange}}}
Recent Price Swing (Pips): {{{marketVolatility.recentPriceSwingPips}}}

Follower Accounts:
{{#each followers}}
  - Follower ID: {{{id}}}
    Account Balance: {{{accountBalance}}}
    Maximum Risk Per Trade (%): {{{maxRiskPerTradePercentage}}}
{{/each}}

For each follower, perform the following calculations and provide a suggested lot size and a detailed rationale:

1.  **Calculate the risk per pip:** Determine the monetary value of one pip for the given currency pair and trade size (e.g., a standard lot).
2.  **Calculate the stop loss in pips:** The difference between the entry price and the stop loss price.
3.  **Calculate maximum monetary risk:** For each follower, calculate the absolute monetary amount they are willing to risk based on their 'Account Balance' and 'Maximum Risk Per Trade (%)'.
4.  **Determine Raw Lot Size:** Calculate a preliminary lot size using the maximum monetary risk and the risk per pip (based on stop loss).
5.  **Adjust for Market Volatility:** Briefly consider the 'Average True Range (ATR)' and 'Recent Price Swing (Pips)'. If volatility is exceptionally high, you might suggest a slightly smaller lot size to mitigate unexpected movements, explaining this adjustment in the rationale. If volatility is very low, you might stick closer to the raw calculation.
6.  **Provide Rationale:** Explain how you arrived at the suggested lot size, detailing the calculations for maximum monetary risk, stop loss in pips, and any adjustments made due to market volatility. Ensure the rationale is clear and concise.

Present your output as a JSON object strictly adhering to the OptimizedLotSizeSuggestionsOutputSchema.
`,
});

const optimizedLotSizeSuggestionsFlow = ai.defineFlow(
  {
    name: 'optimizedLotSizeSuggestionsFlow',
    inputSchema: OptimizedLotSizeSuggestionsInputSchema,
    outputSchema: OptimizedLotSizeSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
