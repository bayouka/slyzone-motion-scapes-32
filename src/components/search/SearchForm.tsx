
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchFormProps {
  onSearch: (value: string) => void;
  isLoading: boolean;
}

const SearchForm = React.memo(({ onSearch, isLoading }: SearchFormProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2">
      <div className="relative flex-1">
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
      <Button 
        type="submit"
        disabled={isLoading || !inputValue.trim()}
      >
        Rechercher
      </Button>
    </form>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm;
