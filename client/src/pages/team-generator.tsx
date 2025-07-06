import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerInput from "@/components/player-input";
import TeamDisplay from "@/components/team-display";
import SaveModal from "@/components/save-modal";
import LoadModal from "@/components/load-modal";
import { Team, GameData, TeamStats } from "@/types/team";
import { generateRandomTeams, generateAllPossibleTeams, calculatePossibleCombinations, validatePlayers } from "@/lib/team-generator";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Filter, Users, Search, Settings, Target } from "lucide-react";

export default function TeamGenerator() {
  const [redPlayers, setRedPlayers] = useState<string[]>(Array(11).fill(''));
  const [blackPlayers, setBlackPlayers] = useState<string[]>(Array(11).fill(''));
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [searchPlayers, setSearchPlayers] = useState<string[]>([]);
  const [multiSearchPlayers, setMultiSearchPlayers] = useState<string[]>([]);
  const [redPlayerRange, setRedPlayerRange] = useState<{min: number, max: number}>({min: 0, max: 11});
  const [roleSpecificPlayers, setRoleSpecificPlayers] = useState<string[]>([]);

  const [activeFilters, setActiveFilters] = useState<{search: boolean, range: boolean, role: boolean, multiSearch: boolean, roleSpecific: boolean}>({search: false, range: false, role: false, multiSearch: false, roleSpecific: false});

  // New state for filter selection mode
  const [showFilterSelection, setShowFilterSelection] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{search: boolean, range: boolean, role: boolean, multiSearch: boolean, roleSpecific: boolean}>({search: false, range: false, role: false, multiSearch: false, roleSpecific: false});

  // New state for percentage functionality
  const [redPlayerPercentages, setRedPlayerPercentages] = useState<number[]>(Array(11).fill(0));
  const [blackPlayerPercentages, setBlackPlayerPercentages] = useState<number[]>(Array(11).fill(0));
  const [redPlayerBattingOrders, setRedPlayerBattingOrders] = useState<number[]>(Array(11).fill(0));
  const [blackPlayerBattingOrders, setBlackPlayerBattingOrders] = useState<number[]>(Array(11).fill(0));
  const [playerRanks, setPlayerRanks] = useState<{[key: string]: number}>({});
  const [rankTableRows, setRankTableRows] = useState<{[key: string]: string}[]>([
    {p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: '', p11: '', c: '', vc: ''}
  ]);
  const [calculatedPercentages, setCalculatedPercentages] = useState<{[key: string]: number}>({});
  const [currentFilteredCount, setCurrentFilteredCount] = useState<number>(0);
  const [showPasteJsonDialog, setShowPasteJsonDialog] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [showBulkPasteDialog, setShowBulkPasteDialog] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [showDataOverrideDialog, setShowDataOverrideDialog] = useState(false);
  const [pendingJsonData, setPendingJsonData] = useState<any[]>([]);

  const { toast } = useToast();

  // Load data from localStorage on mount
  React.useEffect(() => {
    const savedPercentages = localStorage.getItem('calculatedPercentages');
    const savedRanks = localStorage.getItem('playerRanks');
    const savedTableRows = localStorage.getItem('rankTableRows');

    if (savedPercentages) {
      setCalculatedPercentages(JSON.parse(savedPercentages));
    }
    if (savedRanks) {
      setPlayerRanks(JSON.parse(savedRanks));
    }
    if (savedTableRows) {
      setRankTableRows(JSON.parse(savedTableRows));
    }
  }, []);

  const assignRandomRoles = () => {
    const roles = ['wk', 'batter', 'bowler', 'allrounder'];

    // Assign roles to red players
    const newRedPlayers = redPlayers.map(name => {
      if (name.trim().length > 0) {
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        return name.includes('(') ? name : `${name} (${randomRole})`;
      }
      return name;
    });

    // Assign roles to black players
    const newBlackPlayers = blackPlayers.map(name => {
      if (name.trim().length > 0) {
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        return name.includes('(') ? name : `${name} (${randomRole})`;
      }
      return name;
    });

    setRedPlayers(newRedPlayers);
    setBlackPlayers(newBlackPlayers);

    toast({
      title: "Roles Assigned",
      description: "सभी players को random roles assign कर दिए गए",
    });
  };

  const getPlayerRole = (playerName: string): string | null => {
    const match = playerName.match(/\((wk|batter|bowler|allrounder)\)/);
    return match ? match[1] : null;
  };

  const handlePlayerChange = (type: 'red' | 'black', index: number, value: string) => {
    if (type === 'red') {
      const newRedPlayers = [...redPlayers];
      newRedPlayers[index] = value;
      setRedPlayers(newRedPlayers);
    } else {
      const newBlackPlayers = [...blackPlayers];
      newBlackPlayers[index] = value;
      setBlackPlayers(newBlackPlayers);
    }
  };

  const handlePlayerPercentageChange = (type: 'red' | 'black', index: number, value: number) => {
    if (type === 'red') {
      const newRedPercentages = [...redPlayerPercentages];
      newRedPercentages[index] = value;
      setRedPlayerPercentages(newRedPercentages);
    } else {
      const newBlackPercentages = [...blackPlayerPercentages];
      newBlackPercentages[index] = value;
      setBlackPlayerPercentages(newBlackPercentages);
    }
  };

  const handlePlayerBattingOrderChange = (type: 'red' | 'black', index: number, value: number) => {
    if (type === 'red') {
      const newRedBattingOrders = [...redPlayerBattingOrders];
      newRedBattingOrders[index] = value;
      setRedPlayerBattingOrders(newRedBattingOrders);
    } else {
      const newBlackBattingOrders = [...blackPlayerBattingOrders];
      newBlackBattingOrders[index] = value;
      setBlackPlayerBattingOrders(newBlackPlayerBattingOrders);
    }
  };

  const handlePlayerRoleChange = (type: 'red' | 'black', index: number, role: string) => {
    if (type === 'red') {
      const newRedPlayers = [...redPlayers];
      const playerName = newRedPlayers[index].split(' (')[0];
      newRedPlayers[index] = role ? `${playerName} (${role})` : playerName;
      setRedPlayers(newRedPlayers);
    } else {
      const newBlackPlayers = [...blackPlayers];
      const playerName = newBlackPlayers[index].split(' (')[0];
      newBlackPlayers[index] = role ? `${playerName} (${role})` : playerName;
      setBlackPlayers(newBlackPlayers);
    }
  };

  const handleGenerateRandomTeams = () => {
    if (!validatePlayers(redPlayers, blackPlayers)) {
      toast({
        title: "Validation Error",
        description: "कृपया सभी 22 खिलाड़ियों के नाम दर्ज करें",
        variant: "destructive",
      });
      return;
    }

    // Show filter selection UI instead of generating teams
    setShowFilterSelection(true);
    toast({
      title: "Filter Selection",
      description: "कृपया अपने desired filters select करें फिर 'Generate Filtered Teams' button click करें",
    });
  };

  const handleGenerateFilteredTeams = () => {
    if (!validatePlayers(redPlayers, blackPlayers)) {
      toast({
        title: "Validation Error",
        description: "कृपया सभी 22 खिलाड़ियों के नाम दर्ज करें",
        variant: "destructive",
      });
      return;
    }

    const validRedPlayers = redPlayers.filter(name => name.trim().length > 0);
    const validBlackPlayers = blackPlayers.filter(name => name.trim().length > 0);

    // Prepare filters object based on selected filters
    const currentFilters = {
      redPlayerRange: selectedFilters.range ? redPlayerRange : undefined,
      roleFilter: selectedFilters.role,
      searchPlayers: selectedFilters.search ? searchPlayers : undefined,
      multiSearchPlayers: selectedFilters.multiSearch ? multiSearchPlayers : undefined,
      roleSpecificPlayers: selectedFilters.roleSpecific ? roleSpecificPlayers : undefined
    };

    // Create filter description for toast
    const filterDescriptions = [];
    if (selectedFilters.range) filterDescriptions.push(`Red: ${redPlayerRange.min}-${redPlayerRange.max}`);
    if (selectedFilters.role) filterDescriptions.push("All roles required");
    if (selectedFilters.search) filterDescriptions.push(`Exact team (${searchPlayers.length} players)`);
    if (selectedFilters.multiSearch) filterDescriptions.push(`Multi-search (${multiSearchPlayers.length} players)`);
    if (selectedFilters.roleSpecific) filterDescriptions.push(`Role-specific (${roleSpecificPlayers.length} players)`);

    const hasFilters = filterDescriptions.length > 0;
    const filterText = hasFilters ? ` with filters: ${filterDescriptions.join(", ")}` : "";

    toast({
      title: "Generating Filtered Teams",
      description: `Selected filters के साथ maximum 10,000 teams generate हो रही हैं${filterText}...`,
    });

    // Use setTimeout to allow UI to update before computation
    setTimeout(() => {
      const startTime = Date.now();
      const teams = generateRandomTeams(
        validRedPlayers, 
        validBlackPlayers, 
        10000, 
        calculatedPercentages, 
        [...redPlayerPercentages, ...blackPlayerPercentages],
        [...redPlayerBattingOrders, ...blackPlayerBattingOrders],
        currentFilters
      );
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

      setGeneratedTeams(teams);
      setFilteredTeams(teams);
      setCurrentFilteredCount(teams.length);
      setActiveFilters(selectedFilters);
      setShowFilterSelection(false);

      toast({
        title: "Filtered Teams Generated",
        description: `${teams.length.toLocaleString()} teams generated using C(22,11) formula in ${timeTaken} seconds!${hasFilters ? ` (Applied filters: ${filterDescriptions.join(", ")})` : " (No filters applied)"}`,
      });
    }, 100);
  };

  const handleGenerateAllTeams = () => {
    if (!validatePlayers(redPlayers, blackPlayers)) {
      toast({
        title: "Validation Error", 
        description: "कृपया सभी 22 खिलाड़ियों के नाम दर्ज करें",
        variant: "destructive",
      });
      return;
    }

    const validRedPlayers = redPlayers.filter(name => name.trim().length > 0);
    const validBlackPlayers = blackPlayers.filter(name => name.trim().length > 0);

    toast({
      title: "Generating All Combinations",
      description: "C(22,11) = 705,432 teams बन रही हैं। कृपया wait करें...",
    });

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const startTime = Date.now();
      const teams = generateAllPossibleTeams(
        validRedPlayers, 
        validBlackPlayers, 
        [...redPlayerPercentages, ...blackPlayerPercentages],
        [...redPlayerBattingOrders, ...blackPlayerBattingOrders],
        {} // Empty calculatedPercentages to avoid C&VC data by default
      );
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

      setGeneratedTeams(teams);
      setFilteredTeams(teams);
      setCurrentFilteredCount(teams.length);
      setActiveFilters({search: false, range: false, role: false, multiSearch: false, roleSpecific: false});

      toast({
        title: "All Combinations Generated",
        description: `${teams.length.toLocaleString()} teams generated in ${timeTaken} seconds using C(22,11) formula! (C&VC data not included - use 'Print C&VC' button for current page)`,
      });
    }, 100);
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleLoad = (data: GameData) => {
    if (data.redPlayers && data.blackPlayers && 
        Array.isArray(data.redPlayers) && Array.isArray(data.blackPlayers) &&
        data.redPlayers.length === 11 && data.blackPlayers.length === 11) {

      setRedPlayers(data.redPlayers);
      setBlackPlayers(data.blackPlayers);

      // Load percentages if available
      if (data.redPlayerPercentages) {
        setRedPlayerPercentages(data.redPlayerPercentages);
      }
      if (data.blackPlayerPercentages) {
        setBlackPlayerPercentages(data.blackPlayerPercentages);
      }

      // Load batting orders if available
      if (data.redPlayerBattingOrders) {
        setRedPlayerBattingOrders(data.redPlayerBattingOrders);
      }
      if (data.blackPlayerBattingOrders) {
        setBlackPlayerBattingOrders(data.blackPlayerBattingOrders);
      }

      setGeneratedTeams([]);
      setFilteredTeams([]);
      setCurrentFilteredCount(0);

      toast({
        title: "Data Loaded",
        description: "Player data, selection percentages और batting orders load हो गए हैं!",
      });
    }
  };



  const handleSearchTeam = () => {
    if (searchPlayers.length !== 11) {
      toast({
        title: "Selection Error",
        description: "कृपया ठीक 11 खिलाड़ी select करें search के लिए",
        variant: "destructive",
      });
      return;
    }

    const searchPlayerNames = searchPlayers.map(p => p.toLowerCase().trim());
    const currentTeams = filteredTeams.length > 0 ? filteredTeams : generatedTeams;
    const matchingTeams = currentTeams.filter(team => {
      const teamPlayerNames = team.players.map(p => p.name.toLowerCase().trim());
      return searchPlayerNames.every(name => teamPlayerNames.includes(name));
    });

    if (matchingTeams.length === 0) {
      toast({
        title: "No Match Found",
        description: "कोई team नहीं मिली selected players के साथ current filtered results में",
        variant: "destructive",
      });
      return;
    }

    // Move matching teams to top
    const otherTeams = currentTeams.filter(team => {
      const teamPlayerNames = team.players.map(p => p.name.toLowerCase().trim());
      return !searchPlayerNames.every(name => teamPlayerNames.includes(name));
    });

    const reorderedTeams = [...matchingTeams, ...otherTeams];
    setFilteredTeams(reorderedTeams);
    setCurrentFilteredCount(matchingTeams.length);
    setActiveFilters(prev => ({...prev, search: true}));

    toast({
      title: "Search Complete",
      description: `${matchingTeams.length} matching teams found और top पर move कर दिए गए`,
    });
  };

  const handleMultiPlayerSearch = () => {
    if (multiSearchPlayers.length === 0) {
      toast({
        title: "Selection Error",
        description: "कृपया कम से कम 1 player select करें",
        variant: "destructive",
      });
      return;
    }

    const searchPlayerNames = multiSearchPlayers.map(p => p.toLowerCase().trim());
    const currentTeams = filteredTeams.length > 0 ? filteredTeams : generatedTeams;

    const matchingTeams = currentTeams.filter(team => {
      const teamPlayerNames = team.players.map(p => p.name.toLowerCase().trim());
      // Check if ALL selected players are in this team
      return searchPlayerNames.every(name => teamPlayerNames.includes(name));
    });

    if (matchingTeams.length === 0) {
      toast({
        title: "No Teams Found",
        description: `कोई team नहीं मिली जिसमें सभी ${multiSearchPlayers.length} selected players हों`,
        variant: "destructive",
      });
      return;
    }

    // Move matching teams to top
    const otherTeams = currentTeams.filter(team => {
      const teamPlayerNames = team.players.map(p => p.name.toLowerCase().trim());
      return !searchPlayerNames.every(name => teamPlayerNames.includes(name));
    });

    const reorderedTeams = [...matchingTeams, ...otherTeams];
    setFilteredTeams(reorderedTeams);
    setCurrentFilteredCount(matchingTeams.length);
    setActiveFilters(prev => ({...prev, multiSearch: true}));

    toast({
      title: "Multi-Player Search Complete",
      description: `${matchingTeams.length} teams found जिनमें सभी ${multiSearchPlayers.length} selected players हैं`,
    });
  };

  const handleRedPlayerRangeFilter = () => {
    const currentTeams = filteredTeams.length > 0 ? filteredTeams : generatedTeams;
    const filtered = currentTeams.filter(team => 
      team.redCount >= redPlayerRange.min && team.redCount <= redPlayerRange.max
    );

    setFilteredTeams(filtered);
    setCurrentFilteredCount(filtered.length);
    setActiveFilters(prev => ({...prev, range: true}));

    toast({
      title: "Filter Applied",
      description: `${filtered.length} teams found with ${redPlayerRange.min}-${redPlayerRange.max} red players`,
    });
  };
