export interface WalletData {
  currentBalance: number;
  limit: number;
  hasPaymentDue: boolean;
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  name: string;
  description: string;
  date: Date;
  status: string;
  authorizedBy?: string;
  totalAward: number;
  icon: string;
}