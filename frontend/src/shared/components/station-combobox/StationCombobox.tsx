import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { buttonVariants } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/shared/utils/cn";
import { useStations } from "../../api/stations.api";
import type { Station } from "../../api/stations.api";
import { useDebounce } from "../../hooks/useDebounce";

interface StationComboboxProps {
  value?: Station | null;
  onChange: (station: Station | null) => void;
  placeholder?: string;
  excludeStation?: Station | null;
}

export function StationCombobox({
  value,
  onChange,
  placeholder = "Select station",
  excludeStation,
}: StationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data: stations = [], isLoading } = useStations(debouncedSearch);
  const filtered = stations.filter((s) => s.id !== excludeStation?.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full h-10 justify-between text-left font-normal"
        )}
      >
        {value ? (
          <span className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-primary" />
            <span className="font-medium text-slate-600">{value.code}</span>
            <span className="text-slate-500 text-sm">{value.name}</span>
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type station name or code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
            {!isLoading && filtered.length === 0 && (
              <CommandEmpty>No station found. Type at least 2 characters.</CommandEmpty>
            )}
            <CommandGroup>
              {filtered.map((station) => (
                <CommandItem
                  key={station.id}
                  value={station.id}
                  onSelect={() => {
                    onChange(station);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === station.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p className="font-medium">
                      {station.code} — {station.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {station.city}, {station.state}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
