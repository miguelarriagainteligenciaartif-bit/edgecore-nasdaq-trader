// Types for Group-based Rotational Simulator

export type BrokerType = 'cfd' | 'futures';

export interface AccountConfig {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  profitTarget: number; // % de profit para retiro
  withdrawals: Withdrawal[];
}

export interface Withdrawal {
  date: Date;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface GroupConfig {
  id: string;
  name: string;
  brokerType: BrokerType;
  brokerName: string; // e.g., "FTMO", "Apex"
  accounts: AccountConfig[];
  // Risk per trade in dollars (same for all accounts in this group)
  riskPerTrade: number; // e.g., 375 for Futures, 800 for CFD
  // Futuros specific
  bufferRequired?: number; // Colchón requerido (ej: 2600 para Apex)
  trailingStopBuffer?: number; // Buffer donde se queda el trailing (ej: 100)
}

export interface GroupRotationalConfig {
  groups: GroupConfig[];
  riskRewardRatio: number;
  profitTargetPercent: number; // % objetivo para retiro
}

export interface GroupTrade {
  tradeNumber: number;
  groupId: string;
  groupName: string;
  result: 'TP' | 'SL';
  riskAmount: number;
  profitLoss: number;
  accountsAffected: {
    accountId: string;
    accountName: string;
    balanceBefore: number;
    balanceAfter: number;
  }[];
  timestamp: Date;
}

export interface ProjectedWithdrawal {
  groupId: string;
  groupName: string;
  accountId: string;
  accountName: string;
  projectedDate: Date;
  projectedTradeNumber: number;
  withdrawalAmount: number;
  balanceAfterWithdrawal: number;
}

export interface GroupRotationalState {
  config: GroupRotationalConfig;
  groups: GroupConfig[];
  currentTurnByBroker: { [brokerType: string]: number }; // Índice del grupo actual por tipo de broker
  trades: GroupTrade[];
  totalTP: number;
  totalSL: number;
  winRate: number;
  projectedWithdrawals: ProjectedWithdrawal[];
  totalWithdrawn: number;
}

// Crear ID único
const generateId = () => Math.random().toString(36).substr(2, 9);

// Inicializar estado
export const initializeGroupState = (config: GroupRotationalConfig): GroupRotationalState => {
  const currentTurnByBroker: { [key: string]: number } = {};
  
  // Inicializar turno para cada tipo de broker
  config.groups.forEach(group => {
    if (!(group.brokerType in currentTurnByBroker)) {
      currentTurnByBroker[group.brokerType] = 0;
    }
  });

  return {
    config,
    groups: config.groups.map(g => ({
      ...g,
      accounts: g.accounts.map(a => ({
        ...a,
        currentBalance: a.initialBalance,
        withdrawals: [],
      })),
    })),
    currentTurnByBroker,
    trades: [],
    totalTP: 0,
    totalSL: 0,
    winRate: 0,
    projectedWithdrawals: [],
    totalWithdrawn: 0,
  };
};

// Calculate risk amount based on group's fixed risk (same for all accounts in group)
const calculateRiskAmount = (group: GroupConfig): number => {
  return group.riskPerTrade;
};

// Procesar retiro según tipo de broker
const processWithdrawal = (
  account: AccountConfig,
  group: GroupConfig
): { newBalance: number; withdrawalAmount: number } => {
  const profit = account.currentBalance - account.initialBalance;
  
  if (group.brokerType === 'cfd') {
    // CFD: Retira todo el profit, balance vuelve al inicial
    return {
      newBalance: account.initialBalance,
      withdrawalAmount: profit,
    };
  } else {
    // Futuros (Apex): Mantener buffer, retirar el resto
    const buffer = group.bufferRequired || 2600;
    const trailingBuffer = group.trailingStopBuffer || 100;
    const targetBalance = account.initialBalance + buffer;
    
    if (account.currentBalance > targetBalance) {
      // Puede retirar: balance actual - (inicial + trailing buffer)
      const withdrawableAmount = account.currentBalance - (account.initialBalance + trailingBuffer);
      return {
        newBalance: account.initialBalance + trailingBuffer,
        withdrawalAmount: Math.max(0, withdrawableAmount),
      };
    }
    return { newBalance: account.currentBalance, withdrawalAmount: 0 };
  }
};

// Verificar si cuenta alcanzó objetivo de retiro
const checkWithdrawalTarget = (
  account: AccountConfig,
  profitTargetPercent: number
): boolean => {
  const profitPercent = ((account.currentBalance - account.initialBalance) / account.initialBalance) * 100;
  return profitPercent >= profitTargetPercent;
};

// Procesar un trade para un grupo
export const processGroupTrade = (
  state: GroupRotationalState,
  brokerType: BrokerType,
  result: 'TP' | 'SL'
): GroupRotationalState => {
  const groupsOfType = state.groups.filter(g => g.brokerType === brokerType);
  if (groupsOfType.length === 0) return state;

  const currentIndex = state.currentTurnByBroker[brokerType] || 0;
  const groupIndex = state.groups.findIndex(g => g.id === groupsOfType[currentIndex % groupsOfType.length].id);
  const group = state.groups[groupIndex];

  // Risk is fixed per group (same for all accounts in this group)
  const baseRisk = calculateRiskAmount(group);
  const profitLoss = result === 'TP' 
    ? baseRisk * state.config.riskRewardRatio 
    : -baseRisk;

  // Apply result to all accounts in the group (same dollar amount for all)
  const accountsAffected = group.accounts.map(account => {
    const accountPL = result === 'TP' 
      ? baseRisk * state.config.riskRewardRatio 
      : -baseRisk;
    
    return {
      accountId: account.id,
      accountName: account.name,
      balanceBefore: account.currentBalance,
      balanceAfter: account.currentBalance + accountPL,
    };
  });

  // Crear nuevo trade
  const newTrade: GroupTrade = {
    tradeNumber: state.trades.length + 1,
    groupId: group.id,
    groupName: group.name,
    result,
    riskAmount: baseRisk,
    profitLoss,
    accountsAffected,
    timestamp: new Date(),
  };

  // Actualizar balances de las cuentas
  const newGroups = state.groups.map((g, idx) => {
    if (idx !== groupIndex) return g;
    
    return {
      ...g,
      accounts: g.accounts.map(account => {
        const affected = accountsAffected.find(a => a.accountId === account.id);
        if (!affected) return account;
        
        let newAccount = {
          ...account,
          currentBalance: affected.balanceAfter,
        };

        // Verificar si alcanzó objetivo de retiro
        if (checkWithdrawalTarget(newAccount, state.config.profitTargetPercent)) {
          const { newBalance, withdrawalAmount } = processWithdrawal(newAccount, g);
          if (withdrawalAmount > 0) {
            newAccount = {
              ...newAccount,
              currentBalance: newBalance,
              withdrawals: [
                ...newAccount.withdrawals,
                {
                  date: new Date(),
                  amount: withdrawalAmount,
                  balanceBefore: affected.balanceAfter,
                  balanceAfter: newBalance,
                },
              ],
            };
          }
        }

        return newAccount;
      }),
    };
  });

  // Actualizar turno del broker
  const newCurrentTurnByBroker = {
    ...state.currentTurnByBroker,
    [brokerType]: (currentIndex + 1) % groupsOfType.length,
  };

  // Calcular estadísticas
  const totalTP = result === 'TP' ? state.totalTP + 1 : state.totalTP;
  const totalSL = result === 'SL' ? state.totalSL + 1 : state.totalSL;
  const totalTrades = totalTP + totalSL;
  const winRate = totalTrades > 0 ? (totalTP / totalTrades) * 100 : 0;

  // Calcular total retirado
  const totalWithdrawn = newGroups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, acc) => 
      accSum + acc.withdrawals.reduce((wSum, w) => wSum + w.amount, 0), 0), 0);

  return {
    ...state,
    groups: newGroups,
    currentTurnByBroker: newCurrentTurnByBroker,
    trades: [...state.trades, newTrade],
    totalTP,
    totalSL,
    winRate,
    totalWithdrawn,
  };
};

