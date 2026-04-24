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
} from '@/components/ui/command';
import { Filter, X } from 'lucide-react';

interface LabelFilterProps {
  selectedLabels: string[];
  onSelectedLabelsChange: (labels: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredLabels: string[];
  availableLabels: string[];
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  corner?: 'tl' | 'tr' | 'bl' | 'br';
}

export const LabelFilter: React.FC<LabelFilterProps> = ({
  selectedLabels,
  onSelectedLabelsChange,
  searchQuery,
  onSearchChange,
  filteredLabels,
  availableLabels,
  dragHandleProps,
  corner = 'tr',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    () => storage.getLabelFilterExpanded(),
  );

  useEffect(() => {
    storage.setLabelFilterExpanded(isExpanded);
  }, [isExpanded]);

  const handleToggleLabel = (labelValue: string) => {
    const label = labelValue.trim();
    if (!label) return;

    if (selectedLabels.includes(label)) {
      onSelectedLabelsChange(selectedLabels.filter((l) => l !== label));
    } else {
      onSelectedLabelsChange([...selectedLabels, label]);
    }

    onSearchChange('');
  };

  const handleRemoveLabel = (label: string) => {
    onSelectedLabelsChange(selectedLabels.filter((l) => l !== label));
  };

  const handleCommandInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      handleToggleLabel(searchQuery);
    }
  };

  const displayLabels = searchQuery ? filteredLabels : availableLabels;

  const isLeft = corner.includes('l');
  const isTop = corner.includes('t');

  return (
    <div className={cn(
      'relative grid grid-cols-1 grid-rows-1',
      isTop ? 'items-start' : 'items-end',
      isLeft ? 'justify-items-start' : 'justify-items-end'
    )}>
      {/* Collapse/Expand Button */}
      <div className={cn(
        'row-start-1 col-start-1 transition-all duration-300 ease-in-out transform',
        isTop ? (isLeft ? 'origin-top-left' : 'origin-top-right') : (isLeft ? 'origin-bottom-left' : 'origin-bottom-right'),
        isExpanded ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
      )}>
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
      <div className={cn(
        'row-start-1 col-start-1 transition-all duration-300 ease-in-out transform',
        isTop ? (isLeft ? 'origin-top-left' : 'origin-top-right') : (isLeft ? 'origin-bottom-left' : 'origin-bottom-right'),
        isExpanded ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
      )}>
        <Card className='w-80 bg-white/60 backdrop-blur-lg border-white/30 shadow-lg py-0 gap-0'>
          {/* Header */}
          <CardHeader className='px-4 py-3 border-b border-border/50 cursor-move active:cursor-grabbing' {...dragHandleProps}>
            <CardTitle className='text-sm'>Filter by Label</CardTitle>
            <CardDescription className='text-xs'>
              {availableLabels.length} items available
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

          {/* Selected Labels Display */}
          {selectedLabels.length > 0 && (
            <div className='px-4 py-3 border-b border-border/40 bg-muted/40'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-xs text-muted-foreground'>
                  Selected ({selectedLabels.length}):
                </p>
                <Button
                  variant='ghost'
                  size='xs'
                  onClick={() => onSelectedLabelsChange([])}
                  className='h-auto p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent font-medium cursor-pointer'
                >
                  Clear All
                </Button>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {selectedLabels.slice(0, 5).map((label) => (
                  <Badge
                    key={label}
                    variant='secondary'
                    className='cursor-pointer gap-1 bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-200/50'
                    onClick={() => handleRemoveLabel(label)}
                  >
                    {label}
                    <X className='w-3 h-3 opacity-60 group-hover/badge:opacity-100' />
                  </Badge>
                ))}
                {selectedLabels.length > 5 && (
                  <Badge variant='outline' className='text-muted-foreground'>
                    +{selectedLabels.length - 5} more
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
                // Only close if focus leaves the entire Command block
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsFocused(false);
                }
              }}
            >
              <CommandInput
                placeholder='Search or type item...'
                value={searchQuery}
                onValueChange={onSearchChange}
                onKeyDown={handleCommandInputKeyDown}
              />
              <div className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                isFocused ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
              )}>
                <CommandList className='bg-transparent rounded-md border border-border/20 shadow-none max-h-48'>
                  <CommandEmpty>
                    {searchQuery.trim() ? (
                      <span className='text-muted-foreground'>
                        Add <strong>"{searchQuery.trim()}"</strong> with Enter
                      </span>
                    ) : (
                      'No matching items found.'
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {displayLabels.map((label) => (
                      <CommandItem
                        key={label}
                        value={label}
                        data-checked={selectedLabels.includes(label)}
                        onSelect={() => handleToggleLabel(label)}
                      >
                        {label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </div>
            </div>
          </Command>

          {/* Footer Stats */}
          {isFocused && selectedLabels.length > 0 && (
            <CardFooter className='px-4 py-2 text-xs text-muted-foreground border-t border-border/40'>
              {searchQuery
                ? `${displayLabels.length} / ${availableLabels.length} matches`
                : `${availableLabels.length} items`}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};
