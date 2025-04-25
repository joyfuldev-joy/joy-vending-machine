export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Money {
  amount: number;
  count: number;
}

export enum VendingMachineMode {
  IDLE = 'IDLE',
  CASH = 'CASH',
  CARD = 'CARD',
}

export interface Card {
  type: 'sufficient' | 'limited';
  balance: number;
}
