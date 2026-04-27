import * as React from 'react';
import {
  useState,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { SearchIcon, CheckIcon } from 'lucide-react';

/* ---- Context ----------------------------------------------- */
interface CommandContextValue {
  search: string;
  setSearch: (value: string) => void;
  selectedValue: string;
  setSelectedValue: (value: string) => void;
  filter?: boolean;
}

const CommandContext = createContext<CommandContextValue>({
  search: '',
  setSearch: () => {},
  selectedValue: '',
  setSelectedValue: () => {},
});

function useCommandContext() {
  return useContext(CommandContext);
}

/* ---- Command ----------------------------------------------- */
function Command({
  className,
  shouldFilter = true,
  children,
  ...props
}: React.ComponentProps<'div'> & { shouldFilter?: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState('');

  const ctx = useMemo(
    () => ({
      search,
      setSearch,
      selectedValue,
      setSelectedValue,
      filter: shouldFilter,
    }),
    [search, selectedValue, shouldFilter],
  );

  return (
    <CommandContext.Provider value={ctx}>
      <div data-slot='command' className={cn(className)} {...props}>
        {children}
      </div>
    </CommandContext.Provider>
  );
}

/* ---- CommandDialog ----------------------------------------- */
function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  ...props
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className='sr-only'>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('overflow-hidden rounded-xl p-0', className)}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ---- CommandInput ------------------------------------------ */
function CommandInput({
  className,
  value,
  onValueChange,
  placeholder,
  onKeyDown,
  ...props
}: React.ComponentProps<'input'> & {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const { search, setSearch } = useCommandContext();
  const displayValue = value !== undefined ? value : search;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setSearch(v);
      onValueChange?.(v);
    },
    [setSearch, onValueChange],
  );

  return (
    <div data-slot='command-input-wrapper'>
      <InputGroup className='h-8 rounded-lg bg-input/5 shadow-none'>
        <input
          data-slot='command-input'
          className={cn(className)}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className='size-4 shrink-0 opacity-50' />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

/* ---- CommandList ------------------------------------------- */
function CommandList({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot='command-list' className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/* ---- CommandEmpty ------------------------------------------ */
function CommandEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot='command-empty' className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/* ---- CommandGroup ------------------------------------------ */
function CommandGroup({
  className,
  children,
  heading,
  ...props
}: React.ComponentProps<'div'> & { heading?: string }) {
  return (
    <div data-slot='command-group' className={cn(className)} {...props}>
      {heading && <div cmdk-group-heading=''>{heading}</div>}
      {children}
    </div>
  );
}

/* ---- CommandItem ------------------------------------------- */
function CommandItem({
  className,
  children,
  value,
  onSelect,
  checked,
  ...props
}: Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  value?: string;
  onSelect?: (value: string) => void;
  checked?: boolean;
}) {
  const { selectedValue, setSelectedValue } = useCommandContext();
  const isSelected = value !== undefined && selectedValue === value;
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (value !== undefined) {
      setSelectedValue(value);
      onSelect?.(value);
    }
  }, [value, setSelectedValue, onSelect]);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      ref.current.setAttribute('data-selected', 'true');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.setAttribute('data-selected', 'false');
    }
  }, []);

  return (
    <div
      ref={ref}
      data-slot='command-item'
      data-selected='false'
      data-checked={checked}
      className={cn(className)}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role='option'
      aria-selected={isSelected}
      {...props}
    >
      {children}
      <CheckIcon
        className='ml-auto'
        style={{
          opacity: checked ? 1 : 0,
        }}
      />
    </div>
  );
}

/* ---- CommandShortcut --------------------------------------- */
function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='command-shortcut'
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

/* ---- CommandSeparator -------------------------------------- */
function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div data-slot='command-separator' className={cn(className)} {...props} />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