// Deshacer último trade
export const undoGroupTrade = (state: GroupRotationalState): GroupRotationalState => {
  if (state.trades.length === 0) return state;

  const lastTrade = state.trades[state.trades.length - 1];
  const groupIndex = state.groups.findIndex(g => g.id === lastTrade.groupId);
  
  // Restaurar balances
  const newGroups = state.groups.map((g, idx) => {
    if (idx !== groupIndex) return g;
    
    return {
      ...g,
      accounts: g.accounts.map(account => {
        const affected = lastTrade.accountsAffected.find(a => a.accountId === account.id);
        if (!affected) return account;
        
        // También revertir cualquier retiro que se haya hecho
        const lastWithdrawal = account.withdrawals[account.withdrawals.length - 1];
        if (lastWithdrawal && lastWithdrawal.balanceBefore === affected.balanceAfter) {
          return {
            ...account,
            currentBalance: affected.balanceBefore,
            withdrawals: account.withdrawals.slice(0, -1),
          };
        }
        
        return {
          ...account,
          currentBalance: affected.balanceBefore,
        };
      }),
    };
  });

  // Revertir turno del broker
  const brokerType = state.groups[groupIndex].brokerType;
  const groupsOfType = state.groups.filter(g => g.brokerType === brokerType);
  const currentIndex = state.currentTurnByBroker[brokerType] || 0;
  const newIndex = currentIndex === 0 ? groupsOfType.length - 1 : currentIndex - 1;

  const newCurrentTurnByBroker = {
    ...state.currentTurnByBroker,
    [brokerType]: newIndex,
  };

  // Recalcular estadísticas
  const totalTP = lastTrade.result === 'TP' ? state.totalTP - 1 : state.totalTP;
  const totalSL = lastTrade.result === 'SL' ? state.totalSL - 1 : state.totalSL;
  const totalTrades = totalTP + totalSL;
  const winRate = totalTrades > 0 ? (totalTP / totalTrades) * 100 : 0;

  const totalWithdrawn = newGroups.reduce((sum, g) => 
    sum + g.accounts.reduce((accSum, acc) => 
      accSum + acc.withdrawals.reduce((wSum, w) => wSum + w.amount, 0), 0), 0);

  return {
    ...state,
    groups: newGroups,
    currentTurnByBroker: newCurrentTurnByBroker,
    trades: state.trades.slice(0, -1),
    totalTP,
    totalSL,
    winRate,
    totalWithdrawn,
  };
};

