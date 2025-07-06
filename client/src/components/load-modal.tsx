import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Clipboard } from "lucide-react";
import { GameData } from "@/types/team";
import { useToast } from "@/hooks/use-toast";

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (data: GameData) => void;
}

export default function LoadModal({ isOpen, onClose, onLoad }: LoadModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleLoad = () => {
    try {
      const data = JSON.parse(jsonInput);
      
      if (!data.redPlayers || !data.blackPlayers || 
          !Array.isArray(data.redPlayers) || !Array.isArray(data.blackPlayers) ||
          data.redPlayers.length !== 11 || data.blackPlayers.length !== 11) {
        throw new Error('Invalid data structure');
      }
      
      onLoad(data);
      setJsonInput("");
      setError("");
      onClose();
      
    } catch (err) {
      setError("Invalid JSON format. Please check your data and try again.");
      toast({
        title: "Load Failed",
        description: "Invalid JSON format. Please check your data and try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      setError("");
      toast({
        title: "Pasted",
        description: "JSON data pasted from clipboard",
      });
    } catch (err) {
      toast({
        title: "Paste Failed",
        description: "Could not paste from clipboard. Please paste manually.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setJsonInput("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Load Data - JSON Import</DialogTitle>
          <p className="text-sm text-gray-600">
            Paste your JSON data below to load player configuration
          </p>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <Button 
              onClick={handlePasteFromClipboard}
              variant="outline"
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Paste from Clipboard
            </Button>
            <span className="text-sm text-gray-500">or paste manually in the text area below</span>
          </div>
          
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="h-64 font-mono text-sm resize-none"
            placeholder='Paste JSON data here...
Example:
{
  "redPlayers": ["Player1", "Player2", ...],
  "blackPlayers": ["Player12", "Player13", ...]
}'
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        
        <DialogFooter className="flex justify-end space-x-3">
          <Button 
            onClick={handleLoad}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!jsonInput.trim()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Load Data
          </Button>
          <Button 
            onClick={handleClose}
            variant="outline"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
