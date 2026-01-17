import React, { useState } from 'react';
import { Users, Plus, X, ArrowRight } from 'lucide-react';

interface AttendeeSetupProps {
  attendees: string[];
  onAddAttendee: (name: string) => void;
  onRemoveAttendee: (name: string) => void;
  onContinue: () => void;
}

export const AttendeeSetup: React.FC<AttendeeSetupProps> = ({ 
  attendees, 
  onAddAttendee, 
  onRemoveAttendee,
  onContinue 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      onAddAttendee(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Who's eating?</h2>
        <p className="text-gray-500 mt-2">Add everyone who is sharing this bill.</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter name (e.g. Sarah)"
          className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="mb-8">
        {attendees.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
            No attendees added yet
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attendees.map((name) => (
              <div 
                key={name} 
                className="group flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-medium"
              >
                <span>{name}</span>
                <button
                  onClick={() => onRemoveAttendee(name)}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={attendees.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        Continue to Split <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
