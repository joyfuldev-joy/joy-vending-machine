export class MoneyManager {
  private balance: number = 0;
  private readonly MAX_BALANCE = 10000;
  private readonly VALID_BILLS = [1000, 5000, 10000];
  private readonly VALID_COINS = [100, 500];
  private readonly VALID_DENOMINATIONS: number[];
  private changeCounts: { [key: number]: number };
  private returnedMoney: { [key: number]: number } = {};
  private insertedMoney: { [key: number]: number } = {};

  constructor() {
    this.VALID_DENOMINATIONS = [...this.VALID_BILLS, ...this.VALID_COINS];
    this.changeCounts = {
      10000: 10,
      5000: 10,
      1000: 10,
      500: 10,
      100: 10,
    };
  }

  insertMoney(amount: number, currency: string): { success: boolean; message?: string } {
    let inputAmount = amount;
    let displayAmount = currency === 'KRW' ? `${amount}원을` : `${amount}달러를`;

    // 작은 금액은 바로 반환
    if ((currency === 'KRW' && amount <= 50) || (currency === 'USD' && amount <= 0.5)) {
      this.returnedMoney[amount] = (this.returnedMoney[amount] || 0) + 1;
      return {
        success: false,
        message: `${displayAmount} 받을 수 없어서 반환구로 나왔습니다.`,
      };
    }

    // 유효한 화폐인지 확인
    if (!this.VALID_DENOMINATIONS.includes(inputAmount)) {
      return {
        success: false,
        message: `자판기가 ${displayAmount} 지원하지 않아서, 바로 반환되었습니다.`,
      };
    }

    const newBalance = this.balance + inputAmount;

    // 만원 초과 시 처리
    if (newBalance > this.MAX_BALANCE) {
      if (inputAmount >= 1000) {
        return {
          success: false,
          message: '이 자판기는 만원이 최대여서, 더 이상 투입할 수 없습니다.',
        };
      } else {
        this.returnedMoney[inputAmount] = (this.returnedMoney[inputAmount] || 0) + 1;
        return {
          success: false,
          message: `만원이 최대여서 ${displayAmount} 반환구로 나왔습니다.`,
        };
      }
    }

    // Track inserted money
    if (!this.insertedMoney[inputAmount]) {
      this.insertedMoney[inputAmount] = 0;
    }
    this.insertedMoney[inputAmount]++;

    // Update change counts
    this.changeCounts[inputAmount]++;

    this.balance = newBalance;
    return { success: true };
  }

  returnMoney(): { returnedMoney: { [key: number]: number }; message: string } {
    if (this.balance === 0) {
      return { returnedMoney: {}, message: '' };
    }

    let remainingAmount = this.balance;
    const denominations = [10000, 5000, 1000, 500, 100];
    this.returnedMoney = {};

    // Try to give change using largest denominations first
    denominations.forEach(denomination => {
      if (remainingAmount >= denomination && this.changeCounts[denomination] > 0) {
        const count = Math.min(
          Math.floor(remainingAmount / denomination),
          this.changeCounts[denomination]
        );
        if (count > 0) {
          this.returnedMoney[denomination] = count;
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
      message: '거스름돈이 반환되었습니다.',
    };
  }

  deductBalance(amount: number): void {
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }

  getReturnedMoney(): { [key: number]: number } {
    return { ...this.returnedMoney };
  }

  clearReturnedMoney(): void {
    this.returnedMoney = {};
  }

  getChangeCounts(): { [key: number]: number } {
    return { ...this.changeCounts };
  }

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
