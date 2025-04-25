import { Card } from "../types";

export class CardManager {
  private cardInserted: boolean = false;
  private cardBalance: number = 0;
  private timeoutCallback: (() => void) | null = null;
  private timer: NodeJS.Timeout | null = null;
  private remainingSeconds: number = 10;

  constructor(timeoutCallback: () => void) {
    this.timeoutCallback = timeoutCallback;
  }

  /**
   * Inserts a card and starts the payment timer
   * @param cardType Type of card ('sufficient' or 'limited')
   * @param balance Balance of the card
   * @returns Result of card insertion
   */
  insertCard(
    cardType: "sufficient" | "limited",
    balance: number
  ): {
    success: boolean;
    message?: string;
  } {
    if (this.cardInserted) {
      return { success: false, message: "이미 카드가 삽입되어 있습니다." };
    }

    this.cardInserted = true;
    this.cardBalance = balance;
    this.startTimer();
    return { success: true };
  }

  /**
   * Checks if the current card can make a purchase
   * @param price Price to check
   */
  canPurchase(price: number): boolean {
    return this.cardInserted && this.cardBalance >= price;
  }

  /**
   * Processes a purchase with the current card
   * @param price Price to purchase
   */
  purchase(price: number): { success: boolean; message?: string } {
    if (!this.cardInserted) {
      return { success: false, message: "카드가 삽입되어 있지 않습니다." };
    }

    if (this.cardBalance < price) {
      return { success: false, message: "카드 잔액이 부족합니다." };
    }

    this.cardBalance -= price;
    return { success: true };
  }

  /**
   * Starts the card payment timer
   */
  private startTimer(): void {
    this.remainingSeconds = 10;
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.reset();
        if (this.timeoutCallback) {
          this.timeoutCallback();
        }
      }
    }, 1000);
  }

  /**
   * Returns the remaining seconds of the timer
   */
  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  /**
   * Resets the card manager to initial state
   */
  reset(): void {
    this.cardInserted = false;
    this.cardBalance = 0;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