const handleArrangeRank = () => {
    // Combine all players into one array regardless of their type
    const allPlayersWithPercentages = [
        ...redPlayers.map((name, index) => ({
            name: name.split(' (')[0], 
            percentage: redPlayerPercentages[index], 
            type: 'red', 
            originalIndex: index 
        })),
        ...blackPlayers.map((name, index) => ({
            name: name.split(' (')[0], 
            percentage: blackPlayerPercentages[index], 
            type: 'black', 
            originalIndex: index 
        }))
    ].filter(player => player.name.trim().length > 0);
    // Sort players by percentage descending
    allPlayersWithPercentages.sort((a, b) => b.percentage - a.percentage);

    // Assign ranks from r1 to r22
    const newPlayerRanks: { [key: string]: number } = {};
    allPlayersWithPercentages.forEach((player, index) => {
        newPlayerRanks[player.name] = index + 1; // 1-based ranking
    });

    setPlayerRanks(newPlayerRanks);

    // Save to localStorage
    localStorage.setItem('playerRanks', JSON.stringify(newPlayerRanks));

    toast({
        title: "Ranks Arranged",
        description: `Players ranked based on combined selection percentages.`,
    });
};

  const handleCalculate = () => {
    // Step 3: Calculate percentages from rank table
    const totalRows = rankTableRows.length;

    // Only count rows that have at least one entry
    const validRows = rankTableRows.filter(row => 
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc']
        .some(col => row[col] && row[col].trim())
    );

    const validRowCount = validRows.length;

    if (validRowCount === 0) {
      toast({
        title: "No Data Found",
        description: "कृपया table में कुछ data enter करें",
        variant: "destructive",
      });
      return;
    }

    const countMap: {[key: string]: number} = {};

    // Count occurrences for p1-p11 columns
    validRows.forEach(row => {
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'].forEach(col => {
        if (row[col] && row[col].trim()) {
          const value = row[col].trim();
          countMap[value] = (countMap[value] || 0) + 1;
        }
      });
    });

    // Count occurrences for c column
    const cCountMap: {[key: string]: number} = {};
    validRows.forEach(row => {
      if (row.c && row.c.trim()) {
        const value = row.c.trim();
        cCountMap[value] = (cCountMap[value] || 0) + 1;
      }
    });

    // Count occurrences for vc column
    const vcCountMap: {[key: string]: number} = {};
    validRows.forEach(row => {
      if (row.vc && row.vc.trim()) {
        const value = row.vc.trim();
        vcCountMap[value] = (vcCountMap[value] || 0) + 1;
      }
    });

    // Calculate percentages
    const newCalculatedPercentages: {[key: string]: number} = {};

    // For rank numbers (1-22)
    Object.entries(countMap).forEach(([key, count]) => {
      newCalculatedPercentages[key] = (count / validRowCount) * 100;
    });

    // For captain (c) column
    Object.entries(cCountMap).forEach(([key, count]) => {
      newCalculatedPercentages[`c_${key}`] = (count / validRowCount) * 100;
    });

    // For vice-captain (vc) column
    Object.entries(vcCountMap).forEach(([key, count]) => {
      newCalculatedPercentages[`vc_${key}`] = (count / validRowCount) * 100;
    });

    setCalculatedPercentages(newCalculatedPercentages);

    // Save to localStorage
    localStorage.setItem('calculatedPercentages', JSON.stringify(newCalculatedPercentages));

    console.log('Calculated Percentages:', newCalculatedPercentages);
    console.log('Valid Rows:', validRowCount);
    console.log('C Count Map:', cCountMap);
    console.log('VC Count Map:', vcCountMap);

    toast({
      title: "Calculation Complete",
      description: `Percentages calculated from ${validRowCount} valid rows (Rank: ${Object.keys(countMap).length}, C: ${Object.keys(cCountMap).length}, VC: ${Object.keys(vcCountMap).length})`,
    });
  };

  const handleUpdateName = () => {
    // Step 4: Update player names with rank and percentage, preserving original roles
    const newRedPlayers = redPlayers.map((player, index) => {
      const baseName = player.split(' (')[0];
      const rank = playerRanks[baseName];

      // Extract existing role information
      const roleMatch = player.match(/\((wk|batter|bowler|allrounder)\)/);
      const existingRole = roleMatch ? roleMatch[1] : null;

      if (baseName.trim() && rank) {
        // Get the percentage from calculated percentages based on rank
        const rankPercentage = calculatedPercentages[rank.toString()] || 0;

        // Build updated name with rank, percentage, and preserve role
        let updatedName = `${baseName} (r${rank}, ${rankPercentage.toFixed(2)}%)`;

        // Add role if it exists
        if (existingRole) {
          updatedName += ` (${existingRole})`;
        }

        return updatedName;
      }
      return player;
    });

    const newBlackPlayers = blackPlayers.map((player, index) => {
      const baseName = player.split(' (')[0];
      const rank = playerRanks[baseName];

      // Extract existing role information
      const roleMatch = player.match(/\((wk|batter|bowler|allrounder)\)/);
      const existingRole = roleMatch ? roleMatch[1] : null;

      if (baseName.trim() && rank) {
        // Get the percentage from calculated percentages based on rank
        const rankPercentage = calculatedPercentages[rank.toString()] || 0;

        // Build updated name with rank, percentage, and preserve role
        let updatedName = `${baseName} (r${rank}, ${rankPercentage.toFixed(2)}%)`;

        // Add role if it exists
        if (existingRole) {
          updatedName += ` (${existingRole})`;
        }

        return updatedName;
      }
      return player;
    });

    setRedPlayers(newRedPlayers);
    setBlackPlayers(newBlackPlayers);

    toast({
      title: "Names Updated",
      description: "Player names updated with ranks and percentages while preserving original roles",
    });
  };

  const handleRoleFilter = () => {
    const currentTeams = filteredTeams.length > 0 ? filteredTeams : generatedTeams;
    const filtered = currentTeams.filter(team => {
      const roles = {
        wk: 0,
        batter: 0,
        bowler: 0,
        allrounder: 0
      };

      // Count roles in the team
      team.players.forEach(player => {
        const role = getPlayerRole(player.name);
        if (role && role in roles) {
          roles[role as keyof typeof roles]++;
        }
      });

      // Check if each role has at least 1 player (mandatory requirement)
      const hasWK = roles.wk >= 1;
      const hasBatter = roles.batter >= 1;
      const hasBowler = roles.bowler >= 1;
      const hasAllrounder = roles.allrounder >= 1;

      // All four roles must be present in the team
      return hasWK && hasBatter && hasBowler && hasAllrounder;
    });

    setFilteredTeams(filtered);
    setCurrentFilteredCount(filtered.length);
    setActiveFilters(prev => ({...prev, role: true}));

    toast({
      title: "Role Filter Applied",
      description: `${filtered.length} teams found जिनमें हर role से कम से कम 1 player है (WK, Batter, Bowler, All-rounder)`,
    });
  };

  const handleRoleSpecificFilter = () => {
    if (roleSpecificPlayers.length === 0) {
      toast({
        title: "Selection Error",
        description: "कृपया कम से कम 1 player select करें role-specific filter के लिए",
        variant: "destructive",
      });
      return;
    }

    // Group selected players by their roles
    const roleGroups: {[role: string]: string[]} = {};
    roleSpecificPlayers.forEach(playerName => {
      const role = getPlayerRole(playerName);
      if (role) {
        if (!roleGroups[role]) {
          roleGroups[role] = [];
        }
        roleGroups[role].push(playerName.toLowerCase().trim());
      }
    });

    const currentTeams = filteredTeams.length > 0 ? filteredTeams : generatedTeams;

    const matchingTeams = currentTeams.filter(team => {
      // For each role in roleGroups, check if team has EXACTLY those players and NO OTHER players of that role
      return Object.entries(roleGroups).every(([role, selectedPlayers]) => {
        // Get all players of this role in the team
        const teamPlayersOfThisRole = team.players
          .filter(player => getPlayerRole(player.name) === role)
          .map(player => player.name.toLowerCase().trim());

        // Check if team has exactly the selected players of this role (no more, no less)
        if (teamPlayersOfThisRole.length !== selectedPlayers.length) {
          return false;
        }

        // Check if all selected players are in the team and no other player of this role exists
        return selectedPlayers.every(selectedPlayer => 
          teamPlayersOfThisRole.includes(selectedPlayer)
        ) && teamPlayersOfThisRole.every(teamPlayer => 
          selectedPlayers.includes(teamPlayer)
        );
      });
    });

    if (matchingTeams.length === 0) {
      toast({
        title: "No Teams Found",
        description: `कोई team नहीं मिली जिसमें exactly selected players हों उनके respective roles में`,
        variant: "destructive",
      });
      return;
    }

    // Move matching teams to top
    const otherTeams = currentTeams.filter(team => !matchingTeams.includes(team));
    const reorderedTeams = [...matchingTeams, ...otherTeams];

    setFilteredTeams(reorderedTeams);
    setCurrentFilteredCount(matchingTeams.length);
    setActiveFilters(prev => ({...prev, roleSpecific: true}));

    // Create description of what was filtered
    const roleDescriptions = Object.entries(roleGroups).map(([role, players]) => 
      `${role}: ${players.length} player(s)`
    ).join(', ');

    toast({
      title: "Role-Specific Filter Applied",
      description: `${matchingTeams.length} teams found with exactly: ${roleDescriptions}`,
    });
  };

  const handleToggleTeamCVCData = (teamId: number) => {
    // Check if C&VC data is available
    if (Object.keys(calculatedPercentages).length === 0) {
      toast({
        title: "No C&VC Data Available",
        description: "कृपया पहले rank table data calculate करें",
        variant: "destructive",
      });
      return;
    }

    setFilteredTeams(prevTeams => {
      return prevTeams.map(team => {
        if (team.id === teamId) {
          // Check if this team already has C&VC data
          const hasExistingCVC = team.players.some(player => player.captainInfo || player.viceCaptainInfo);

          if (hasExistingCVC) {
            // Remove C&VC data
            const playersWithoutCVC = team.players.map(player => {
              const { captainInfo, viceCaptainInfo, ...playerWithoutCVC } = player;
              return playerWithoutCVC;
            });
            return {
              ...team,
              players: playersWithoutCVC
            };
          } else {
            // Add C&VC data
            const sortedPlayers = [...team.players].sort((a, b) => (b.selectionPercentage || 0) - (a.selectionPercentage || 0));

            // Assign captain and vice-captain based on player percentage ranking
      const playersWithRoles = sortedPlayers.map((player, index) => {
        let captainInfo = '';
        let viceCaptainInfo = '';

        // Captain assignment: highest percentage player gets c1 count, next gets c2 count, ... lowest gets c11 count
        const cKey = `c_${index + 1}`;
        const cPercentage = calculatedPercentages?.[cKey] || 0;
        if (cPercentage > 0) {
          // Calculate exact count from percentage
          const validRows = rankTableRows.filter(row => 
            ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc']
              .some(col => row[col] && row[col].trim())
          );
          const validRowCount = validRows.length;
          const exactCount = Math.round((cPercentage / 100) * validRowCount);
          captainInfo = `(c${index + 1}: ${exactCount})`;
        }

        // Vice-captain assignment: highest percentage player gets vc1 count, next gets vc2 count, ... lowest gets vc11 count
        const vcKey = `vc_${index + 1}`;
        const vcPercentage = calculatedPercentages?.[vcKey] || 0;
        if (vcPercentage > 0) {
          // Calculate exact count from percentage
          const validRows = rankTableRows.filter(row => 
            ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc']
              .some(col => row[col] && row[col].trim())
          );
          const validRowCount = validRows.length;
          const exactCount = Math.round((vcPercentage / 100) * validRowCount);
          viceCaptainInfo = `(vc${index + 1}: ${exactCount})`;
        }

        return {
          ...player,
          captainInfo,
          viceCaptainInfo
        };
      });

            return {
              ...team,
              players: playersWithRoles
            };
          }
        }
        return team;
      });
    });
  };

  const clearFilters = () => {
    setFilteredTeams(generatedTeams);
    setCurrentFilteredCount(generatedTeams.length);
    setActiveFilters({search: false, range: false, role: false, multiSearch: false, roleSpecific: false});
    setSearchPlayers([]);
    setMultiSearchPlayers([]);
    setRoleSpecificPlayers([]);
    setRedPlayerRange({min: 0, max: 11});

    toast({
      title: "Filters Cleared",
      description: "सभी filters clear कर दिए गए",
    });
  };

  const getStats = (): TeamStats => {
    const redCount = redPlayers.filter(name => name.trim().length > 0).length;
    const blackCount = blackPlayers.filter(name => name.trim().length > 0).length;

    return {
      totalTeams: filteredTeams.length,
      redPlayers: redCount,
      blackPlayers: blackCount,
      totalCombinations: calculatePossibleCombinations(redCount, blackCount)
    };
  };

  const gameData: GameData = {
    redPlayers,
    blackPlayers,
    redPlayerPercentages,
    blackPlayerPercentages,
    redPlayerBattingOrders,
    blackPlayerBattingOrders,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🏏 Cricket Team Generator</h1>
          <p className="text-sm text-gray-600 mt-1">22 खिलाड़ियों से रैंडम टीम बनाएं</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Action Buttons */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleCalculate}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Calculate
              </Button>
              <Button 
                onClick={handleArrangeRank}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Arrange Rank
              </Button>
              <Button 
                onClick={handleUpdateName}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Update Name
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PlayerInput
              redPlayers={redPlayers}
              blackPlayers={blackPlayers}
              redPlayerPercentages={redPlayerPercentages}
              blackPlayerPercentages={blackPlayerPercentages}
              redPlayerBattingOrders={redPlayerBattingOrders}
              blackPlayerBattingOrders={blackPlayerBattingOrders}
              onPlayerChange={handlePlayerChange}
              onPlayerRoleChange={handlePlayerRoleChange}
              onPlayerPercentageChange={handlePlayerPercentageChange}
              onPlayerBattingOrderChange={handlePlayerBattingOrderChange}
              onGenerateRandomTeams={handleGenerateRandomTeams}
              onGenerateAllTeams={handleGenerateAllTeams}
              onSave={handleSave}
              onLoadClick={() => setShowLoadModal(true)}
            />

            {/* Rank Table Dropdown */}
            <Card className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Rank-based Entry Table & Data Summary
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[95vw] max-w-6xl">
                  <DropdownMenuLabel>Rank-based Entry Table</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Rank-based Entry Table</h3>
                      <div className="space-x-2">
                        <Button 
                          onClick={() => {
                            const newRows = [...rankTableRows, {p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: '', p11: '', c: '', vc: ''}];
                            setRankTableRows(newRows);
                            localStorage.setItem('rankTableRows', JSON.stringify(newRows));
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Add Row
                        </Button>

                        <Button 
                          onClick={() => setShowPasteJsonDialog(true)}
                          size="sm"
                          variant="outline"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Paste JSON
                        </Button>

                        <Button 
                          onClick={() => setShowBulkPasteDialog(true)}
                          size="sm"
                          variant="outline"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Bulk Paste
                        </Button>

                        <Button 
                          onClick={() => {
                            setShowBulkPasteDialog(true);
                            setBulkPasteText(`1,2,3,4,5,9,13,14,15,19,21,c4,vc11
1,2,3,7,8,11,12,13,16,18,21,c1,vc11
2,3,5,7,11,12,13,14,15,17,20,c3,vc2
1,2,3,7,8,9,10,11,13,14,22,c5,vc10
1,2,3,4,5,7,13,14,16,17,21,c4,vc6
1,3,4,6,7,8,12,13,14,17,20,c2,vc10
2,3,5,6,7,10,11,12,15,16,18,c2,vc10`);
                          }}
                          size="sm"
                          variant="outline"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Load CSV Data
                        </Button>

                        <Button 
                          onClick={async () => {
                            try {
                              const jsonData = JSON.stringify(rankTableRows, null, 2);
                              await navigator.clipboard.writeText(jsonData);
                              toast({
                                title: "Data Copied",
                                description: `${rankTableRows.length} rows copied to clipboard in JSON format`,
                              });
                            } catch (error) {
                              toast({
                                title: "Copy Failed",
                                description: "Could not copy data to clipboard",
                                variant: "destructive",
                              });
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Copy Loaded Data
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            {['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc', 'Actions'].map(col => (
                              <th key={col} className="border border-gray-300 px-2 py-1 text-xs font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rankTableRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc'].map(col => (
                                <td key={col} className="border border-gray-300 p-1">
                                  <Input
                                    value={row[col]}
                                    onChange={(e) => {
                                      const newRows = [...rankTableRows];
                                      let value = e.target.value;

                                      // Validation for p1-p11 columns (should accept numbers 1-22)
                                      if (col.startsWith('p')) {
                                        // Allow only numbers 1-22
                                        if (value && (!/^\d+$/.test(value) || parseInt(value) < 1 || parseInt(value) > 22)) {
                                          return; // Don't update if invalid
                                        }
                                      }
                                      // Validation for c and vc columns (extract only numbers)
                                      else if (col === 'c' || col === 'vc') {
                                        // Extract only numbers from values like c4, vc11, etc.
                                        if (value) {
                                          const numberMatch = value.match(/\d+/);
                                          value = numberMatch ? numberMatch[0] : '';
                                        }
                                      }

                                      newRows[rowIndex][col] = value;
                                      setRankTableRows(newRows);
                                      // Save to localStorage
                                      localStorage.setItem('rankTableRows', JSON.stringify(newRows));
                                    }}
                                    className="w-full text-xs h-8 bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    placeholder={col.startsWith('p') ? '1-22' : (col === 'c' ? 'c1,c2...' : 'vc1,vc2...')}
                                  />
                                </td>
                              ))}
                              <td className="border border-gray-300 p-1">
                                <Button
                                  onClick={() => {
                                    if (rankTableRows.length > 1) {
                                      const newRows = rankTableRows.filter((_, index) => index !== rowIndex);
                                      setRankTableRows(newRows);
                                      localStorage.setItem('rankTableRows', JSON.stringify(newRows));
                                    }
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-full text-xs"
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Display calculated percentages */}
                    <div className="space-y-3">
                      {/* Calculated Percentages */}
                      {Object.keys(calculatedPercentages).length > 0 && (
                        <div className="p-3 bg-gray-50 rounded">
                          <h4 className="font-medium mb-2">Calculated Percentages:</h4>
                        <div className="text-sm space-y-2">
                          {/* Rank percentages (1-22) */}
                          <div>
                            <span className="font-medium text-blue-600">Rank Percentages: </span>
                            {Object.entries(calculatedPercentages)
                              .filter(([key]) => !key.startsWith('c_') && !key.startsWith('vc_'))
                              .sort(([a], [b]) => {
                                const aNum = parseInt(a);
                                const bNum = parseInt(b);
                                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                return a.localeCompare(b);
                              })
                              .map(([key, percentage]) => (
                                <span key={key} className="inline-block mr-3">
                                  {key}={percentage.toFixed(2)}%
                                </span>
                              ))}
                          </div>

                          {/* Captain percentages */}
                          <div>
                            <span className="font-medium text-green-600">Captain (c): </span>
                            {Object.entries(calculatedPercentages)
                              .filter(([key]) => key.startsWith('c_'))
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([key, percentage]) => (
                                <span key={key} className="inline-block mr-3">
                                  {key.replace('c_', '')}={percentage.toFixed(2)}%
                                </span>
                              ))}
                          </div>

                          {/* Vice-captain percentages */}
                          <div>
                            <span className="font-medium text-purple-600">Vice-captain (vc): </span>
                            {Object.entries(calculatedPercentages)
                              .filter(([key]) => key.startsWith('vc_'))
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([key, percentage]) => (
                                <span key={key} className="inline-block mr-3">
                                  {key.replace('vc_', '')}={percentage.toFixed(2)}%
                                </span>
                              ))}
                          </div>
                        </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Filter Selection UI */}
            {showFilterSelection && (
              <Card className="p-6 border-2 border-blue-500 bg-blue-50">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Select Filters for Random Teams Generation</h3>
                  <p className="text-sm text-blue-600">कृपया अपने desired filters select करें, फिर 'Generate Filtered Teams' button click करें</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {/* Red Player Range Filter */}
                  <div className="p-3 border rounded-lg bg-white">
                    <label className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedFilters.range}
                        onChange={(e) => setSelectedFilters(prev => ({...prev, range: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="font-medium">Red Player Range</span>
                    </label>
                    {selectedFilters.range && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm min-w-[40px]">Min:</label>
                          <select 
                            value={redPlayerRange.min}
                            onChange={(e) => setRedPlayerRange(prev => ({...prev, min: parseInt(e.target.value)}))}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          >
                            {Array.from({length: 12}, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm min-w-[40px]">Max:</label>
                          <select 
                            value={redPlayerRange.max}
                            onChange={(e) => setRedPlayerRange(prev => ({...prev, max: parseInt(e.target.value)}))}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          >
                            {Array.from({length: 12}, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role Filter */}
                  <div className="p-3 border rounded-lg bg-white">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFilters.role}
                        onChange={(e) => setSelectedFilters(prev => ({...prev, role: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="font-medium">All Roles Required</span>
                    </label>
                    <p className="text-xs text-gray-600 mt-1">कम से कम 1 WK, Batter, Bowler, All-rounder</p>
                  </div>

                  {/* Exact Team Search */}
                  <div className="p-3 border rounded-lg bg-white">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedFilters.search}
                        onChange={(e) => setSelectedFilters(prev => ({...prev, search: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="font-medium">Exact Team Search</span>
                    </label>
                    {selectedFilters.search && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">Selected: {searchPlayers.length}/11 players</p>
                        <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                          {[...redPlayers, ...blackPlayers]
                            .filter(name => name.trim().length > 0)
                            .map((player, index) => (
                            <label key={index} className="flex items-center space-x-2 text-xs">
                              <input
                                type="checkbox"
                                checked={searchPlayers.includes(player)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (searchPlayers.length < 11) {
                                      setSearchPlayers([...searchPlayers, player]);
                                    }
                                  } else {
                                    setSearchPlayers(searchPlayers.filter(p => p !== player));
                                  }
                                }}
                                disabled={!searchPlayers.includes(player) && searchPlayers.length >= 11}
                                className="rounded"
                              />
                              <span className={index < 11 ? 'text-red-600' : 'text-gray-800'}>
                                {player}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Multi-Player Search */}
                  <div className="p-3 border rounded-lg bg-white">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedFilters.multiSearch}
                        onChange={(e) => setSelectedFilters(prev => ({...prev, multiSearch: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="font-medium">Multi-Player Search</span>
                    </label>
                    {selectedFilters.multiSearch && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">Selected: {multiSearchPlayers.length} players</p>
                        <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                          {[...redPlayers, ...blackPlayers]
                            .filter(name => name.trim().length > 0)
                            .map((player, index) => (
                            <label key={index} className="flex items-center space-x-2 text-xs">
                              <input
                                type="checkbox"
                                checked={multiSearchPlayers.includes(player)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMultiSearchPlayers([...multiSearchPlayers, player]);
                                  } else {
                                    setMultiSearchPlayers(multiSearchPlayers.filter(p => p !== player));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className={index < 11 ? 'text-red-600' : 'text-gray-800'}>
                                {player}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role-Specific Filter */}
                  <div className="p-3 border rounded-lg bg-white">
                    <label className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedFilters.roleSpecific}
                        onChange={(e) => setSelectedFilters(prev => ({...prev, roleSpecific: e.target.checked}))}
                        className="rounded"
                      />
                      <span className="font-medium">Role-Specific Filter</span>
                    </label>
                    {selectedFilters.roleSpecific && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">Selected: {roleSpecificPlayers.length} players</p>
                        <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                          {[...redPlayers, ...blackPlayers]
                            .filter(name => name.trim().length > 0)
                            .map((player, index) => {
                              const role = getPlayerRole(player);
                              return (
                                <label key={index} className="flex items-center space-x-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={roleSpecificPlayers.includes(player)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setRoleSpecificPlayers([...roleSpecificPlayers, player]);
                                      } else {
                                        setRoleSpecificPlayers(roleSpecificPlayers.filter(p => p !== player));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className={index < 11 ? 'text-red-600' : 'text-gray-800'}>
                                    {player} {role && <span className="text-blue-600">({role})</span>}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleGenerateFilteredTeams}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Generate Filtered Teams (Max 10,000)
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowFilterSelection(false);
                      setSelectedFilters({search: false, range: false, role: false, multiSearch: false, roleSpecific: false});
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Filters and Controls Row */}
            {generatedTeams.length > 0 && (
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Role Assignment Button */}
                  <Button 
                    onClick={assignRandomRoles} 
                    variant="outline" 
                    size="sm" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Assign Roles
                  </Button>

                  {/* Multi-Player Search Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        Multi-Player Search
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80">
                      <DropdownMenuLabel>Select Multiple Players</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                          {[...redPlayers, ...blackPlayers]
                            .filter(name => name.trim().length > 0)
                            .map((player, index) => (
                            <label key={index} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={multiSearchPlayers.includes(player)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMultiSearchPlayers([...multiSearchPlayers, player]);
                                  } else {
                                    setMultiSearchPlayers(multiSearchPlayers.filter(p => p !== player));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className={index < 11 ? 'text-red-600' : 'text-gray-800'}>
                                {player}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          Selected: {multiSearchPlayers.length} players
                        </div>
                        <Button 
                          onClick={handleMultiPlayerSearch}
                          disabled={multiSearchPlayers.length === 0}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          Search Teams
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Exact Team Search Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Search className="w-4 h-4 mr-2" />
                        Exact Team Search
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80">
                      <DropdownMenuLabel>Select Exactly 11 Players</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                          {[...redPlayers, ...blackPlayers]
                            .filter(name => name.trim().length > 0)
                            .map((player, index) => (
                            <label key={index} className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={searchPlayers.includes(player)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (searchPlayers.length < 11) {
                                      setSearchPlayers([...searchPlayers, player]);
                                    }
                                  } else {
                                    setSearchPlayers(searchPlayers.filter(p => p !== player));
                                  }
                                }}
                                disabled={!searchPlayers.includes(player) && searchPlayers.length >= 11}
                                className="rounded"
                              />
                              <span className={index < 11 ? 'text-red-600' : 'text-gray-800'}>
                                {player}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          Selected: {searchPlayers.length}/11 players
                        </div>
                        <Button 
                          onClick={handleSearchTeam}
                          disabled={searchPlayers.length !== 11}
                          className="w-full"
                          size="sm"
                        >
                          Search Team
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Red Player Range Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Target className="w-4 h-4 mr-2" />
                        Red Player Range
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      <DropdownMenuLabel>Filter by Red Players Count</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-3 space-y-3">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium min-w-[60px]">Min:</label>
                          <select 
                            value={redPlayerRange.min}
                            onChange={(e) => setRedPlayerRange(prev => ({...prev, min: parseInt(e.target.value)}))}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          >
                            {Array.from({length: 12}, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium min-w-[60px]">Max:</label>
                          <select 
                            value={redPlayerRange.max}
                            onChange={(e) => setRedPlayerRange(prev => ({...prev, max: parseInt(e.target.value)}))}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          >
                            {Array.from({length: 12}, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>

                        <Button 
                          onClick={handleRedPlayerRangeFilter}
                          disabled={redPlayerRange.min > redPlayerRange.max}
                          className="w-full"
                          size="sm"
                        >
                          Apply Range Filter
                        </Button>

                        <div className="text-xs text-gray-500">
                          Range: {redPlayerRange.min} - {redPlayerRange.max} red players
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Role-Specific Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Target className="w-4 h-4 mr-2" />
                        Role-Specific Filter
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80">
                      <DropdownMenuLabel>Select Players by Role</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                          {[...redPlayers, ...blackPlayers]
                            .filter(name => name.trim().length > 0)
                            .map((player, index) => {
                              const role = getPlayerRole(player);
                              return (
                                <label key={index} className="flex items-center space-x-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={roleSpecificPlayers.includes(player)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setRoleSpecificPlayers([...roleSpecificPlayers, player]);
                                      } else {
                                        setRoleSpecificPlayers(roleSpecificPlayers.filter(p => p !== player));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className={index < 11 ? 'text-red-600' : 'text-gray-800'}>
                                    {player} {role && <span className="text-blue-600 text-xs">({role})</span>}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          Selected: {roleSpecificPlayers.length} players
                          {roleSpecificPlayers.length > 0 && (
                            <div className="text-xs mt-1">
                              {Object.entries(
                                roleSpecificPlayers.reduce((acc, player) => {
                                  const role = getPlayerRole(player) || 'unknown';
                                  acc[role] = (acc[role] || 0) + 1;
                                  return acc;
                                }, {} as {[key: string]: number})
                              ).map(([role, count]) => `${role}: ${count}`).join(', ')}
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={handleRoleSpecificFilter}
                          disabled={roleSpecificPlayers.length === 0}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          size="sm"
                        >
                          Apply Role Filter
                        </Button>
                        <div className="text-xs text-gray-500 mt-2">
                          Teams में exactly selected players होंगे उनके respective roles में, कोई extra player उस role का नहीं होगा
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Balanced Team Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Balanced Teams
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80">
                      <DropdownMenuLabel>Filter by Team Balance</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-3">
                        <div className="p-3 bg-green-50 rounded border border-green-200 mb-3">
                          <div className="text-sm text-green-800 font-medium mb-2">Required Roles:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                            <div>✓ कम से कम 1 WK</div>
                            <div>✓ कम से कम 1 Batter</div>
                            <div>✓ कम से कम 1 Bowler</div>
                            <div>✓ कम से कम 1 All-rounder</div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleRoleFilter}
                          className="w-full bg-green-600 hover:bg-green-700"
                                                    size="sm"
                        >
                          Find Balanced Teams
                        </Button>

                        <div className="text-xs text-gray-500 mt-2">
                          बाकी 7 players कोई भी role के हो सकते हैं लेकिन चारों roles में से हर एक का कम से कम 1 player जरूरी है
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>



                  {/* Statistics Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Statistics
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80">
                      <DropdownMenuLabel>Team Statistics</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{getStats().totalTeams}</div>
                            <div className="text-sm text-gray-600">Teams Generated</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {(activeFilters.search || activeFilters.range || activeFilters.role || activeFilters.multiSearch || activeFilters.roleSpecific) 
                                ? currentFilteredCount 
                                : filteredTeams.length}
                            </div>
                            <div className="text-sm text-gray-600">Filtered Teams</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold player-red">{getStats().redPlayers}</div>
                            <div className="text-sm text-gray-600">Red Players</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold player-black">{getStats().blackPlayers}</div>
                            <div className="text-sm text-gray-600">Black Players</div>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>



                  {/* Clear Filters Button */}
                  {(activeFilters.search || activeFilters.range || activeFilters.role || activeFilters.multiSearch || activeFilters.roleSpecific) && (
                    <Button onClick={clearFilters} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                      Clear All Filters
                    </Button>
                  )}

                  {/* Reset Teams Button */}
                  <Button 
                    onClick={() => {
                      setGeneratedTeams([]);
                      setFilteredTeams([]);
                      setCurrentFilteredCount(0);
                      setActiveFilters({search: false, range: false, role: false, multiSearch: false, roleSpecific: false});
                      setSearchPlayers([]);
                      setMultiSearchPlayers([]);
                      setRoleSpecificPlayers([]);
                      setRedPlayerRange({min: 0, max: 11});

                      toast({
                        title: "Teams Reset",
                        description: "सभी generated teams clear कर दी गईं",
                      });
                    }}
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Reset Teams
                  </Button>
                </div>
              </Card>
            )}

            {/* Team Display */}
            <TeamDisplay
              teams={filteredTeams}
              stats={getStats()}
              onToggleTeamCVC={handleToggleTeamCVCData}
            />
          </div>
        </div>


      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        data={gameData}
      />

      <LoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={handleLoad}
      />

      {/* Paste JSON Dialog */}
      <Dialog open={showPasteJsonDialog} onOpenChange={setShowPasteJsonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paste JSON Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                JSON Data (Array of objects):
              </label>
              <Textarea
                value={pasteJsonText}
                onChange={(e) => setPasteJsonText(e.target.value)}
                placeholder='[{"p1":"1","p2":"2","p3":"3",...,"c":"c1","vc":"vc1"},{"p1":"4","p2":"5",...}]'
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="text-xs text-gray-600">
              <p><strong>Format:</strong> Array of objects with keys p1, p2, p3, ..., p11, c, vc</p>
              <p><strong>Example:</strong> [{`"p1":"1","p2":"2","p3":"3","p4":"4","p5":"5","p6":"6","p7":"7","p8":"8","p9":"9","p10":"10","p11":"11","c":"c1","vc":"vc1"`}]</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasteJsonDialog(false);
                setPasteJsonText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  const jsonData = JSON.parse(pasteJsonText.trim());
                  if (Array.isArray(jsonData)) {
                    // Check if table already has data
                    const hasExistingData = rankTableRows.some(row => 
                      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc']
                        .some(col => row[col] && row[col].trim())
                    );

                    if (hasExistingData) {
                      // Show confirmation dialog
                      setPendingJsonData(jsonData);
                      setShowDataOverrideDialog(true);
                      setShowPasteJsonDialog(false);
                    } else {
                      // No existing data, directly load
                      setRankTableRows(jsonData);
                      localStorage.setItem('rankTableRows', JSON.stringify(jsonData));
                      toast({
                        title: "JSON Data Loaded",
                        description: `${jsonData.length} rows loaded successfully`,
                      });
                      setShowPasteJsonDialog(false);
                      setPasteJsonText('');
                    }
                  } else {
                    toast({
                      title: "Invalid JSON Format",
                      description: "JSON should be an array of objects",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "JSON Parse Error",
                    description: "Invalid JSON format. Please check your data.",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Load Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Paste Dialog */}
      <Dialog open={showBulkPasteDialog} onOpenChange={setShowBulkPasteDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Paste Multiple Rows</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Paste multiple rows (Tab/Comma separated values):
              </label>
              <Textarea
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={`Row 1: 1	2	3	4	5	6	7	8	9	10	11	c1	vc1
Row 2: 12	13	14	15	16	17	18	19	20	21	22	c2	vc2
Row 3: 5	6	7	8	9	10	11	12	13	14	15	c3	vc3

या comma separated:
1,2,3,4,5,9,13,14,15,19,21,c4,vc11
1,2,3,7,8,11,12,13,16,18,21,c1,vc11
2,3,5,7,11,12,13,14,15,17,20,c3,vc2`}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <p><strong>Format Options:</strong></p>
              <p>• <strong>Tab separated:</strong> 1	2	3	4	5	6	7	8	9	10	11	c1	vc1 (copy from Excel/Sheets)</p>
              <p>• <strong>Comma separated:</strong> 1,2,3,4,5,6,7,8,9,10,11,c1,vc1</p>
              <p>• <strong>Space separated:</strong> 1 2 3 4 5 6 7 8 9 10 11 c1 vc1</p>
              <p><strong>Column Order:</strong> p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, c, vc</p>
              <p><strong>Note:</strong> Each row should have exactly 13 values. Empty cells can be left blank.</p>
              <p><strong>Unlimited Rows:</strong> आप जितना भी data paste करें, उतने rows automatically create हो जाएंगे। कोई limit नहीं है।</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkPasteDialog(false);
                setBulkPasteText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  const lines = bulkPasteText.trim().split('\n').filter(line => line.trim());
                  const newRows: {[key: string]: string}[] = [];
                  let processedRows = 0;
                  let skippedRows = 0;

                  lines.forEach((line, lineIndex) => {
                    // Handle different separators: tab, comma, space
                    let values: string[];
                    if (line.includes('\t')) {
                      values = line.split('\t');
                    } else if (line.includes(',')) {
                      values = line.split(',');
                    } else {
                      values = line.split(/\s+/);
                    }

                    // Clean up values (trim whitespace)
                    values = values.map(v => v.trim());

                    // Skip empty lines
                    if (values.length === 0 || (values.length === 1 && values[0] === '')) {
                      skippedRows++;
                      return;
                    }

                    // Ensure we have exactly 13 columns (p1-p11, c, vc)
                    while (values.length < 13) {
                      values.push('');
                    }

                    // Take only first 13 values if more are provided
                    values = values.slice(0, 13);

                    const row: {[key: string]: string} = {};
                    const columns = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc'];

                    columns.forEach((col, index) => {
                      let value = values[index] || '';

                      // More flexible validation - allow any alphanumeric values
                      if (col.startsWith('p')) {
                        // For p1-p11, accept numbers 1-22 or keep original value if not a number
                        if (value && /^\d+$/.test(value)) {
                          const num = parseInt(value);
                          if (num < 1 || num > 22) {
                            console.warn(`Value "${value}" for column ${col} in row ${lineIndex + 1} is outside range 1-22, but keeping it.`);
                          }
                        }
                      }
                      // Validation for c and vc columns (extract only numbers)
                      else if (col === 'c' || col === 'vc') {
                        // Extract only numbers from values like c4, vc11, etc.
                        if (value) {
                          const numberMatch = value.match(/\d+/);
                          value = numberMatch ? numberMatch[0] : '';
                        }
                      }

                      row[col] = value;
                    });

                    newRows.push(row);
                    processedRows++;
                  });

                  if (newRows.length > 0) {
                    // Check if table already has data
                    const hasExistingData = rankTableRows.some(row => 
                      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'c', 'vc']
                        .some(col => row[col] && row[col].trim())
                    );

                    if (hasExistingData) {
                      // Show confirmation dialog
                      setPendingJsonData(newRows);
                      setShowDataOverrideDialog(true);
                      setShowBulkPasteDialog(false);
                    } else {
                      // No existing data, directly load
                      setRankTableRows(newRows);
                      localStorage.setItem('rankTableRows', JSON.stringify(newRows));

                      toast({
                        title: "Bulk Paste Successful",
                        description: `${processedRows} rows pasted successfully${skippedRows > 0 ? ` (${skippedRows} empty rows skipped)` : ''}`,
                      });

                      setShowBulkPasteDialog(false);
                      setBulkPasteText('');
                    }
                  } else {
                    toast({
                      title: "No Valid Data Found",
                      description: "कृपया valid format में data paste करें",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('Bulk paste error:', error);
                  toast({
                    title: "Paste Error",
                    description: "Data paste करने में error आई. Format check करें.",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Paste Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Override Confirmation Dialog */}
      <Dialog open={showDataOverrideDialog} onOpenChange={setShowDataOverrideDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Data Already Exists</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Table में पहले से data मौजूद है। आप क्या करना चाहते हैं?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                <div className="font-medium text-blue-800 mb-1">Append Data</div>
                <div className="text-xs text-blue-600">
                  मौजूदा data के बाद नए rows add करें
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                <div className="font-medium text-red-800 mb-1">Replace Data</div>
                <div className="text-xs text-red-600">
                  सभी पुराना data delete करके नया data load करें
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => {
                // Append data - add new rows to existing ones
                const combinedRows = [...rankTableRows, ...pendingJsonData];
                setRankTableRows(combinedRows);
                localStorage.setItem('rankTableRows', JSON.stringify(combinedRows));

                toast({
                  title: "Data Appended",
                  description: `${pendingJsonData.length} new rows added to existing ${rankTableRows.length} rows`,
                });

                setShowDataOverrideDialog(false);
                setPendingJsonData([]);
                setPasteJsonText('');
                setBulkPasteText('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Append Data
            </Button>
            <Button
              onClick={() => {
                // Replace data - completely replace existing data
                setRankTableRows(pendingJsonData);
                localStorage.setItem('rankTableRows', JSON.stringify(pendingJsonData));

                toast({
                  title: "Data Replaced",
                  description: `All existing data replaced with ${pendingJsonData.length} new rows`,
                });

                setShowDataOverrideDialog(false);
                setPendingJsonData([]);
                setPasteJsonText('');
                setBulkPasteText('');
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Replace Data
            </Button>
            <Button
              onClick={() => {
                setShowDataOverrideDialog(false);
                setPendingJsonData([]);
                // Reopen the paste dialog
                if (pasteJsonText) {
                  setShowPasteJsonDialog(true);
                } else {
                  setShowBulkPasteDialog(true);
                }
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}