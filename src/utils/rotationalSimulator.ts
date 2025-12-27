export interface RotationalConfig {
  numberOfAccounts: number;
  initialCapitalPerAccount: number;
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

export interface RotationalState {
  accounts: number[];
  currentTurnIndex: number;
  trades: RotationalTrade[];
  totalBalance: number;
  totalTP: number;
  totalSL: number;
  winRate: number;
}

export const initializeRotationalState = (config: RotationalConfig): RotationalState => {
  const accounts = Array(config.numberOfAccounts).fill(config.initialCapitalPerAccount);
  return {
    accounts,
    currentTurnIndex: 0,
    trades: [],
    totalBalance: accounts.reduce((sum, bal) => sum + bal, 0),
    totalTP: 0,
    totalSL: 0,
    winRate: 0,
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

  return {
    accounts: newAccounts,
    currentTurnIndex: lastTrade.accountIndex,
    trades: newTrades,
    totalBalance: newAccounts.reduce((sum, bal) => sum + bal, 0),
    totalTP,
    totalSL,
    winRate,
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
