
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
}

const SearchForm = ({ searchTerm, onSearchChange, isLoading }: SearchFormProps) => {
  return (
    <div className="relative">
      <Input 
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher par pseudo..."
        className="pl-10 bg-white/70 backdrop-blur-sm"
        disabled={isLoading}
      />
      <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
    </div>
  );
};

export default SearchForm;
