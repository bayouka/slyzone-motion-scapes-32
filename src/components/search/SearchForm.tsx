
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  onDebouncedSearchChange: (value: string) => void;
  isLoading: boolean;
}

const SearchForm = React.memo(({ onDebouncedSearchChange, isLoading }: SearchFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onDebouncedSearchChange(inputValue);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [inputValue, onDebouncedSearchChange]);

  return (
    <div className="relative">
      <Input 
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Rechercher par pseudo..."
        className="pl-10 bg-white/70 backdrop-blur-sm"
        disabled={isLoading}
      />
      <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
    </div>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm;
