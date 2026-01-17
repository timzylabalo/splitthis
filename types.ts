export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // List of names
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface PersonSummary {
  name: string;
  items: ReceiptItem[];
  subtotal: number;
  taxShare: number;
  tipShare: number;
  totalOwed: number;
}
