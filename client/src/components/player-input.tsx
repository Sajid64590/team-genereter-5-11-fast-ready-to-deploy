import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shuffle, Save, FolderOpen, Users } from "lucide-react";

const roles = [
  { value: '', label: 'Select Role' },
  { value: 'wk', label: 'WK (Wicket Keeper)' },
  { value: 'batter', label: 'Batter' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'allrounder', label: 'All-rounder' }
];

interface PlayerInputProps {
  redPlayers: string[];
  blackPlayers: string[];
  redPlayerPercentages: number[];
  blackPlayerPercentages: number[];
  redPlayerBattingOrders: number[];
  blackPlayerBattingOrders: number[];
  onPlayerChange: (type: 'red' | 'black', index: number, value: string) => void;
  onPlayerRoleChange: (type: 'red' | 'black', index: number, role: string) => void;
  onPlayerPercentageChange: (type: 'red' | 'black', index: number, value: number) => void;
  onPlayerBattingOrderChange: (type: 'red' | 'black', index: number, value: number) => void;
  onGenerateRandomTeams: () => void;
  onGenerateAllTeams: () => void;
  onSave: () => void;
  onLoadClick: () => void;
}

export default function PlayerInput({
  redPlayers,
  blackPlayers,
  redPlayerPercentages,
  blackPlayerPercentages,
  redPlayerBattingOrders,
  blackPlayerBattingOrders,
  onPlayerChange,
  onPlayerRoleChange,
  onPlayerPercentageChange,
  onPlayerBattingOrderChange,
  onGenerateRandomTeams,
  onGenerateAllTeams,
  onSave,
  onLoadClick
}: PlayerInputProps) {
  
  const getPlayerName = (playerString: string): string => {
    return playerString.split(' (')[0];
  };

  const getPlayerRole = (playerString: string): string => {
    // First check for standard roles
    const roleMatch = playerString.match(/\((wk|batter|bowler|allrounder)\)/);
    if (roleMatch) {
      return roleMatch[1];
    }
    
    // If no standard role found, return empty string
    return '';
  };

  const handlePlayerNameInput = (value: string, type: 'red' | 'black', index: number) => {
    // Allow letters, numbers, spaces, dots, percentages and common special characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\.%\-_\(\),]/g, '');
    
    const currentPlayer = type === 'red' ? redPlayers[index] : blackPlayers[index];
    const currentRole = getPlayerRole(currentPlayer);
    
    // Check if the input already contains rank and percentage information
    const hasRankInfo = sanitizedValue.includes('(r') && sanitizedValue.includes('%');
    
    // If user is typing and the input contains full updated format, preserve it as is
    if (hasRankInfo) {
      onPlayerChange(type, index, sanitizedValue);
      return;
    }
    
    let newValue = sanitizedValue;
    
    // If no rank info and has a role, preserve the role
    if (!hasRankInfo && currentRole) {
      const baseName = sanitizedValue.split(' (')[0];
      newValue = `${baseName} (${currentRole})`;
    }
    
    onPlayerChange(type, index, newValue);
  };
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">खिलाड़ी का नाम दर्ज करें</h2>
      
      {/* Red Team Players */}
      <div className="mb-8">
        <h3 className="text-lg font-medium player-red mb-4 flex items-center">
          <span className="w-4 h-4 bg-player-red rounded-full mr-2"></span>
          Red Team (11 Players)
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {redPlayers.map((player, index) => (
            <div key={`red-${index}`} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder={`Player ${index + 1} name (e.g., Y Jaiswal)`}
                value={getPlayerName(player)}
                onChange={(e) => handlePlayerNameInput(e.target.value, 'red', index)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Selection %"
                value={redPlayerPercentages[index]}
                onChange={(e) => onPlayerPercentageChange('red', index, parseFloat(e.target.value) || 0)}
                className="w-24"
                step="0.01"
                min="0"
                max="100"
              />
              <Input
                type="number"
                placeholder="Batting Order"
                value={redPlayerBattingOrders[index]}
                onChange={(e) => onPlayerBattingOrderChange('red', index, parseInt(e.target.value) || 0)}
                className="w-24"
                min="0"
                max="11"
              />
              <select
                value={getPlayerRole(player)}
                onChange={(e) => onPlayerRoleChange('red', index, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Black Team Players */}
      <div className="mb-6">
        <h3 className="text-lg font-medium player-black mb-4 flex items-center">
          <span className="w-4 h-4 bg-player-black rounded-full mr-2"></span>
          Black Team (11 Players)
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {blackPlayers.map((player, index) => (
            <div key={`black-${index}`} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder={`Player ${index + 1} name (e.g., Y Jaiswal)`}
                value={getPlayerName(player)}
                onChange={(e) => handlePlayerNameInput(e.target.value, 'black', index)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Selection %"
                value={blackPlayerPercentages[index]}
                onChange={(e) => onPlayerPercentageChange('black', index, parseFloat(e.target.value) || 0)}
                className="w-24"
                step="0.01"
                min="0"
                max="100"
              />
              <Input
                type="number"
                placeholder="Batting Order"
                value={blackPlayerBattingOrders[index]}
                onChange={(e) => onPlayerBattingOrderChange('black', index, parseInt(e.target.value) || 0)}
                className="w-24"
                min="0"
                max="11"
              />
              <select
                value={getPlayerRole(player)}
                onChange={(e) => onPlayerRoleChange('black', index, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={onGenerateRandomTeams}
          className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Random Teams
        </Button>
        <Button 
          onClick={onGenerateAllTeams}
          className="flex-1 min-w-[140px] bg-purple-600 hover:bg-purple-700"
        >
          <Users className="w-4 h-4 mr-2" />
          All Combinations
        </Button>
        <Button 
          onClick={onSave}
          variant="outline"
          className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button 
          onClick={onLoadClick}
          variant="outline"
          className="flex-1 min-w-[100px] bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          Load
        </Button>
      </div>
    </Card>
  );
}
