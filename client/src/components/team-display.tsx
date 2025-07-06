import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";
import { Team, TeamStats } from "@/types/team";

interface TeamDisplayProps {
  teams: Team[];
  stats: TeamStats;
  onToggleTeamCVC?: (teamId: number) => void;
}

export default function TeamDisplay({ teams, stats, onToggleTeamCVC }: TeamDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const teamsPerPage = 50; // Reduced for better performance

  const totalPages = Math.ceil(teams.length / teamsPerPage);
  const startIndex = (currentPage - 1) * teamsPerPage;
  const endIndex = startIndex + teamsPerPage;

  // Memoize current teams for performance
  const currentTeams = useMemo(() => {
    return teams.slice(startIndex, endIndex);
  }, [teams, startIndex, endIndex]);

  // Reset to page 1 when teams change
  useEffect(() => {
    setCurrentPage(1);
  }, [teams.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (teams.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Generated Teams</h2>
          <Badge variant="secondary" className="text-sm">
            {stats.totalCombinations.toLocaleString()} possible combinations
          </Badge>
        </div>

        {/* Empty State */}
        <div className={`text-center py-12 text-gray-500 ${isFullscreen ? 'px-6' : ''}`}>
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-lg font-medium mb-2">No teams generated yet</p>
          <p className="text-sm">Fill in all 22 player names and generate teams</p>
        </div>
      </Card>
    );
  }
  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white overflow-hidden flex flex-col" 
    : "";

  const cardClass = isFullscreen 
    ? "flex-1 flex flex-col h-full border-0 rounded-none shadow-none" 
    : "p-6";

  return (
    <div className={containerClass}>
      <Card className={cardClass}>
        <div className={`flex items-center justify-between mb-6 ${isFullscreen ? 'p-6 pb-0' : ''}`}>
          <h2 className="text-xl font-semibold text-gray-900">Generated Teams</h2>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </>
              )}
            </Button>
            <Badge variant="secondary" className="text-sm">
              {teams.length.toLocaleString()} teams generated
            </Badge>
            <Badge variant="outline" className="text-sm">
              Total: {stats.totalCombinations.toLocaleString()} possible
            </Badge>
          </div>
        </div>

      {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg ${isFullscreen ? 'mx-6' : ''}`}>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, teams.length)} of {teams.length} teams
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className={`space-y-4 ${isFullscreen ? 'flex-1 overflow-y-auto px-6' : 'max-h-96 overflow-y-auto'}`}>
        {currentTeams.map((team) => (
          <div 
            key={team.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150"
          >
            <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Team {team.id}
              </Badge>
              <span className="text-sm text-gray-500">
                {team.redCount} Red + {team.blackCount} Black
              </span>
            </h3>

            <div className="space-y-3">
              {/* C&VC Toggle Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => onToggleTeamCVC?.(team.id)}
                  size="sm"
                  variant="outline"
                  className={`text-xs ${
                    team.players.some(p => p.captainInfo || p.viceCaptainInfo)
                      ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
                      : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                  }`}
                >
                  {team.players.some(p => p.captainInfo || p.viceCaptainInfo) ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Hide C&VC
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Show C&VC
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                {team.players.map((player, playerIndex) => {
                  // Extract different parts of player information
                  const baseName = player.name.split(' (')[0];
                  const roleMatch = player.name.match(/\((wk|batter|bowler|allrounder)\)/);
                  const rankMatch = player.name.match(/\(r(\d+),\s*([\d.]+)%\)/);

                  // Determine player type if not available
                  const playerType = player.type || (playerIndex < team.redCount ? 'red' : 'black');

                  return (
                    <div key={playerIndex} className="flex items-center justify-start space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${playerType === 'red' ? 'bg-red-500' : 'bg-gray-800'}`}></span>
                        <span className={`text-sm font-medium ${playerType === 'red' ? 'text-red-600' : 'text-gray-800'}`}>
                          {baseName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        {/* Rank and percentage */}
                        {rankMatch && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            r{rankMatch[1]}, {rankMatch[2]}%
                          </span>
                        )}

                        {/* Selection percentage */}
                        {player.selectionPercentage && player.selectionPercentage > 0 && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {player.selectionPercentage.toFixed(2)}%
                          </span>
                        )}
                        {player.battingOrder && player.battingOrder > 0 && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            ({player.battingOrder})
                          </span>
                        )}

                        {/* Role */}
                        {roleMatch && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {roleMatch[1]}
                          </span>
                        )}

                        {/* Captain info */}
                        {player.captainInfo && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {player.captainInfo.replace(/,\s*[\d.]+%/, '')}
                          </span>
                        )}

                        {/* Vice-captain info */}
                        {player.viceCaptainInfo && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {player.viceCaptainInfo.replace(/,\s*[\d.]+%/, '')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className={`flex justify-center mt-4 ${isFullscreen ? 'px-6 pb-6' : ''}`}>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

const getPlayerRole = (playerName: string) => {
  // Extract role information from player name
  const roleMatch = playerName.match(/\((wk|batter|bowler|allrounder)\)/);
  if (roleMatch) {
    return roleMatch[1];
  }

  // Extract rank and percentage information
  const rankMatch = playerName.match(/\(r(\d+),\s*([\d.]+)%\)/);
  if (rankMatch) {
    return `Rank ${rankMatch[1]} (${rankMatch[2]}%)`;
  }

  // Check for captain/vice-captain
  if (playerName.toLowerCase().includes("captain")) {
    return "captain";
  }
  if (playerName.toLowerCase().includes("vice")) {
    return "vice-captain";
  }

  return null;
};