import { Card } from '../types';

export class CardManager {
  private currentCard: Card | null = null;
  private cardPaymentTimer: NodeJS.Timeout | null = null;
  private remainingSeconds: number = 60;
  private onTimeout: (() => void) | null = null;

  constructor(onTimeout?: () => void) {
    this.onTimeout = onTimeout || null;
  }

  insertCard(cardType: 'sufficient' | 'limited'): { success: boolean; message?: string } {
    if (this.currentCard) {
      return {
        success: false,
        message: '이미 카드가 삽입되어 있습니다.',
      };
    }

    this.currentCard = {
      type: cardType,
      balance: cardType === 'sufficient' ? Infinity : 1000,
    };
    this.startCardPaymentTimer();

    return {
      success: true,
      message: `${cardType === 'sufficient' ? '잔액이 충분한' : '잔액 1000원'} 카드가 삽입되었습니다.`,
    };
  }

  private startCardPaymentTimer(): void {
    this.clearCardPaymentTimer();
    this.remainingSeconds = 60;

    this.cardPaymentTimer = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.clearCardPaymentTimer();
        this.currentCard = null;
        if (this.onTimeout) {
          this.onTimeout();
        }
      }
    }, 1000);
  }

  clearCardPaymentTimer(): void {
    if (this.cardPaymentTimer) {
      clearInterval(this.cardPaymentTimer);
      this.cardPaymentTimer = null;
    }
  }

  getCurrentCard(): Card | null {
    return this.currentCard;
  }

  canPurchase(price: number): boolean {
    if (!this.currentCard) return false;
    return this.currentCard.type === 'sufficient' || this.currentCard.balance >= price;
  }

  purchase(price: number): { success: boolean; message?: string } {
    if (!this.currentCard) {
      return {
        success: false,
        message: '카드가 삽입되어 있지 않습니다.',
      };
    }

    if (!this.canPurchase(price)) {
      return {
        success: false,
        message: '카드 잔액이 부족합니다.',
      };
    }

    if (this.currentCard.type === 'limited') {
      this.currentCard.balance -= price;
    }

    return { success: true };
  }

  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  reset(): void {
    this.clearCardPaymentTimer();
    this.currentCard = null;
    this.remainingSeconds = 60;
  }

  hasCard(): boolean {
    return this.currentCard !== null;
  }
}
