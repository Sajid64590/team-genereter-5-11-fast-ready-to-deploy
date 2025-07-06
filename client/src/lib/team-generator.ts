import { Player, Team } from '@/types/team';

// Helper function to calculate factorial
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Helper function to calculate combinations C(n, k) = n! / (k!(n-k)!)
function combination(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;

  // Use more efficient formula to avoid large factorials
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

// Generate all possible combinations using iterative approach
function getCombinations(arr: Player[], size: number): Player[][] {
  const result: Player[][] = [];

  function backtrack(start: number, currentCombination: Player[]) {
    if (currentCombination.length === size) {
      result.push([...currentCombination]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      currentCombination.push(arr[i]);
      backtrack(i + 1, currentCombination);
      currentCombination.pop();
    }
  }

  backtrack(0, []);
  return result;
}

export function generateAllPossibleTeams(
  redPlayers: string[],
  blackPlayers: string[],
  playerPercentages: number[] = [],
  battingOrders: number[] = [],
  calculatedPercentages: {[key: string]: number} = {}
): Team[] {
  // Create unique player sets to avoid duplicates
  const uniqueRedPlayers = [...new Set(redPlayers.filter(name => name.trim().length > 0))];
  const uniqueBlackPlayers = [...new Set(blackPlayers.filter(name => name.trim().length > 0))];

  const allPlayers: Player[] = [
    ...uniqueRedPlayers.map((name, index) => {
      // Find original index for percentage lookup
      const originalIndex = redPlayers.findIndex(p => p === name);

      // First try to extract percentage from player name
      const percentageMatch = name.match(/\(r\d+,\s*([\d.]+)%\)/);
      let extractedPercentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;

      // If no rank percentage found, try to get any percentage from name
      if (!extractedPercentage) {
        const anyPercentageMatch = name.match(/([\d.]+)%/);
        if (anyPercentageMatch) {
          extractedPercentage = parseFloat(anyPercentageMatch[1]);
        }
      }

      // Get input field percentage using original index
      const inputPercentage = playerPercentages && originalIndex >= 0 ? playerPercentages[originalIndex] : 0;
      const inputBattingOrder = battingOrders && originalIndex >= 0 ? battingOrders[originalIndex] : 0;

      // Use input percentage if it's greater than 0, otherwise use extracted percentage
      const finalPercentage = inputPercentage > 0 ? inputPercentage : extractedPercentage;

      return { 
        name, 
        type: 'red' as const, 
        selectionPercentage: finalPercentage,
        battingOrder: inputBattingOrder
      };
    }),
    ...uniqueBlackPlayers.map((name, index) => {
      // Find original index for percentage lookup
      const originalIndex = blackPlayers.findIndex(p => p === name);

      // First try to extract percentage from player name
      const percentageMatch = name.match(/\(r\d+,\s*([\d.]+)%\)/);
      let extractedPercentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;

      // If no rank percentage found, try to get any percentage from name
      if (!extractedPercentage) {
        const anyPercentageMatch = name.match(/([\d.]+)%/);
        if (anyPercentageMatch) {
          extractedPercentage = parseFloat(anyPercentageMatch[1]);
        }
      }

      // Get input field percentage using original index
      const inputPercentage = playerPercentages && originalIndex >= 0 ? playerPercentages[originalIndex + 11] : 0;
      const inputBattingOrder = battingOrders && originalIndex >= 0 ? battingOrders[originalIndex + 11] : 0;

      // Use input percentage if it's greater than 0, otherwise use extracted percentage
      const finalPercentage = inputPercentage > 0 ? inputPercentage : extractedPercentage;

      return { 
        name, 
        type: 'black' as const, 
        selectionPercentage: finalPercentage,
        battingOrder: inputBattingOrder
      };
    })
  ];

  const teams: Team[] = [];
  let teamId = 1;

  // Generate all combinations of 11 players from 22 players
  const allCombinations = getCombinations(allPlayers, 11);

  for (const teamPlayersCombination of allCombinations) {
    const redCount = teamPlayersCombination.filter((p: Player) => p.type === 'red').length;
    const blackCount = teamPlayersCombination.filter((p: Player) => p.type === 'black').length;

    // Sort team players by selection percentage for captain/vice-captain assignment (highest to lowest)
    const sortedPlayers = [...teamPlayersCombination].sort((a, b) => (b.selectionPercentage || 0) - (a.selectionPercentage || 0));

    // Assign captain and vice-captain based on player percentage ranking
    const playersWithRoles = sortedPlayers.map((player, index) => {
      let captainInfo = '';
      let viceCaptainInfo = '';

      // Captain assignment: highest percentage player gets c1 count, next gets c2 count, ... lowest gets c11 count
      const cKey = `c_${index + 1}`;
      const cCount = calculatedPercentages?.[cKey] || 0;
      if (cCount > 0) {
        captainInfo = `(c${index + 1}:${cCount})`; // Display the count
      }

      // Vice-captain assignment: highest percentage player gets vc1 count, next gets vc2 count, ... lowest gets vc11 count
      const vcKey = `vc_${index + 1}`;
      const vcCount = calculatedPercentages?.[vcKey] || 0;
      if (vcCount > 0) {
        viceCaptainInfo = `(vc${index + 1}:${vcCount})`; // Display the count
      }

      return {
        ...player,
        captainInfo,
        viceCaptainInfo
      };
    });

    teams.push({
      id: teamId++,
      players: playersWithRoles,
      redCount,
      blackCount
    });
  }

  return teams;
}

export function generateRandomTeams(
  redPlayers: string[], 
  blackPlayers: string[], 
  maxTeams: number = 1000,
  calculatedPercentages: {[key: string]: number} = {},
  playerPercentages: number[] = [],
  battingOrders: number[] = [],
  filters?: {
    redPlayerRange?: {min: number, max: number},
    roleFilter?: boolean,
    searchPlayers?: string[],
    multiSearchPlayers?: string[],
    roleSpecificPlayers?: string[]
  }
): Team[] {
  // Create unique player sets to avoid duplicates
  const uniqueRedPlayers = [...new Set(redPlayers.filter(name => name.trim().length > 0))];
  const uniqueBlackPlayers = [...new Set(blackPlayers.filter(name => name.trim().length > 0))];

  const allPlayers: Player[] = [
    ...uniqueRedPlayers.map((name, index) => {
      // Find original index for percentage lookup
      const originalIndex = redPlayers.findIndex(p => p === name);

      // First try to extract percentage from player name
      const percentageMatch = name.match(/\(r\d+,\s*([\d.]+)%\)/);
      let extractedPercentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;

      // If no rank percentage found, try to get any percentage from name
      if (!extractedPercentage) {
        const anyPercentageMatch = name.match(/([\d.]+)%/);
        if (anyPercentageMatch) {
          extractedPercentage = parseFloat(anyPercentageMatch[1]);
        }
      }

      // Get input field percentage using original index
      const inputPercentage = playerPercentages && originalIndex >= 0 ? playerPercentages[originalIndex] : 0;
      const inputBattingOrder = battingOrders && originalIndex >= 0 ? battingOrders[originalIndex] : 0;

      // Use input percentage if it's greater than 0, otherwise use extracted percentage
      const finalPercentage = inputPercentage > 0 ? inputPercentage : extractedPercentage;

      return { 
        name, 
        type: 'red' as const, 
        selectionPercentage: finalPercentage,
        battingOrder: inputBattingOrder
      };
    }),
    ...uniqueBlackPlayers.map((name, index) => {
      // Find original index for percentage lookup
      const originalIndex = blackPlayers.findIndex(p => p === name);

      // First try to extract percentage from player name
      const percentageMatch = name.match(/\(r\d+,\s*([\d.]+)%\)/);
      let extractedPercentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;

      // If no rank percentage found, try to get any percentage from name
      if (!extractedPercentage) {
        const anyPercentageMatch = name.match(/([\d.]+)%/);
        if (anyPercentageMatch) {
          extractedPercentage = parseFloat(anyPercentageMatch[1]);
        }
      }

      // Get input field percentage using original index
      const inputPercentage = playerPercentages && originalIndex >= 0 ? playerPercentages[originalIndex + 11] : 0;
      const inputBattingOrder = battingOrders && originalIndex >= 0 ? battingOrders[originalIndex + 11] : 0;

      // Use input percentage if it's greater than 0, otherwise use extracted percentage
      const finalPercentage = inputPercentage > 0 ? inputPercentage : extractedPercentage;

      return { 
        name, 
        type: 'black' as const, 
        selectionPercentage: finalPercentage,
        battingOrder: inputBattingOrder
      };
    })
  ];

  // Helper function to get player role
  const getPlayerRole = (playerName: string): string | null => {
    const match = playerName.match(/\((wk|batter|bowler|allrounder)\)/);
    return match ? match[1] : null;
  };

  // Generate all combinations of 11 players from 22 players using C(22,11) formula
  const allCombinations = getCombinations(allPlayers, 11);

  // Apply filters first before generating teams
  let filteredCombinations = allCombinations;

  if (filters) {
    // Apply red player range filter
    if (filters.redPlayerRange) {
      filteredCombinations = filteredCombinations.filter(combination => {
        const redCount = combination.filter((p: Player) => p.type === 'red').length;
        return redCount >= filters.redPlayerRange!.min && redCount <= filters.redPlayerRange!.max;
      });
    }

    // Apply role filter (all roles required)
    if (filters.roleFilter) {
      filteredCombinations = filteredCombinations.filter(combination => {
        const roleCount = { wk: 0, batter: 0, bowler: 0, allrounder: 0 };
        combination.forEach(player => {
          const role = getPlayerRole(player.name);
          if (role && role in roleCount) {
            roleCount[role as keyof typeof roleCount]++;
          }
        });

        // All four roles must be present (at least 1 of each)
        return Object.values(roleCount).every(count => count >= 1);
      });
    }

    // Apply exact team search filter
    if (filters.searchPlayers && filters.searchPlayers.length === 11) {
      const searchPlayerNames = filters.searchPlayers.map(p => p.toLowerCase().trim());
      filteredCombinations = filteredCombinations.filter(combination => {
        const combinationNames = combination.map(p => p.name.toLowerCase().trim());
        return searchPlayerNames.every(name => combinationNames.includes(name));
      });
    }

    // Apply multi-player search filter
    if (filters.multiSearchPlayers && filters.multiSearchPlayers.length > 0) {
      const searchPlayerNames = filters.multiSearchPlayers.map(p => p.toLowerCase().trim());
      filteredCombinations = filteredCombinations.filter(combination => {
        const combinationNames = combination.map(p => p.name.toLowerCase().trim());
        return searchPlayerNames.every(name => combinationNames.includes(name));
      });
    }

    // Apply role-specific filter
    if (filters.roleSpecificPlayers && filters.roleSpecificPlayers.length > 0) {
      // Group selected players by their roles
      const roleGroups: {[role: string]: string[]} = {};
      filters.roleSpecificPlayers.forEach(playerName => {
        const role = getPlayerRole(playerName);
        if (role) {
          if (!roleGroups[role]) {
            roleGroups[role] = [];
          }
          roleGroups[role].push(playerName.toLowerCase().trim());
        }
      });

      filteredCombinations = filteredCombinations.filter(combination => {
        // For each role in roleGroups, check if combination has EXACTLY those players and NO OTHER players of that role
        return Object.entries(roleGroups).every(([role, selectedPlayers]) => {
          // Get all players of this role in the combination
          const combinationPlayersOfThisRole = combination
            .filter(player => getPlayerRole(player.name) === role)
            .map(player => player.name.toLowerCase().trim());

          // Check if combination has exactly the selected players of this role (no more, no less)
          if (combinationPlayersOfThisRole.length !== selectedPlayers.length) {
            return false;
          }

          // Check if all selected players are in the combination and no other player of this role exists
          return selectedPlayers.every(selectedPlayer => 
            combinationPlayersOfThisRole.includes(selectedPlayer)
          ) && combinationPlayersOfThisRole.every(combinationPlayer => 
            selectedPlayers.includes(combinationPlayer)
          );
        });
      });
    }
  }

  // Generate teams from filtered combinations
  const teams: Team[] = [];
  let teamId = 1;

  const targetCount = Math.min(maxTeams, 10000, filteredCombinations.length);
  const selectedCombinations = filteredCombinations.slice(0, targetCount);

  // Convert combinations to teams
  for (const teamPlayersCombination of selectedCombinations) {
    const redCount = teamPlayersCombination.filter((p: Player) => p.type === 'red').length;
    const blackCount = teamPlayersCombination.filter((p: Player) => p.type === 'black').length;

    // Sort team players by selection percentage for captain/vice-captain assignment (highest to lowest)
    const sortedPlayers = [...teamPlayersCombination].sort((a, b) => (b.selectionPercentage || 0) - (a.selectionPercentage || 0));

    // Assign captain and vice-captain based on player percentage ranking
    const playersWithRoles = sortedPlayers.map((player, index) => {
      let captainInfo = '';
      let viceCaptainInfo = '';

      // Captain assignment: highest percentage player gets c1 count, next gets c2 count, ... lowest gets c11 count
      const cKey = `c_${index + 1}`;
      const cCount = calculatedPercentages?.[cKey] || 0;
      if (cCount > 0) {
        captainInfo = `(c${index + 1}:${cCount})`; // Display the count
      }

      // Vice-captain assignment: highest percentage player gets vc1 count, next gets vc2 count, ... lowest gets vc11 count
      const vcKey = `vc_${index + 1}`;
      const vcCount = calculatedPercentages?.[vcKey] || 0;
      if (vcCount > 0) {
        viceCaptainInfo = `(vc${index + 1}:${vcCount})`; // Display the count
      }

      return {
        ...player,
        captainInfo,
        viceCaptainInfo
      };
    });

    teams.push({
      id: teamId++,
      players: playersWithRoles,
      redCount,
      blackCount
    });
  }

  return teams;
}

export function calculatePossibleCombinations(redCount: number, blackCount: number): number {
  if (redCount === 0 || blackCount === 0) return 0;

  // Calculate C(22,11) using combination formula
  return combination(22, 11);
}

export function validatePlayers(redPlayers: string[], blackPlayers: string[]): boolean {
  const validRedPlayers = redPlayers.filter(name => name.trim().length > 0);
  const validBlackPlayers = blackPlayers.filter(name => name.trim().length > 0);

  // Check for valid names (allow letters, numbers, percentages, dots, spaces)
  const isValidName = (name: string) => {
    const cleanName = name.split(' (')[0].trim(); // Remove role part
    return cleanName.length > 0 && /^[a-zA-Z0-9\s\.%\-_]+$/.test(cleanName);
  };

  // Check if all names are valid
  const validRedCount = validRedPlayers.filter(name => isValidName(name)).length;
  const validBlackCount = validBlackPlayers.filter(name => isValidName(name)).length;

  // Check for duplicates within red players
  const uniqueRedPlayers = new Set(validRedPlayers.map(name => name.split(' (')[0].trim().toLowerCase()));
  const uniqueBlackPlayers = new Set(validBlackPlayers.map(name => name.split(' (')[0].trim().toLowerCase()));

  // Check for duplicates between red and black players
  const allPlayerNames = [...validRedPlayers, ...validBlackPlayers].map(name => name.split(' (')[0].trim().toLowerCase());
  const uniqueAllPlayers = new Set(allPlayerNames);

  // Validation conditions:
  // 1. Must have exactly 11 valid red and 11 valid black players
  // 2. No duplicate names within red players
  // 3. No duplicate names within black players  
  // 4. No duplicate names between red and black players
  return validRedCount === 11 && 
         validBlackCount === 11 && 
         uniqueRedPlayers.size === validRedCount &&
         uniqueBlackPlayers.size === validBlackCount &&
         uniqueAllPlayers.size === allPlayerNames.length;
}