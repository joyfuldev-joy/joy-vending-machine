import './styles.scss';
import { VendingMachineMode } from './types';
import { MoneyManager } from './managers/MoneyManager';
import { ProductManager } from './managers/ProductManager';
import { CardManager } from './managers/CardManager';

class VendingMachine {
  private moneyManager: MoneyManager;
  private productManager: ProductManager;
  private cardManager: CardManager;
  private mode: VendingMachineMode = VendingMachineMode.IDLE;
  private displayUpdateTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.moneyManager = new MoneyManager();
    this.productManager = new ProductManager();
    this.cardManager = new CardManager(() => this.resetToIdle());

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeEventListeners());
    } else {
      this.initializeEventListeners();
    }

    // 초기 상태에서 모든 버튼 비활성화
    this.updateProductButtons();
    this.updateDisplay();
  }

  private initializeEventListeners(): void {
    // 돈 투입 버튼들
    document.querySelectorAll('.money-button').forEach(button => {
      button.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const cardType = target.dataset.cardType;
        if (cardType) {
          this.insertCard(cardType as 'sufficient' | 'limited');
          return;
        }
        const amount = parseInt(target.dataset.amount || '0');
        const currency = target.dataset.currency || 'KRW';
        this.insertMoney(amount, currency);
      });
    });

    // 제품 버튼들
    document.querySelectorAll('.product-button').forEach(button => {
      button.addEventListener('click', e => {
        const productId = (e.currentTarget as HTMLElement).dataset.productId;
        if (productId) {
          this.selectProduct(productId);
        }
      });
    });

    // 반환 버튼
    const returnButton = document.querySelector('.return-button');
    if (returnButton) {
      returnButton.addEventListener('click', () => this.returnMoney());
    }

    // 음료 배출구
    const outputHole = document.querySelector('.output-hole');
    if (outputHole) {
      outputHole.addEventListener('click', () => this.removeDispensedDrink());
    }

    // 반환구
    const returnHole = document.querySelector('.return-hole');
    if (returnHole) {
      returnHole.addEventListener('click', () => this.clearReturnedMoney());
    }
  }

  private insertMoney(amount: number, currency: string): void {
    if (this.mode === VendingMachineMode.CARD) {
      if (amount >= 1000) {
        alert('카드 결제 중에는 지폐를 넣을 수 없습니다.');
        return;
      }
      const result = this.moneyManager.insertMoney(amount, currency);
      if (!result.success && result.message) {
        alert(result.message);
      }
      this.updateDisplay();
      return;
    }

    const result = this.moneyManager.insertMoney(amount, currency);
    if (result.success) {
      if (this.mode === VendingMachineMode.IDLE) {
        this.mode = VendingMachineMode.CASH;
      }
    }
    if (result.message) {
      alert(result.message);
    }
    this.updateDisplay();
  }

  private insertCard(cardType: 'sufficient' | 'limited'): void {
    if (this.mode === VendingMachineMode.CASH) {
      alert('현재 잔액이 있어서 카드 리더기가 작동하지 않습니다.');
      return;
    }

    const result = this.cardManager.insertCard(cardType);
    if (result.success) {
      this.mode = VendingMachineMode.CARD;
      this.moneyManager.setCardMode(true);
      this.startDisplayUpdate();
    }
    if (result.message) {
      alert(result.message);
    }
    this.updateDisplay();
  }

  private startDisplayUpdate(): void {
    if (this.displayUpdateTimer) {
      clearInterval(this.displayUpdateTimer);
    }

    this.displayUpdateTimer = setInterval(() => {
      this.updateDisplay();
      if (this.mode === VendingMachineMode.CARD) {
        const remainingSeconds = this.cardManager.getRemainingSeconds();
        if (remainingSeconds <= 0) {
          alert('시간이 초과되어 카드 결제가 취소되었습니다.');
          this.resetToIdle();
        }
      }
    }, 1000);
  }

  private stopDisplayUpdate(): void {
    if (this.displayUpdateTimer) {
      clearInterval(this.displayUpdateTimer);
      this.displayUpdateTimer = null;
    }
  }

  private selectProduct(productId: string): void {
    const product = this.productManager.getProduct(productId);
    if (!product) {
      alert('존재하지 않는 상품입니다.');
      return;
    }

    if (!this.productManager.canPurchase(productId)) {
      alert('품절된 상품입니다.');
      return;
    }

    if (this.mode === VendingMachineMode.CARD) {
      if (!this.cardManager.canPurchase(product.price)) {
        alert('카드 잔액이 부족합니다.');
        this.resetToIdle();
        return;
      }
      const result = this.cardManager.purchase(product.price);
      if (result.success) {
        this.productManager.purchase(productId);
        this.resetToIdle();
      }
      if (result.message) {
        alert(result.message);
      }
    } else if (this.mode === VendingMachineMode.CASH) {
      if (this.moneyManager.getBalance() < product.price) {
        alert('잔액이 부족합니다.');
        return;
      }

      if (!this.moneyManager.canMakeChange(this.moneyManager.getBalance() - product.price)) {
        alert('거스름돈을 줄 수 없습니다.');
        return;
      }

      this.productManager.purchase(productId);
      this.moneyManager.deductBalance(product.price);

      if (this.moneyManager.getBalance() === 0) {
        this.resetToIdle();
      }
    }

    this.updateDisplay();
  }

  private returnMoney(): void {
    if (this.mode === VendingMachineMode.CARD) {
      alert('카드 결제 중에는 반환이 불가능합니다.');
      return;
    }

    const result = this.moneyManager.returnMoney();
    if (result.message) {
      alert(result.message);
    }
    this.resetToIdle();
    this.updateDisplay();
  }

  private resetToIdle(): void {
    this.mode = VendingMachineMode.IDLE;
    this.cardManager.reset();
    this.moneyManager.setCardMode(false);
    this.stopDisplayUpdate();
    this.updateDisplay();
  }

  private removeDispensedDrink(): void {
    this.productManager.clearDispensedDrinks();
    this.updateDisplay();
  }

  private clearReturnedMoney(): void {
    this.moneyManager.clearReturnedMoney();
    this.updateDisplay();
  }

  private updateDisplay(): void {
    // Update current balance or card status
    const display = document.querySelector('.current-balance');
    if (display) {
      if (this.mode === VendingMachineMode.CARD) {
        display.textContent = '카드 결제';
      } else {
        display.textContent = `${this.moneyManager.getBalance().toLocaleString()}원`;
      }
    }

    // Update product buttons state
    this.updateProductButtons();

    // Update product quantities
    this.updateStockDisplay();

    // Update change counts
    this.updateChangeDisplay();

    // Update output hole LED and display
    this.updateOutputHoleDisplay();

    // Update return hole LED and display
    this.updateReturnHoleDisplay();

    // Update card timer display
    this.updateCardTimerDisplay();

    // Update product status
    this.updateProductStatus();

    // Update change status
    this.updateChangeStatus();
  }

  private updateChangeDisplay(): void {
    const changeCounts = this.moneyManager.getChangeCounts();
    Object.entries(changeCounts).forEach(([amount, count]) => {
      const changeElement = document.querySelector(`.change-count[data-amount="${amount}"]`);
      if (changeElement) {
        changeElement.textContent = `${count}개`;
      }
    });
  }

  private updateCardTimerDisplay(): void {
    const timerElement = document.querySelector('.card-timer');
    if (timerElement) {
      if (this.mode === VendingMachineMode.CARD) {
        const remainingSeconds = this.cardManager.getRemainingSeconds();
        timerElement.textContent = `${remainingSeconds}초`;
        timerElement.classList.add('visible');
      } else {
        timerElement.classList.remove('visible');
        timerElement.textContent = '';
      }
    }
  }

  private updateOutputHoleDisplay(): void {
    const outputHole = document.querySelector('.output-hole');
    const dispensedDrinkElement = document.querySelector('.dispensed-drink');

    if (outputHole && dispensedDrinkElement) {
      if (this.productManager.hasDispensedDrinks()) {
        outputHole.classList.add('has-product');
        const drinks = this.productManager.getDispensedDrinks();
        const displayText = Object.entries(drinks)
          .map(([id, count]) => {
            const product = this.productManager.getProduct(id);
            return product ? `${product.name} x ${count}` : '';
          })
          .filter(text => text)
          .join('<br>');
        dispensedDrinkElement.innerHTML = displayText;
        dispensedDrinkElement.classList.add('visible');
      } else {
        outputHole.classList.remove('has-product');
        dispensedDrinkElement.classList.remove('visible');
      }
    }
  }

  private updateReturnHoleDisplay(): void {
    const returnHole = document.querySelector('.return-hole');
    const returnedMoneyDisplay = document.querySelector('.returned-money');

    if (returnHole && returnedMoneyDisplay) {
      const returnedMoney = this.moneyManager.getReturnedMoney();
      if (Object.keys(returnedMoney).length > 0) {
        returnHole.classList.add('has-money');
        const moneyText = Object.entries(returnedMoney)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([amount, count]) => `${amount}원 x ${count}`)
          .join('<br>');
        returnedMoneyDisplay.innerHTML = moneyText;
        returnedMoneyDisplay.classList.add('visible');
      } else {
        returnHole.classList.remove('has-money');
        returnedMoneyDisplay.classList.remove('visible');
      }
    }
  }

  private updateProductButtons(): void {
    const productButtons = document.querySelectorAll('.product-button');
    productButtons.forEach(button => {
      const productId = button.getAttribute('data-product-id');
      if (!productId) return;

      const product = this.productManager.getProduct(productId);
      if (!product) return;

      // 모든 상태 클래스 제거
      button.classList.remove('disabled', 'insufficient-balance', 'sold-out');

      if (!this.productManager.canPurchase(productId)) {
        button.classList.add('sold-out');
        button.textContent = '품절';
        return;
      }

      // IDLE 모드에서는 버튼 비활성화
      if (this.mode === VendingMachineMode.IDLE) {
        button.classList.add('disabled');
        button.setAttribute('disabled', 'true');
        button.textContent = '구매';
        return;
      }

      // CASH 모드에서 잔액 부족 체크
      if (this.mode === VendingMachineMode.CASH && this.moneyManager.getBalance() < product.price) {
        button.classList.add('insufficient-balance');
        button.setAttribute('disabled', 'true');
        button.textContent = '구매';
        return;
      }

      // CARD 모드에서 카드 잔액 부족 체크
      if (this.mode === VendingMachineMode.CARD && !this.cardManager.canPurchase(product.price)) {
        button.classList.add('insufficient-balance');
        button.setAttribute('disabled', 'true');
        button.textContent = '구매';
        return;
      }

      button.removeAttribute('disabled');
      button.textContent = '구매';
    });
  }

  private updateStockDisplay(): void {
    this.productManager.getAllProducts().forEach(product => {
      const stockElement = document.querySelector(
        `.product-count[data-product-id="${product.id}"]`
      );
      if (stockElement) {
        stockElement.textContent = `${product.quantity}개`;
      }
    });
  }

  private updateProductStatus(): void {
    const productStatus = document.querySelector('.product-status') as HTMLElement;
    if (!productStatus) return;

    // Clear existing content
    productStatus.innerHTML = '<h3>제품</h3>';

    // Add product status items
    this.productManager.getProducts().forEach(product => {
      const statusItem = document.createElement('div');
      statusItem.className = 'status-item';
      statusItem.innerHTML = `
        <span class="product-name">${product.name}</span>
        <span class="product-count" data-product-id="${product.id}">x ${product.quantity}</span>
      `;
      productStatus.appendChild(statusItem);
    });
  }

  private updateChangeStatus(): void {
    const changeStatus = document.querySelector('.change-status') as HTMLElement;
    if (!changeStatus) return;

    // Clear existing content
    changeStatus.innerHTML = '<h3>잔돈</h3>';

    // Add change status items
    const denominations = [10000, 5000, 1000, 500, 100];
    const changeCounts = this.moneyManager.getChangeCounts();

    denominations.forEach(amount => {
      const statusItem = document.createElement('div');
      statusItem.className = 'status-item';
      statusItem.innerHTML = `
        <span class="change-name">${amount.toLocaleString()}원</span>
        <span class="change-count" data-amount="${amount}">x ${changeCounts[amount] || 0}</span>
      `;
      changeStatus.appendChild(statusItem);
    });
  }
}

// 자판기 인스턴스 생성
new VendingMachine();
