import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from '@/components/ui/card';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Filter, X } from 'lucide-react';

interface FilterGroup {
  name: string;
  color: string;
}

interface LabelFilterProps {
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableGroups: FilterGroup[];
  availableLabels: string[];
  availableBeams: string[];
  availableArfcns: string[];
  filteredGroups: FilterGroup[];
  filteredLabels: string[];
  filteredBeams: string[];
  filteredArfcns: string[];
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  corner?: 'tl' | 'tr' | 'bl' | 'br';
}

export const LabelFilter: React.FC<LabelFilterProps> = ({
  selectedItems,
  onSelectedItemsChange,
  searchQuery,
  onSearchChange,
  availableGroups,
  availableLabels,
  availableBeams,
  availableArfcns = [],
  filteredGroups,
  filteredLabels,
  filteredBeams,
  filteredArfcns = [],
  dragHandleProps,
  corner = 'tr',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() =>
    storage.getLabelFilterExpanded(),
  );

  useEffect(() => {
    storage.setLabelFilterExpanded(isExpanded);
  }, [isExpanded]);

  const handleToggleItem = (itemValue: string) => {
    const item = itemValue.trim();
    if (!item) return;

    if (selectedItems.includes(item)) {
      onSelectedItemsChange(selectedItems.filter((l) => l !== item));
    } else {
      onSelectedItemsChange([...selectedItems, item]);
    }

    onSearchChange('');
  };

  const handleRemoveItem = (item: string) => {
    onSelectedItemsChange(selectedItems.filter((l) => l !== item));
  };

  const handleCommandInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      handleToggleItem(searchQuery);
    }
  };

  const isLeft = corner.includes('l');
  const isTop = corner.includes('t');

  const totalAvailable =
    availableGroups.length +
    availableLabels.length +
    availableBeams.length +
    availableArfcns.length;
  const totalFiltered =
    filteredGroups.length +
    filteredLabels.length +
    filteredBeams.length +
    filteredArfcns.length;

  return (
    <div
      className={cn(
        'relative grid grid-cols-1 grid-rows-1',
        isTop ? 'items-start' : 'items-end',
        isLeft ? 'justify-items-start' : 'justify-items-end',
      )}
    >
      {/* Collapse/Expand Button */}
      <div
        className={cn(
          'row-start-1 col-start-1 transition-all duration-300 ease-in-out transform',
          isTop
            ? isLeft
              ? 'origin-top-left'
              : 'origin-top-right'
            : isLeft
              ? 'origin-bottom-left'
              : 'origin-bottom-right',
          isExpanded
            ? 'opacity-0 scale-90 pointer-events-none'
            : 'opacity-100 scale-100 pointer-events-auto',
        )}
      >
        <Button
          variant='outline'
          size='sm'
          onClick={() => setIsExpanded(true)}
          {...dragHandleProps}
          className='bg-white/40 hover:bg-white/60 backdrop-blur-md border-white/30 shadow-lg py-5 px-5 cursor-move active:cursor-grabbing'
          aria-label='Open Filter'
        >
          <Filter className='w-4 h-4' />
          <span>Filter</span>
        </Button>
      </div>

      {/* Filter Panel */}
      <div
        className={cn(
          'row-start-1 col-start-1 transition-all duration-300 ease-in-out transform',
          isTop
            ? isLeft
              ? 'origin-top-left'
              : 'origin-top-right'
            : isLeft
              ? 'origin-bottom-left'
              : 'origin-bottom-right',
          isExpanded
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none',
        )}
      >
        <Card className='w-80 bg-white/60 backdrop-blur-lg border-white/30 shadow-lg py-0 gap-0'>
          {/* Header */}
          <CardHeader
            className='px-4 py-3 border-b border-border/50 cursor-move active:cursor-grabbing'
            {...dragHandleProps}
          >
            <CardTitle className='text-sm'>Filter Map</CardTitle>
            <CardDescription className='text-xs'>
              {totalAvailable} options available
            </CardDescription>
            <CardAction>
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={() => setIsExpanded(false)}
                className='text-muted-foreground hover:text-foreground'
                aria-label='Close'
              >
                <X className='w-4 h-4' />
              </Button>
            </CardAction>
          </CardHeader>

          {/* Selected Items Display */}
          {selectedItems.length > 0 && (
            <div className='px-4 py-3 border-b border-border/40 bg-muted/40'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-xs text-muted-foreground'>
                  Selected ({selectedItems.length}):
                </p>
                <Button
                  variant='ghost'
                  size='xs'
                  onClick={() => onSelectedItemsChange([])}
                  onMouseDown={(e) => e.preventDefault()}
                  className='h-auto p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent font-medium cursor-pointer'
                >
                  Clear All
                </Button>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {selectedItems.slice(0, 5).map((item) => {
                  const group = availableGroups.find((g) => g.name === item);
                  return (
                    <Badge
                      key={item}
                      variant='secondary'
                      className={cn(
                        'border h-6 flex flex-row items-center justify-between px-1.5 cursor-pointer gap-1.5',
                        group
                          ? 'bg-white text-foreground hover:border-slate-300 border-slate-200'
                          : 'bg-blue-100 text-blue-900 hover:bg-blue-200 border-transparent',
                      )}
                      onClick={() => handleRemoveItem(item)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {group && (
                        <span
                          className='w-2 h-2 rounded-full'
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      {item}
                      <X className='w-3 h-3 opacity-60' />
                    </Badge>
                  );
                })}
                {selectedItems.length > 5 && (
                  <Badge variant='outline' className='text-muted-foreground'>
                    +{selectedItems.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Inline Command */}
          <Command shouldFilter={false} className='bg-transparent pb-2'>
            <div
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsFocused(false);
                }
              }}
            >
              <CommandInput
                placeholder='Search...'
                value={searchQuery}
                onValueChange={onSearchChange}
                onKeyDown={handleCommandInputKeyDown}
              />
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  isFocused ? 'max-h-72 opacity-100 mt-1' : 'max-h-0 opacity-0',
                )}
              >
                <CommandList className='bg-transparent rounded-md border border-border/20 shadow-none max-h-56'>
                  {searchQuery.trim() && totalFiltered === 0 && (
                    <CommandEmpty>
                      <span className='text-muted-foreground'>
                        Add <strong>"{searchQuery.trim()}"</strong> with Enter
                      </span>
                    </CommandEmpty>
                  )}

                  {filteredGroups.length > 0 && (
                    <CommandGroup heading='Machine Nos'>
                      {filteredGroups.map((group) => (
                        <CommandItem
                          key={group.name}
                          value={group.name}
                          checked={selectedItems.includes(group.name)}
                          onSelect={() => handleToggleItem(group.name)}
                        >
                          <div className='flex items-center gap-2'>
                            <span
                              className='w-2.5 h-2.5 rounded-full border border-black/10'
                              style={{ backgroundColor: group.color }}
                            />
                            {group.name}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {filteredGroups.length > 0 && filteredBeams.length > 0 && (
                    <CommandSeparator className='my-1 border-border/20' />
                  )}

                  {filteredBeams.length > 0 && (
                    <CommandGroup heading='Spot Beams'>
                      {filteredBeams.map((beam) => (
                        <CommandItem
                          key={beam}
                          value={beam}
                          checked={selectedItems.includes(beam)}
                          onSelect={() => handleToggleItem(beam)}
                        >
                          {beam}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {filteredArfcns.length > 0 && (
                    <CommandGroup heading='ARFCN'>
                      {filteredArfcns.map((a) => (
                        <CommandItem
                          key={a}
                          value={a}
                          checked={selectedItems.includes(a)}
                          onSelect={() => handleToggleItem(a)}
                        >
                          {a}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {(filteredGroups.length > 0 || filteredBeams.length > 0) &&
                    filteredLabels.length > 0 && (
                      <CommandSeparator className='my-1 border-border/20' />
                    )}

                  {filteredLabels.length > 0 && (
                    <CommandGroup heading='Sat IDs'>
                      {filteredLabels.map((label) => (
                        <CommandItem
                          key={label}
                          value={label}
                          checked={selectedItems.includes(label)}
                          onSelect={() => handleToggleItem(label)}
                        >
                          {label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </div>
            </div>
          </Command>

          {/* Footer Stats */}
          {isFocused && selectedItems.length > 0 && (
            <CardFooter className='px-4 py-2 text-xs text-muted-foreground border-t border-border/40'>
              {searchQuery
                ? `${totalFiltered} / ${totalAvailable} matches`
                : `${totalAvailable} items`}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};