// Proyectar retiros futuros basado en winrate esperado
export const projectWithdrawals = (
  state: GroupRotationalState,
  expectedWinRate: number,
  tradesToProject: number
): ProjectedWithdrawal[] => {
  const projections: ProjectedWithdrawal[] = [];
  let simulatedState = { ...state };

  for (let i = 0; i < tradesToProject; i++) {
    // Simular trades para cada tipo de broker
    const brokerTypes = [...new Set(state.groups.map(g => g.brokerType))];
    
    for (const brokerType of brokerTypes) {
      const result = Math.random() * 100 < expectedWinRate ? 'TP' : 'SL';
      
      // Guardar balances antes
      const groupsOfType = simulatedState.groups.filter(g => g.brokerType === brokerType);
      const currentIndex = simulatedState.currentTurnByBroker[brokerType] || 0;
      const group = groupsOfType[currentIndex % groupsOfType.length];
      
      if (group) {
        const balancesBefore = group.accounts.map(a => ({ id: a.id, balance: a.currentBalance }));
        
        simulatedState = processGroupTrade(simulatedState, brokerType, result);
        
        // Verificar si hubo retiros
        const updatedGroup = simulatedState.groups.find(g => g.id === group.id);
        if (updatedGroup) {
          updatedGroup.accounts.forEach((account, idx) => {
            const before = balancesBefore.find(b => b.id === account.id);
            if (before && account.withdrawals.length > group.accounts[idx].withdrawals.length) {
              const lastWithdrawal = account.withdrawals[account.withdrawals.length - 1];
              projections.push({
                groupId: group.id,
                groupName: group.name,
                accountId: account.id,
                accountName: account.name,
                projectedDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
                projectedTradeNumber: state.trades.length + i + 1,
                withdrawalAmount: lastWithdrawal.amount,
                balanceAfterWithdrawal: lastWithdrawal.balanceAfter,
              });
            }
          });
        }
      }
    }
  }

  return projections;
};

// Helper para crear configuración inicial de ejemplo
export const createDefaultConfig = (): GroupRotationalConfig => {
  return {
    groups: [
      {
        id: generateId(),
        name: 'FTMO Grupo 1',
        brokerType: 'cfd',
        brokerName: 'FTMO',
        riskPerTrade: 800, // $800 risk per trade in CFD
        accounts: [
          { id: generateId(), name: 'FTMO 100K #1', initialBalance: 100000, currentBalance: 100000, profitTarget: 10, withdrawals: [] },
          { id: generateId(), name: 'FTMO 100K #2', initialBalance: 100000, currentBalance: 100000, profitTarget: 10, withdrawals: [] },
        ],
      },
      {
        id: generateId(),
        name: 'Apex Grupo 1',
        brokerType: 'futures',
        brokerName: 'Apex',
        riskPerTrade: 375, // $375 risk per trade in Futures
        bufferRequired: 2600,
        trailingStopBuffer: 100,
        accounts: [
          { id: generateId(), name: 'Apex 50K #1', initialBalance: 50000, currentBalance: 50000, profitTarget: 10, withdrawals: [] },
          { id: generateId(), name: 'Apex 50K #2', initialBalance: 50000, currentBalance: 50000, profitTarget: 10, withdrawals: [] },
          { id: generateId(), name: 'Apex 50K #3', initialBalance: 50000, currentBalance: 50000, profitTarget: 10, withdrawals: [] },
        ],
      },
    ],
    riskRewardRatio: 2,
    profitTargetPercent: 10,
  };
};

// Obtener resumen por broker
export const getBrokerSummary = (state: GroupRotationalState) => {
  const summary: { [key: string]: { 
    totalBalance: number; 
    totalInitial: number; 
    totalWithdrawn: number;
    groups: number;
    accounts: number;
  }} = {};

  state.groups.forEach(group => {
    if (!summary[group.brokerName]) {
      summary[group.brokerName] = {
        totalBalance: 0,
        totalInitial: 0,
        totalWithdrawn: 0,
        groups: 0,
        accounts: 0,
      };
    }
    
    summary[group.brokerName].groups += 1;
    summary[group.brokerName].accounts += group.accounts.length;
    
    group.accounts.forEach(account => {
      summary[group.brokerName].totalBalance += account.currentBalance;
      summary[group.brokerName].totalInitial += account.initialBalance;
      summary[group.brokerName].totalWithdrawn += account.withdrawals.reduce((sum, w) => sum + w.amount, 0);
    });
  });

  return summary;
};
