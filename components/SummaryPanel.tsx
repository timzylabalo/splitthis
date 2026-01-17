import React, { useMemo } from 'react';
import { ReceiptData, PersonSummary } from '../types';
import { Wallet, Users, ChevronRight } from 'lucide-react';

interface SummaryPanelProps {
  receipt: ReceiptData;
}

// Helper (duplicated for visual consistency - ideal to move to utils in larger app)
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700',
    'bg-green-100 text-green-700', 'bg-emerald-100 text-emerald-700', 'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700', 'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700', 'bg-purple-100 text-purple-700', 'bg-fuchsia-100 text-fuchsia-700',
    'bg-pink-100 text-pink-700', 'bg-rose-100 text-rose-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ receipt }) => {
  const summary = useMemo<PersonSummary[]>(() => {
    const peopleMap = new Map<string, PersonSummary>();
    const unassignedItems: typeof receipt.items = [];

    const getPerson = (name: string) => {
      if (!peopleMap.has(name)) {
        peopleMap.set(name, {
          name,
          items: [],
          subtotal: 0,
          taxShare: 0,
          tipShare: 0,
          totalOwed: 0,
        });
      }
      return peopleMap.get(name)!;
    };

    receipt.items.forEach((item) => {
      if (item.assignedTo.length === 0) {
        unassignedItems.push(item);
        return;
      }
      const splitPrice = item.price / item.assignedTo.length;
      item.assignedTo.forEach((personName) => {
        const person = getPerson(personName);
        person.items.push(item);
        person.subtotal += splitPrice;
      });
    });

    const safeSubtotal = receipt.subtotal || 1; 
    const taxRatio = receipt.tax / safeSubtotal;
    const tipRatio = receipt.tip / safeSubtotal;

    const people = Array.from(peopleMap.values()).map(person => {
      person.taxShare = person.subtotal * taxRatio;
      person.tipShare = person.subtotal * tipRatio;
      person.totalOwed = person.subtotal + person.taxShare + person.tipShare;
      return person;
    });

    return people.sort((a, b) => b.totalOwed - a.totalOwed);
  }, [receipt]);

  const totalAssigned = summary.reduce((sum, p) => sum + p.totalOwed, 0);
  const percentCovered = receipt.total > 0 ? (totalAssigned / receipt.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-gray-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-300" />
            <h2 className="font-bold text-lg">Summary</h2>
        </div>
        <div className="text-right">
             <div className="text-xs text-gray-400 uppercase font-bold">Total Collected</div>
             <div className={`font-mono font-bold ${percentCovered >= 99 ? 'text-green-400' : 'text-gray-200'}`}>
                {Math.round(percentCovered)}%
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {summary.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                 <Users className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-medium text-gray-600">No items assigned yet</p>
            <p className="text-sm mt-1">Tap items on the receipt to start splitting.</p>
          </div>
        ) : (
          summary.map((person) => (
            <div key={person.name} className="group bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(person.name)}`}>
                        {getInitials(person.name)}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{person.name}</h4>
                        <p className="text-xs text-gray-500">{person.items.length} items</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xl font-black text-gray-900 leading-none">
                        {receipt.currency}{person.totalOwed.toFixed(2)}
                    </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                <span>Sub: {receipt.currency}{person.subtotal.toFixed(2)}</span>
                <span className="text-gray-300">|</span>
                <span>Tax: {receipt.currency}{person.taxShare.toFixed(2)}</span>
                <span className="text-gray-300">|</span>
                <span>Tip: {receipt.currency}{person.tipShare.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {summary.length > 0 && (
         <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                Mark as Paid <ChevronRight className="w-4 h-4" />
            </button>
         </div>
      )}
    </div>
  );
};
