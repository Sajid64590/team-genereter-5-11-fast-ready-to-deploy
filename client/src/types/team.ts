export interface Player {
  name: string;
  type: 'red' | 'black';
  selectionPercentage?: number;
  battingOrder?: number;
  role?: 'wk' | 'batter' | 'bowler' | 'allrounder';
  captainInfo?: string;
  viceCaptainInfo?: string;
}

export interface Team {
  id: number;
  players: Player[];
  redCount: number;
  blackCount: number;
}

export interface GameData {
  redPlayers: string[];
  blackPlayers: string[];
  redPlayerPercentages?: number[];
  blackPlayerPercentages?: number[];
  redPlayerBattingOrders?: number[];
  blackPlayerBattingOrders?: number[];
  timestamp?: string;
}

export interface TeamStats {
  totalTeams: number;
  redPlayers: number;
  blackPlayers: number;
  totalCombinations: number;
}