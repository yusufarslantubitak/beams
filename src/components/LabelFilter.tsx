import React, { useState, useEffect } from 'react';
import type { FilterGroup, RemoteSiteOption } from '@/hooks/useLabelFilter';
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
import { Filter, X, MapPin, Hexagon } from 'lucide-react';

interface LabelFilterProps {
  // Beams filters
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableGroups: FilterGroup[];
  availableLabels: string[];
  availableBeams: string[];
  availableArfcns?: string[];
  filteredGroups: FilterGroup[];
  filteredLabels: string[];
  filteredBeams: string[];
  filteredArfcns?: string[];

  // Markers filters
  selectedMarkerSites?: string[];
  onSelectedMarkerSitesChange?: (sites: string[]) => void;
  markerSearchQuery?: string;
  onMarkerSearchChange?: (query: string) => void;
  availableRemoteSites?: RemoteSiteOption[];
  filteredRemoteSites?: RemoteSiteOption[];

  // Active Tab
  activeTab?: 'beams' | 'markers';
  onActiveTabChange?: (tab: 'beams' | 'markers') => void;

  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  corner?: 'tl' | 'tr' | 'bl' | 'br';
}

export const LabelFilter: React.FC<LabelFilterProps> = ({
  // Beams
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

  // Markers
  selectedMarkerSites = [],
  onSelectedMarkerSitesChange,
  markerSearchQuery = '',
  onMarkerSearchChange,
  availableRemoteSites = [],
  filteredRemoteSites = [],

  // Tab
  activeTab: activeTabProp,
  onActiveTabChange: onActiveTabChangeProp,

  dragHandleProps,
  corner = 'tr',
}) => {
  const [activeTabLocal, setActiveTabLocal] = useState<'beams' | 'markers'>('beams');
  const activeTab = activeTabProp ?? activeTabLocal;
  const onActiveTabChange = onActiveTabChangeProp ?? setActiveTabLocal;

  const [isFocused, setIsFocused] = useState(false);
  const [isMarkerFocused, setIsMarkerFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() =>
    storage.getLabelFilterExpanded(),
  );

  useEffect(() => {
    storage.setLabelFilterExpanded(isExpanded);
  }, [isExpanded]);

  // --- Beams item toggle/remove ---
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

  // --- Markers remote-site toggle/remove ---
  const handleToggleMarkerSite = (siteValue: string) => {
    const site = siteValue.trim();
    if (!site || !onSelectedMarkerSitesChange) return;

    if (selectedMarkerSites.includes(site)) {
      onSelectedMarkerSitesChange(selectedMarkerSites.filter((s) => s !== site));
    } else {
      onSelectedMarkerSitesChange([...selectedMarkerSites, site]);
    }

    onMarkerSearchChange?.('');
  };

  const handleRemoveMarkerSite = (site: string) => {
    onSelectedMarkerSitesChange?.(selectedMarkerSites.filter((s) => s !== site));
  };

  const handleMarkerInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && markerSearchQuery.trim()) {
      e.preventDefault();
      // Match first filtered remote site or exact text
      const matched = filteredRemoteSites[0]?.site || markerSearchQuery.trim();
      handleToggleMarkerSite(matched);
    }
  };

  const isLeft = corner.includes('l');
  const isTop = corner.includes('t');

  const totalBeamsAvailable =
    availableGroups.length +
    availableLabels.length +
    availableBeams.length +
    availableArfcns.length;
  const totalBeamsFiltered =
    filteredGroups.length +
    filteredLabels.length +
    filteredBeams.length +
    filteredArfcns.length;

  const totalActiveFilters = selectedItems.length + selectedMarkerSites.length;

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
          className='bg-white/40 hover:bg-white/60 backdrop-blur-md border-white/30 shadow-lg py-5 px-5 cursor-move active:cursor-grabbing relative'
          aria-label='Open Filter'
        >
          <Filter className='w-4 h-4' />
          <span>Filter</span>
          {totalActiveFilters > 0 && (
            <span className='inline-flex items-center justify-center px-1.5 py-0.5 text-[9.5px] font-bold rounded-full bg-primary text-primary-foreground leading-none ml-0.5'>
              {totalActiveFilters}
            </span>
          )}
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
        <Card className='w-80 bg-white/60 backdrop-blur-lg border-white/30 shadow-lg py-0 gap-0 overflow-hidden'>
          {/* Header */}
          <CardHeader
            className='px-4 py-3 border-b border-border/50 cursor-move active:cursor-grabbing'
            {...dragHandleProps}
          >
            <CardTitle className='text-sm font-semibold'>Filter Map</CardTitle>
            <CardDescription className='text-xs'>
              {activeTab === 'beams'
                ? `${totalBeamsAvailable} beam options`
                : `${availableRemoteSites.length} remote sites`}
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

          {/* Segmented Tab Switcher */}
          <div className='px-4 pt-2.5 pb-2 border-b border-border/40 bg-white/20'>
            <div className='grid grid-cols-2 p-1 bg-slate-200/50 backdrop-blur-xs rounded-lg border border-border/30 gap-1'>
              <button
                type='button'
                onClick={() => onActiveTabChange('beams')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer select-none',
                  activeTab === 'beams'
                    ? 'bg-white text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/40',
                )}
              >
                <Hexagon className='w-3 h-3 opacity-70' />
                <span>Beams</span>
                {selectedItems.length > 0 && (
                  <span className='inline-flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold rounded-full bg-blue-100 text-blue-800 leading-none'>
                    {selectedItems.length}
                  </span>
                )}
              </button>
              <button
                type='button'
                onClick={() => onActiveTabChange('markers')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer select-none',
                  activeTab === 'markers'
                    ? 'bg-white text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/40',
                )}
              >
                <MapPin className='w-3 h-3 opacity-70' />
                <span>Markers</span>
                {selectedMarkerSites.length > 0 && (
                  <span className='inline-flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 leading-none'>
                    {selectedMarkerSites.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ================= BEAMS TAB CONTENT ================= */}
          {activeTab === 'beams' && (
            <>
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

              {/* Inline Command for Beams */}
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
                    placeholder='Search groups, beams, ARFCN, sat ID...'
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
                      {searchQuery.trim() && totalBeamsFiltered === 0 && (
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

              {/* Footer Stats for Beams */}
              {isFocused && selectedItems.length > 0 && (
                <CardFooter className='px-4 py-2 text-xs text-muted-foreground border-t border-border/40'>
                  {searchQuery
                    ? `${totalBeamsFiltered} / ${totalBeamsAvailable} matches`
                    : `${totalBeamsAvailable} items`}
                </CardFooter>
              )}
            </>
          )}

          {/* ================= MARKERS TAB CONTENT ================= */}
          {activeTab === 'markers' && (
            <>
              {/* Selected Marker Remote Sites Display */}
              {selectedMarkerSites.length > 0 && (
                <div className='px-4 py-3 border-b border-border/40 bg-muted/40'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-xs text-muted-foreground'>
                      Selected Sites ({selectedMarkerSites.length}):
                    </p>
                    <Button
                      variant='ghost'
                      size='xs'
                      onClick={() => onSelectedMarkerSitesChange?.([])}
                      onMouseDown={(e) => e.preventDefault()}
                      className='h-auto p-0 text-[10px] text-muted-foreground hover:text-foreground hover:bg-transparent font-medium cursor-pointer'
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {selectedMarkerSites.slice(0, 5).map((site) => (
                      <Badge
                        key={site}
                        variant='secondary'
                        className='border h-6 flex flex-row items-center justify-between px-2 cursor-pointer gap-1.5 bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100 transition-colors'
                        onClick={() => handleRemoveMarkerSite(site)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <span className='font-mono font-bold text-[10px]'>{site}</span>
                        <X className='w-3 h-3 opacity-60' />
                      </Badge>
                    ))}
                    {selectedMarkerSites.length > 5 && (
                      <Badge variant='outline' className='text-muted-foreground'>
                        +{selectedMarkerSites.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Inline Command for Markers Remote Sites */}
              <Command shouldFilter={false} className='bg-transparent pb-2'>
                <div
                  onFocus={() => setIsMarkerFocused(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsMarkerFocused(false);
                    }
                  }}
                >
                  <CommandInput
                    placeholder='Search remote site (e.g. RS-101)...'
                    value={markerSearchQuery}
                    onValueChange={onMarkerSearchChange}
                    onKeyDown={handleMarkerInputKeyDown}
                  />
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-in-out',
                      isMarkerFocused ? 'max-h-72 opacity-100 mt-1' : 'max-h-0 opacity-0',
                    )}
                  >
                    <CommandList className='bg-transparent rounded-md border border-border/20 shadow-none max-h-56'>
                      {markerSearchQuery.trim() && filteredRemoteSites.length === 0 && (
                        <CommandEmpty>
                          <span className='text-muted-foreground'>
                            No remote sites found for <strong>"{markerSearchQuery.trim()}"</strong>
                          </span>
                        </CommandEmpty>
                      )}

                      {filteredRemoteSites.length > 0 && (
                        <CommandGroup heading='Remote Sites'>
                          {filteredRemoteSites.map((option) => {
                            const isChecked = selectedMarkerSites.includes(option.site);
                            return (
                              <CommandItem
                                key={option.site}
                                value={option.site}
                                checked={isChecked}
                                onSelect={() => handleToggleMarkerSite(option.site)}
                              >
                                <div className='flex items-center justify-between w-full min-w-0 pr-1'>
                                  <span className='font-mono font-semibold text-xs text-foreground'>
                                    {option.site}
                                  </span>
                                  {option.markerCount > 1 && (
                                    <span className='text-[9.5px] font-mono text-muted-foreground ml-1.5 shrink-0 bg-muted px-1.5 py-0.5 rounded'>
                                      {option.markerCount} markers
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </div>
                </div>
              </Command>

              {/* Footer Stats for Markers */}
              {isMarkerFocused && selectedMarkerSites.length > 0 && (
                <CardFooter className='px-4 py-2 text-xs text-muted-foreground border-t border-border/40'>
                  {markerSearchQuery
                    ? `${filteredRemoteSites.length} / ${availableRemoteSites.length} matches`
                    : `${availableRemoteSites.length} remote sites`}
                </CardFooter>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
