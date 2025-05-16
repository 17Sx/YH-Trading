"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Journal {
  id: string;
  name: string;
}

interface JournalSelectorProps {
  journals: Journal[];
  selectedJournalId?: string;
  showAllOption?: boolean;
  onJournalChange?: (value: string) => void;
}

export function JournalSelector({ 
  journals, 
  selectedJournalId, 
  showAllOption = false,
  onJournalChange 
}: JournalSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleJournalChange = (value: string) => {
    const params = new URLSearchParams();
    if (value !== "all") {
      params.set("journalId", value);
    }
    router.push(`${pathname}?${params.toString()}`);
    onJournalChange?.(value);
  };

  return (
    <Select
      value={selectedJournalId || "all"}
      onValueChange={handleJournalChange}
    >
      <SelectTrigger className="w-[200px] bg-gray-800/70 border-gray-700/50 text-gray-200">
        <SelectValue placeholder="Sélectionner un journal" />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {showAllOption && (
          <SelectItem value="all" className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700">
            Tous les journaux
          </SelectItem>
        )}
        {journals.map((journal) => (
          <SelectItem
            key={journal.id}
            value={journal.id}
            className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
          >
            {journal.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 