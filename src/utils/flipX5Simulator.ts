export interface FlipConfig {
  accountSize: number;
  cycleSize: number;
  riskPerCycle: number;
  rrRatio: number;
  reinvestPercent: number;
}

export type TradeResult = 'TP' | 'SL';

export interface TradeRow {
  tradeNumber: number;
  cycle: number;
  result: TradeResult;
  riskTraditional: number;
  pnlTraditional: number;
  balanceTraditional: number;
  riskLeveraged: number;
  pnlLeveraged: number;
  balanceLeveraged: number;
}

export interface SimulationResult {
  trades: TradeRow[];
  finalBalanceTraditional: number;
  finalBalanceLeveraged: number;
  totalProfitTraditional: number;
  totalProfitLeveraged: number;
  roiTraditional: number;
  roiLeveraged: number;
  totalTP: number;
  totalSL: number;
  winRate: number;
}

export const simulateFlipX5 = (
  config: FlipConfig,
  tradeResults: TradeResult[]
): SimulationResult => {
  const { accountSize, cycleSize, riskPerCycle, rrRatio, reinvestPercent } = config;
  
  let balanceTraditional = accountSize;
  let balanceLeveraged = accountSize;
  
  const trades: TradeRow[] = [];
  const cycleData: { [key: number]: { tpCount: number; slCount: number; profit: number } } = {};
  
  let currentCycle = 1;
  let tradesInCycle = 0;
  
  tradeResults.forEach((result, index) => {
    const tradeNumber = index + 1;
    
    if (!cycleData[currentCycle]) {
      cycleData[currentCycle] = { tpCount: 0, slCount: 0, profit: 0 };
    }
    
    // Traditional calculation
    const riskTraditional = riskPerCycle / cycleSize;
    const pnlTraditional = result === 'TP' ? riskTraditional * rrRatio : -riskTraditional;
    balanceTraditional += pnlTraditional;
    
    // Leveraged calculation
    let riskLeveraged = riskPerCycle / cycleSize;
    
    if (currentCycle > 1) {
      const prevCycle = currentCycle - 1;
      if (cycleData[prevCycle]) {
        const prevProfit = cycleData[prevCycle].profit;
        if (prevProfit > 0) {
          const reinvestAmount = (prevProfit * reinvestPercent) / 100;
          riskLeveraged = (riskPerCycle + reinvestAmount) / cycleSize;
        }
      }
    }
    
    const pnlLeveraged = result === 'TP' ? riskLeveraged * rrRatio : -riskLeveraged;
    balanceLeveraged += pnlLeveraged;
    
    if (result === 'TP') {
      cycleData[currentCycle].tpCount++;
    } else {
      cycleData[currentCycle].slCount++;
    }
    cycleData[currentCycle].profit += pnlLeveraged;
    
    trades.push({
      tradeNumber,
      cycle: currentCycle,
      result,
      riskTraditional,
      pnlTraditional,
      balanceTraditional,
      riskLeveraged,
      pnlLeveraged,
      balanceLeveraged,
    });
    
    tradesInCycle++;
    if (tradesInCycle >= cycleSize) {
      currentCycle++;
      tradesInCycle = 0;
    }
  });
  
  const totalTP = tradeResults.filter(r => r === 'TP').length;
  const totalSL = tradeResults.filter(r => r === 'SL').length;
  const winRate = tradeResults.length > 0 ? (totalTP / tradeResults.length) * 100 : 0;
  
  return {
    trades,
    finalBalanceTraditional: balanceTraditional,
    finalBalanceLeveraged: balanceLeveraged,
    totalProfitTraditional: balanceTraditional - accountSize,
    totalProfitLeveraged: balanceLeveraged - accountSize,
    roiTraditional: ((balanceTraditional - accountSize) / accountSize) * 100,
    roiLeveraged: ((balanceLeveraged - accountSize) / accountSize) * 100,
    totalTP,
    totalSL,
    winRate,
  };
};
