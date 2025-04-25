import { Card } from '../types';

export class CardManager {
  private static readonly CARD_TIMEOUT_SECONDS = 60;
  private static readonly ALLOWED_CARD_BALANCES = [100, 500] as const;
  private static readonly DEFAULT_CARD_BALANCE = 100;

  private currentCard: Card | null = null;
  private cardPaymentTimer: NodeJS.Timeout | null = null;
  private remainingSeconds: number = CardManager.CARD_TIMEOUT_SECONDS;
  private onTimeout: (() => void) | null = null;

  constructor(onTimeout?: () => void) {
    this.onTimeout = onTimeout || null;
  }

  /**
   * Inserts a card and starts the payment timer
   * @param cardType Type of card ('sufficient' or 'limited')
   * @param balance Balance for limited card (100 or 500)
   * @returns Result of card insertion
   */
  insertCard(
    cardType: 'sufficient' | 'limited',
    balance?: number
  ): { success: boolean; message?: string } {
    if (this.currentCard) {
      return {
        success: false,
        message: '이미 카드가 삽입되어 있습니다.',
      };
    }

    if (cardType === 'limited') {
      const cardBalance = balance || CardManager.DEFAULT_CARD_BALANCE;
      if (
        !CardManager.ALLOWED_CARD_BALANCES.includes(
          cardBalance as (typeof CardManager.ALLOWED_CARD_BALANCES)[number]
        )
      ) {
        return {
          success: false,
          message: '100원 또는 500원 카드만 사용 가능합니다.',
        };
      }

      this.currentCard = {
        type: cardType,
        balance: cardBalance,
      };
    } else {
      this.currentCard = {
        type: cardType,
        balance: Infinity,
      };
    }

    this.startCardPaymentTimer();
    return {
      success: true,
    };
  }

  /**
   * Starts the card payment timer
   */
  private startCardPaymentTimer(): void {
    this.clearCardPaymentTimer();
    this.remainingSeconds = CardManager.CARD_TIMEOUT_SECONDS;

    this.cardPaymentTimer = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  /**
   * Handles timer expiration
   */
  private handleTimeout(): void {
    this.clearCardPaymentTimer();
    this.currentCard = null;
    if (this.onTimeout) {
      this.onTimeout();
    }
  }

  /**
   * Clears the card payment timer
   */
  clearCardPaymentTimer(): void {
    if (this.cardPaymentTimer) {
      clearInterval(this.cardPaymentTimer);
      this.cardPaymentTimer = null;
    }
  }

  /**
   * Checks if the current card can make a purchase
   * @param price Price to check
   */
  canPurchase(price: number): boolean {
    if (!this.currentCard) return false;
    return this.currentCard.type === 'sufficient' || this.currentCard.balance >= price;
  }

  /**
   * Processes a purchase with the current card
   * @param price Price to purchase
   */
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

  /**
   * Resets the card manager to initial state
   */
  reset(): void {
    this.clearCardPaymentTimer();
    this.currentCard = null;
    this.remainingSeconds = CardManager.CARD_TIMEOUT_SECONDS;
  }

  /**
   * Returns the remaining seconds of the timer
   */
  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }
}
