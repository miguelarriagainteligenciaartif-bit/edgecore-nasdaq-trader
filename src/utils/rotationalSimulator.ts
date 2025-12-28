export interface RotationalConfig {
  numberOfAccounts: number;
  initialBalances: number[]; // Balance inicial de cada cuenta
  riskPerTrade: number;
  riskRewardRatio: number; // e.g., 2 means 1:2 (win 2x risk)
}

export type RotationalTradeResult = 'TP' | 'SL';

export interface RotationalTrade {
  tradeNumber: number;
  result: RotationalTradeResult;
  accountIndex: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: Date;
}

export interface AccountDrawdown {
  current: number; // Current drawdown from peak
  max: number; // Maximum drawdown ever reached
  peak: number; // Highest balance reached
}

export interface RotationalState {
  accounts: number[];
  currentTurnIndex: number;
  trades: RotationalTrade[];
  totalBalance: number;
  totalTP: number;
  totalSL: number;
  winRate: number;
  accountDrawdowns: AccountDrawdown[]; // Drawdown tracking per account
}

export const initializeRotationalState = (config: RotationalConfig): RotationalState => {
  // Usar los balances individuales definidos por el usuario
  const accounts = [...config.initialBalances];
  const accountDrawdowns: AccountDrawdown[] = accounts.map(balance => ({
    current: 0,
    max: 0,
    peak: balance,
  }));
  
  return {
    accounts,
    currentTurnIndex: 0,
    trades: [],
    totalBalance: accounts.reduce((sum, bal) => sum + bal, 0),
    totalTP: 0,
    totalSL: 0,
    winRate: 0,
    accountDrawdowns,
  };
};

export const processTrade = (
  state: RotationalState,
  result: RotationalTradeResult,
  riskPerTrade: number,
  riskRewardRatio: number = 1
): RotationalState => {
  // TP gana riskPerTrade * ratio, SL pierde riskPerTrade
  const amount = result === 'TP' ? riskPerTrade * riskRewardRatio : -riskPerTrade;
  const accountIndex = state.currentTurnIndex;
  const balanceBefore = state.accounts[accountIndex];
  const balanceAfter = balanceBefore + amount;

  const newAccounts = [...state.accounts];
  newAccounts[accountIndex] = balanceAfter;

  // Update drawdown for this account
  const newAccountDrawdowns = [...state.accountDrawdowns];
  const currentDrawdownData = { ...newAccountDrawdowns[accountIndex] };
  
  if (balanceAfter > currentDrawdownData.peak) {
    // New peak reached
    currentDrawdownData.peak = balanceAfter;
    currentDrawdownData.current = 0;
  } else {
    // Calculate current drawdown from peak
    currentDrawdownData.current = currentDrawdownData.peak - balanceAfter;
    if (currentDrawdownData.current > currentDrawdownData.max) {
      currentDrawdownData.max = currentDrawdownData.current;
    }
  }
  newAccountDrawdowns[accountIndex] = currentDrawdownData;

  const newTrade: RotationalTrade = {
    tradeNumber: state.trades.length + 1,
    result,
    accountIndex,
    amount,
    balanceBefore,
    balanceAfter,
    timestamp: new Date(),
  };

  const newTrades = [...state.trades, newTrade];
  const nextTurnIndex = (state.currentTurnIndex + 1) % state.accounts.length;

  const totalTP = result === 'TP' ? state.totalTP + 1 : state.totalTP;
  const totalSL = result === 'SL' ? state.totalSL + 1 : state.totalSL;
  const totalTrades = totalTP + totalSL;
  const winRate = totalTrades > 0 ? (totalTP / totalTrades) * 100 : 0;

  return {
    accounts: newAccounts,
    currentTurnIndex: nextTurnIndex,
    trades: newTrades,
    totalBalance: newAccounts.reduce((sum, bal) => sum + bal, 0),
    totalTP,
    totalSL,
    winRate,
    accountDrawdowns: newAccountDrawdowns,
  };
};

export const undoLastTrade = (state: RotationalState): RotationalState => {
  if (state.trades.length === 0) return state;

  const lastTrade = state.trades[state.trades.length - 1];
  const newAccounts = [...state.accounts];
  newAccounts[lastTrade.accountIndex] = lastTrade.balanceBefore;

  const newTrades = state.trades.slice(0, -1);
  const totalTP = lastTrade.result === 'TP' ? state.totalTP - 1 : state.totalTP;
  const totalSL = lastTrade.result === 'SL' ? state.totalSL - 1 : state.totalSL;
  const totalTrades = totalTP + totalSL;
  const winRate = totalTrades > 0 ? (totalTP / totalTrades) * 100 : 0;

  // Recalculate drawdowns from scratch for affected account
  const newAccountDrawdowns = state.accountDrawdowns.map((dd, idx) => {
    if (idx !== lastTrade.accountIndex) return dd;
    
    // Find initial balance for this account
    const initialBalance = lastTrade.balanceBefore; // This is approximate, we'd need config
    let peak = initialBalance;
    let maxDrawdown = 0;
    
    // Recalculate from trades
    let currentBalance = initialBalance;
    for (const trade of newTrades) {
      if (trade.accountIndex === idx) {
        currentBalance = trade.balanceAfter;
        if (currentBalance > peak) {
          peak = currentBalance;
        } else {
          const dd = peak - currentBalance;
          if (dd > maxDrawdown) maxDrawdown = dd;
        }
      }
    }
    
    return {
      peak,
      current: Math.max(0, peak - newAccounts[idx]),
      max: maxDrawdown,
    };
  });

  return {
    accounts: newAccounts,
    currentTurnIndex: lastTrade.accountIndex,
    trades: newTrades,
    totalBalance: newAccounts.reduce((sum, bal) => sum + bal, 0),
    totalTP,
    totalSL,
    winRate,
    accountDrawdowns: newAccountDrawdowns,
  };
};

// Process multiple trades at once (for batch simulation)
export const processMultipleTrades = (
  initialState: RotationalState,
  results: RotationalTradeResult[],
  riskPerTrade: number,
  riskRewardRatio: number = 1
): RotationalState => {
  let state = initialState;
  for (const result of results) {
    state = processTrade(state, result, riskPerTrade, riskRewardRatio);
  }
  return state;
};
