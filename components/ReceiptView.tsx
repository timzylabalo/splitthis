import React, { useState } from 'react';
import { ReceiptData, ReceiptItem } from '../types';
import { User, Receipt as ReceiptIcon, Check, Copy } from 'lucide-react';

interface ReceiptViewProps {
  data: ReceiptData;
  attendees: string[];
  onAssignItem: (itemId: string, assignedTo: string[]) => void;
  sessionCode: string;
}

// Helper to generate consistent colors for names
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-100 text-red-700 border-red-200',
    'bg-orange-100 text-orange-700 border-orange-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-rose-100 text-rose-700 border-rose-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  return name.slice(0, 2).toUpperCase();
};

export const ReceiptView: React.FC<ReceiptViewProps> = ({ data, attendees, onAssignItem, sessionCode }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full relative">
      {/* Session Header */}
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 opacity-80" />
            Receipt
          </h2>
          <p className="text-indigo-200 text-xs">{data.items.length} items to split</p>
        </div>
        <div 
          onClick={copyCode}
          className="bg-indigo-700/50 hover:bg-indigo-700 cursor-pointer border border-indigo-500 rounded-lg px-3 py-1.5 flex flex-col items-center transition-colors"
        >
          <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-medium">Session Code</span>
          <div className="flex items-center gap-2">
             <span className="font-mono font-bold text-lg tracking-widest">{sessionCode}</span>
             {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3 text-indigo-300" />}
          </div>
        </div>
      </div>

      {/* Scrollable Items Area */}
      <div className="overflow-y-auto flex-1 p-3 bg-gray-50/50 space-y-3 pb-20">
        {data.items.map((item) => (
          <ReceiptItemCard 
            key={item.id} 
            item={item} 
            currency={data.currency} 
            attendees={attendees}
            onUpdateAssignment={(newAssigned) => onAssignItem(item.id, newAssigned)}
          />
        ))}
      </div>

      {/* Floating Bottom Totals */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end">
            <div className="text-sm text-gray-500 space-y-1">
                <div className="flex gap-4">
                    <span>Tax: {data.currency}{data.tax.toFixed(2)}</span>
                    <span>Tip: {data.currency}{data.tip.toFixed(2)}</span>
                </div>
            </div>
            <div className="text-right">
                <span className="block text-xs text-gray-400 uppercase font-bold">Total Bill</span>
                <span className="text-2xl font-black text-gray-900 leading-none">{data.currency}{data.total.toFixed(2)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

interface ReceiptItemCardProps {
  item: ReceiptItem;
  currency: string;
  attendees: string[];
  onUpdateAssignment: (assignedTo: string[]) => void;
}

const ReceiptItemCard: React.FC<ReceiptItemCardProps> = ({ item, currency, attendees, onUpdateAssignment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAssigned = item.assignedTo.length > 0;
  const isFullyAssigned = item.assignedTo.length === attendees.length;

  const togglePerson = (name: string) => {
    if (item.assignedTo.includes(name)) {
      onUpdateAssignment(item.assignedTo.filter(p => p !== name));
    } else {
      onUpdateAssignment([...item.assignedTo, name]);
    }
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFullyAssigned) {
        onUpdateAssignment([]);
    } else {
        onUpdateAssignment([...attendees]);
    }
  };

  return (
    <div 
        className={`
            group rounded-xl border transition-all duration-200 overflow-hidden bg-white
            ${isExpanded ? 'ring-2 ring-indigo-500 border-transparent shadow-lg z-10' : 'border-gray-200 shadow-sm hover:border-indigo-300'}
        `}
    >
      {/* Card Header / Main Row */}
      <div 
        className="p-4 cursor-pointer relative" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-gray-900 leading-snug ${isAssigned ? '' : 'text-gray-700'}`}>
                    {item.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                        {currency}{item.price.toFixed(2)}
                    </span>
                    {item.assignedTo.length > 0 && (
                        <span className="text-xs text-gray-500">
                             {(item.price / item.assignedTo.length).toFixed(2)} / person
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex -space-x-2 overflow-hidden pl-2 py-1">
                {item.assignedTo.length === 0 ? (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-300" />
                    </div>
                ) : (
                    item.assignedTo.slice(0, 4).map((person, i) => (
                        <div 
                            key={i} 
                            className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm ${getAvatarColor(person)}`}
                            title={person}
                        >
                            {getInitials(person)}
                        </div>
                    ))
                )}
                {item.assignedTo.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-500 font-bold z-10">
                        +{item.assignedTo.length - 4}
                    </div>
                )}
            </div>
        </div>
        
        {/* Expansion Indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 transition-opacity ${isExpanded ? 'opacity-100' : ''}`} />
      </div>

      {/* Expanded Selection Area */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Who had this?</p>
            <button 
                onClick={toggleAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
            >
                {isFullyAssigned ? 'Clear All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {attendees.map(person => {
                const isSelected = item.assignedTo.includes(person);
                return (
                    <button
                        key={person}
                        onClick={(e) => { e.stopPropagation(); togglePerson(person); }}
                        className={`
                            flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all
                            ${isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                            }
                        `}
                    >
                        <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                            ${isSelected ? 'bg-white/20 text-white' : getAvatarColor(person)}
                        `}>
                            {getInitials(person)}
                        </div>
                        <span className="truncate">{person}</span>
                        {isSelected && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
};