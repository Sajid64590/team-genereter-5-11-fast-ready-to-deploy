import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, X } from "lucide-react";
import { GameData } from "@/types/team";
import { useToast } from "@/hooks/use-toast";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GameData;
}

export default function SaveModal({ isOpen, onClose, data }: SaveModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const jsonData = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "JSON data has been copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy data to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Save Data - JSON Export</DialogTitle>
          <p className="text-sm text-gray-600">
            Copy the JSON data below to save your player configuration
          </p>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={jsonData}
            readOnly
            className="h-64 font-mono text-sm resize-none"
            placeholder="JSON data will appear here..."
          />
        </div>
        
        <DialogFooter className="flex justify-end space-x-3">
          <Button 
            onClick={handleCopy}
            className="bg-green-600 hover:bg-green-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy JSON"}
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
