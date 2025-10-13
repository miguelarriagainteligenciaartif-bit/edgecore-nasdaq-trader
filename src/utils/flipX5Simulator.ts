export interface FlipConfig {
  accountSize: number;
  cycleSize: number;
  riskPerCycle: number;
  rrRatio: number;
  reinvestPercent: number;
  useFixedDollars?: boolean; // Si es true, usa riskPerCycle como dólares fijos
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
  const { accountSize, cycleSize, riskPerCycle, rrRatio, reinvestPercent, useFixedDollars = false } = config;
  
  let balanceTraditional = accountSize;
  let balanceLeveraged = accountSize;
  
  const trades: TradeRow[] = [];
  const cycleData: { [key: number]: { tpCount: number; slCount: number; profit: number } } = {};
  
  let currentCycle = 1;
  let tradesInCycle = 0;
  let previousTradeProfit = 0;
  let previousTradeResult: TradeResult | null = null;
  
  tradeResults.forEach((result, index) => {
    const tradeNumber = index + 1;
    
    if (!cycleData[currentCycle]) {
      cycleData[currentCycle] = { tpCount: 0, slCount: 0, profit: 0 };
    }
    
    // Traditional calculation
    let riskTraditional: number;
    let pnlTraditional: number;
    
    if (useFixedDollars) {
      // Modo dólares fijos: usa riskPerCycle como el monto fijo en dólares
      riskTraditional = riskPerCycle;
      pnlTraditional = result === 'TP' ? riskTraditional * rrRatio : -riskTraditional;
    } else {
      // Modo porcentaje: calcula basado en el balance actual
      riskTraditional = riskPerCycle / cycleSize;
      pnlTraditional = result === 'TP' ? riskTraditional * rrRatio : -riskTraditional;
    }
    
    balanceTraditional += pnlTraditional;
    
    // Leveraged calculation
    let riskLeveraged: number;
    
    if (useFixedDollars) {
      // Modo dólares fijos
      riskLeveraged = riskPerCycle;
      
      // Si es el segundo trade del ciclo Y el anterior fue TP, aplicar reinversión
      if (tradesInCycle === 1 && previousTradeResult === 'TP' && previousTradeProfit > 0) {
        const reinvestAmount = (previousTradeProfit * reinvestPercent) / 100;
        riskLeveraged = riskPerCycle + reinvestAmount;
      }
    } else {
      // Modo porcentaje
      riskLeveraged = riskPerCycle / cycleSize;
      
      // Si es el segundo trade del ciclo Y el anterior fue TP, aplicar reinversión
      if (tradesInCycle === 1 && previousTradeResult === 'TP' && previousTradeProfit > 0) {
        const reinvestAmount = (previousTradeProfit * reinvestPercent) / 100;
        riskLeveraged = (riskPerCycle / cycleSize) + reinvestAmount;
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
    
    // Guardar el resultado y profit del trade actual para el siguiente
    previousTradeResult = result;
    previousTradeProfit = pnlLeveraged;
    
    tradesInCycle++;
    if (tradesInCycle >= cycleSize) {
      currentCycle++;
      tradesInCycle = 0;
      previousTradeProfit = 0;
      previousTradeResult = null;
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
