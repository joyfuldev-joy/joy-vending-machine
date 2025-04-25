export class MoneyManager {
  private balance: number = 0;
  private readonly MAX_BALANCE = 10000;
  private readonly VALID_COINS = [100, 500] as const;
  private readonly VALID_BILLS = [1000, 5000, 10000] as const;
  private changeCounts: { [key: number]: number };
  private returnedMoney: { [key: number]: number } = {};
  private insertedMoney: { [key: number]: number } = {};
  private isCardMode: boolean = false;

  constructor() {
    this.changeCounts = {
      10000: 10,
      5000: 10,
      1000: 10,
      500: 10,
      100: 10,
    };
  }

  /**
   * Inserts money into the vending machine
   * @param amount Amount of money to insert
   * @param currency Currency type
   */
  insertMoney(
    amount: number,
    currency: string
  ): { success: boolean; message?: string } {
    if (currency !== "KRW") {
      return {
        success: false,
        message: "한국 화폐만 사용 가능합니다.",
      };
    }

    if (this.isCardMode) {
      if (amount >= 1000) {
        return {
          success: false,
          message: "카드 결제 중에는 지폐를 투입할 수 없습니다.",
        };
      }
      this.returnedMoney[amount] = (this.returnedMoney[amount] || 0) + 1;
      return {
        success: false,
        message: "카드 결제 중에는 동전이 반환됩니다.",
      };
    }

    if (amount >= 1000) {
      if (
        !this.VALID_BILLS.includes(amount as (typeof this.VALID_BILLS)[number])
      ) {
        return {
          success: false,
          message: "지원하지 않는 지폐입니다.",
        };
      }
    } else {
      if (
        !this.VALID_COINS.includes(amount as (typeof this.VALID_COINS)[number])
      ) {
        this.returnedMoney[amount] = (this.returnedMoney[amount] || 0) + 1;
        return {
          success: false,
          message: "지원하지 않는 동전입니다.",
        };
      }
    }

    if (this.balance + amount > this.MAX_BALANCE) {
      if (amount >= 1000) {
        return {
          success: false,
          message: "잔액이 10,000원을 초과하여 지폐를 투입할 수 없습니다.",
        };
      }
      this.returnedMoney[amount] = (this.returnedMoney[amount] || 0) + 1;
      return {
        success: false,
        message: "잔액이 10,000원을 초과하여 동전이 반환됩니다.",
      };
    }

    this.balance += amount;
    this.insertedMoney[amount] = (this.insertedMoney[amount] || 0) + 1;
    this.changeCounts[amount] = (this.changeCounts[amount] || 0) + 1;

    return { success: true };
  }

  /**
   * Sets the card mode status
   * @param isCardMode Whether the machine is in card mode
   */
  setCardMode(isCardMode: boolean): void {
    this.isCardMode = isCardMode;
  }

  /**
   * Returns money to the user
   */
  returnMoney(): { returnedMoney: { [key: number]: number }; message: string } {
    if (this.balance === 0) {
      return { returnedMoney: this.returnedMoney, message: "" };
    }

    let remainingAmount = this.balance;
    const denominations = [10000, 5000, 1000, 500, 100];

    denominations.forEach((denomination) => {
      if (
        remainingAmount >= denomination &&
        this.changeCounts[denomination] > 0
      ) {
        const count = Math.min(
          Math.floor(remainingAmount / denomination),
          this.changeCounts[denomination]
        );
        if (count > 0) {
          this.returnedMoney[denomination] =
            (this.returnedMoney[denomination] || 0) + count;
          remainingAmount -= denomination * count;
          this.changeCounts[denomination] -= count;
        }
      }
    });

    const returnedMoney = { ...this.returnedMoney };
    this.balance = 0;
    this.insertedMoney = {};

    return {
      returnedMoney,
      message: "거스름돈이 반환되었습니다.",
    };
  }

  /**
   * Deducts amount from balance
   * @param amount Amount to deduct
   */
  deductBalance(amount: number): void {
    this.balance -= amount;
  }

  /**
   * Gets current balance
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Gets returned money
   */
  getReturnedMoney(): { [key: number]: number } {
    return { ...this.returnedMoney };
  }

  /**
   * Clears returned money
   */
  clearReturnedMoney(): void {
    this.returnedMoney = {};
  }

  /**
   * Gets change counts
   */
  getChangeCounts(): { [key: number]: number } {
    return { ...this.changeCounts };
  }

  /**
   * Checks if change can be made
   * @param amount Amount to check
   */
  canMakeChange(amount: number): boolean {
    let remainingAmount = amount;
    const denominations = [10000, 5000, 1000, 500, 100];

    for (const denomination of denominations) {
      if (remainingAmount >= denomination) {
        const neededCount = Math.floor(remainingAmount / denomination);
        const availableCount = this.changeCounts[denomination];
        const usedCount = Math.min(neededCount, availableCount);
        remainingAmount -= denomination * usedCount;
      }
    }

    return remainingAmount === 0;
  }
}
