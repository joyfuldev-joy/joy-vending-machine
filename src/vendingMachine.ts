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

  constructor() {
    this.moneyManager = new MoneyManager();
    this.productManager = new ProductManager();
    this.cardManager = new CardManager(() => this.resetToIdle());

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeEventListeners());
    } else {
      this.initializeEventListeners();
    }
    this.updateDisplay();
  }

  private initializeEventListeners(): void {
    // 돈 투입 버튼들
    document.querySelectorAll('.money-button').forEach(button => {
      button.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const amount = parseInt(target.dataset.amount || '0');
        const currency = target.dataset.currency || 'KRW';
        this.insertMoney(amount, currency);
      });
    });

    // 카드 버튼들
    document.querySelectorAll('.card-button').forEach(button => {
      button.addEventListener('click', e => {
        const cardType = (e.currentTarget as HTMLElement).dataset.cardType as
          | 'sufficient'
          | 'limited';
        this.insertCard(cardType);
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
    }
    if (result.message) {
      alert(result.message);
    }
    this.updateDisplay();
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

    // Update card buttons state
    const cardButtons = document.querySelectorAll('.card-button');
    cardButtons.forEach(button => {
      if (this.mode !== VendingMachineMode.IDLE) {
        button.setAttribute('disabled', 'true');
        button.classList.add('disabled');
      } else {
        button.removeAttribute('disabled');
        button.classList.remove('disabled');
      }
    });

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
        timerElement.textContent = `${this.cardManager.getRemainingSeconds()}초`;
        timerElement.classList.add('visible');
      } else {
        timerElement.classList.remove('visible');
      }
    }
  }

  private updateOutputHoleDisplay(): void {
    const outputHole = document.querySelector('.output-hole');
    const dispensedDrinkElement = document.querySelector('.dispensed-drink');

    if (outputHole && dispensedDrinkElement) {
      if (this.productManager.hasDispensedDrinks()) {
        outputHole.classList.add('has-product');
        dispensedDrinkElement.innerHTML = this.productManager.getDispensedDrinksDisplay();
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
          .map(([amount, count]) => `${amount}원 ${count}개`)
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

      if (!this.productManager.canPurchase(productId)) {
        button.setAttribute('disabled', 'true');
        button.classList.add('disabled');
        button.textContent = '구매불가';
        return;
      }

      if (this.mode === VendingMachineMode.CARD) {
        if (this.cardManager.canPurchase(product.price)) {
          button.removeAttribute('disabled');
          button.classList.remove('disabled');
          button.textContent = '구매';
        } else {
          button.setAttribute('disabled', 'true');
          button.classList.add('disabled');
          button.textContent = '구매';
        }
        return;
      }

      const canAfford = this.moneyManager.getBalance() >= product.price;
      const canMakeChange = this.moneyManager.canMakeChange(
        this.moneyManager.getBalance() - product.price
      );

      if (canAfford && canMakeChange) {
        button.removeAttribute('disabled');
        button.classList.remove('disabled');
        button.textContent = '구매';
      } else {
        button.setAttribute('disabled', 'true');
        button.classList.add('disabled');
        button.textContent = '구매';
      }
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
}

// 자판기 인스턴스 생성
new VendingMachine();
