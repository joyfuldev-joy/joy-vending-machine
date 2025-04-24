import "./styles.scss";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Money {
  amount: number;
  count: number;
}

class VendingMachine {
  private products: Product[] = [
    { id: "water", name: "물", price: 1000, quantity: 10 },
    { id: "coke", name: "콜라", price: 1500, quantity: 10 },
    { id: "coffee", name: "커피", price: 2000, quantity: 10 },
  ];
  private balance: number = 0;
  private readonly MAX_BALANCE = 50000;
  private readonly VALID_DENOMINATIONS = [10000, 5000, 1000, 500, 100];
  private readonly RETURN_DENOMINATIONS = [10000, 5000, 1000, 500, 50, 10];
  private isCardPayment: boolean = false;
  private dispensedDrinks: { [key: string]: number } = {};
  private returnedMoney: { [key: number]: number } = {};
  private changeCounts: { [key: number]: number } = {
    10000: 10,
    5000: 10,
    1000: 10,
    500: 10,
    100: 10,
  };
  private insertedMoney: { [key: number]: number } = {};
  private cardPaymentTimer: NodeJS.Timeout | null = null;
  private cardCountdownTimer: NodeJS.Timeout | null = null;
  private remainingSeconds: number = 30;

  constructor() {
    this.initializeEventListeners();
    this.updateDisplay();
  }

  private initializeEventListeners(): void {
    // ... existing event listeners ...

    // Add event listener for drink output hole
    const outputHole = document.querySelector(".output-hole");
    if (outputHole) {
      outputHole.addEventListener("click", () => this.removeDispensedDrink());
    }

    // Add event listener for return hole
    const returnHole = document.querySelector(".return-hole");
    if (returnHole) {
      returnHole.addEventListener("click", () => this.clearReturnedMoney());
    }

    // Add event listeners for product buttons
    const productButtons = document.querySelectorAll(".product-button");
    productButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const productId = (e.currentTarget as HTMLElement).dataset.productId;
        if (productId) {
          this.selectProduct(productId);
        }
      });
    });

    // Add event listener for return button
    const returnButton = document.querySelector(".return-button");
    if (returnButton) {
      returnButton.addEventListener("click", () => {
        this.returnMoney();
      });
    }
  }

  private updateDisplay(): void {
    // Update current balance display
    const display = document.querySelector(".current-balance");
    if (display) {
      display.textContent = this.isCardPayment
        ? "카드 결제"
        : `${this.balance}원`;
    }

    // Update product buttons state
    this.updateProductButtons();

    // Update product quantities
    this.updateStockDisplay();

    // Update change counts
    this.updateChangeDisplay();

    // Update output hole LED and display
    const outputHole = document.querySelector(".output-hole");
    const dispensedDrinkElement = document.querySelector(".dispensed-drink");

    if (outputHole && dispensedDrinkElement) {
      if (Object.keys(this.dispensedDrinks).length > 0) {
        outputHole.classList.add("has-product");

        // Create display text for dispensed drinks
        const drinkText = Object.entries(this.dispensedDrinks)
          .map(([id, count]) => {
            const product = this.products.find((p) => p.id === id);
            return product ? `${product.name} ${count}개` : "";
          })
          .filter((text) => text)
          .join("<br>");

        dispensedDrinkElement.innerHTML = drinkText;
        dispensedDrinkElement.classList.add("visible");
      } else {
        outputHole.classList.remove("has-product");
        dispensedDrinkElement.classList.remove("visible");
      }
    }

    // Update return hole LED and display
    const returnHole = document.querySelector(".return-hole");
    const returnedMoneyDisplay = document.querySelector(".returned-money");

    if (returnHole && returnedMoneyDisplay) {
      if (Object.keys(this.returnedMoney).length > 0) {
        returnHole.classList.add("has-money");

        // Create display text for returned money
        const moneyText = Object.entries(this.returnedMoney)
          .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort by denomination (highest first)
          .map(([amount, count]) => `${amount}원 ${count}개`)
          .join("<br>");

        returnedMoneyDisplay.innerHTML = moneyText;
        returnedMoneyDisplay.classList.add("visible");
      } else {
        returnHole.classList.remove("has-money");
        returnedMoneyDisplay.classList.remove("visible");
      }
    }

    // Update card timer display
    this.updateCardTimerDisplay();
  }

  private updateChangeDisplay(): void {
    Object.entries(this.changeCounts).forEach(([amount, count]) => {
      const changeElement = document.querySelector(
        `.change-count[data-amount="${amount}"]`
      );
      if (changeElement) {
        changeElement.textContent = `${count}개`;
      }
    });
  }

  private updateCardTimerDisplay(): void {
    const timerElement = document.querySelector(".card-timer");
    if (timerElement) {
      if (this.isCardPayment) {
        timerElement.textContent = `${this.remainingSeconds}초`;
        timerElement.classList.add("visible");
      } else {
        timerElement.classList.remove("visible");
      }
    }
  }

  insertMoney(amount: number): void {
    if (this.isCardPayment) {
      alert("현재 카드 결제 모드입니다. 현금 결제로 전환해주세요.");
      return;
    }

    // 50원과 10원은 바로 반환
    if (amount === 50 || amount === 10) {
      this.returnedMoney[amount] = (this.returnedMoney[amount] || 0) + 1;
      this.updateDisplay();
      return;
    }

    // 유효한 화폐인지 확인
    if (!this.VALID_DENOMINATIONS.includes(amount)) {
      this.returnedMoney[amount] = (this.returnedMoney[amount] || 0) + 1;
      this.updateDisplay();
      return;
    }

    const newBalance = this.balance + amount;
    if (newBalance > this.MAX_BALANCE) {
      alert("만원 이상 투입할 수 없습니다.");
      return;
    }

    // Track inserted money
    if (!this.insertedMoney[amount]) {
      this.insertedMoney[amount] = 0;
    }
    this.insertedMoney[amount]++;

    // Update change counts
    this.changeCounts[amount]++;

    this.balance = newBalance;
    this.updateDisplay();
  }

  selectProduct(productId: string): void {
    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      alert("존재하지 않는 상품입니다.");
      return;
    }

    if (product.quantity <= 0) {
      alert("품절된 상품입니다.");
      return;
    }

    if (this.isCardPayment) {
      product.quantity--;
      this.dispenseDrink(productId);
      this.isCardPayment = false;
      this.clearCardPaymentTimer();
      this.updateDisplay();
    } else {
      if (this.balance < product.price) {
        alert("잔액이 부족합니다.");
        return;
      }

      // Calculate remaining money
      const remaining = this.balance - product.price;

      // Update product and balance
      product.quantity--;
      this.balance = remaining;
      this.dispenseDrink(productId);

      // Clear insertedMoney only if all money is used
      if (remaining === 0) {
        this.insertedMoney = {};
      }

      this.updateDisplay();
    }
  }

  returnMoney(): void {
    if (this.isCardPayment) {
      alert("현재 카드 결제 모드입니다.");
      return;
    }

    if (this.balance > 0) {
      // Calculate denominations for remaining money
      let remainingAmount = this.balance;
      const denominations = [10000, 5000, 1000, 500, 100];
      this.returnedMoney = {};

      // Try to give change using largest denominations first
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
            this.returnedMoney[denomination] = count;
            remainingAmount -= denomination * count;
            this.changeCounts[denomination] -= count;
          }
        }
      });

      // Reset balance and clear inserted money tracking
      this.balance = 0;
      this.insertedMoney = {};

      // Update the display to show the LED border
      this.updateDisplay();
    }
  }

  private dispenseDrink(productId: string): void {
    if (!this.dispensedDrinks[productId]) {
      this.dispensedDrinks[productId] = 0;
    }
    this.dispensedDrinks[productId]++;
    this.updateDisplay();
  }

  private removeDispensedDrink(): void {
    this.dispensedDrinks = {};
    this.updateDisplay();
  }

  private clearReturnedMoney(): void {
    this.returnedMoney = {};
    const returnHole = document.querySelector(".return-hole");
    const returnedMoneyDisplay = document.querySelector(".returned-money");

    if (returnHole) {
      returnHole.classList.remove("has-money");
    }
    if (returnedMoneyDisplay) {
      returnedMoneyDisplay.innerHTML = "";
      returnedMoneyDisplay.classList.remove("visible");
    }
  }

  private updateProductButtons(): void {
    const productButtons = document.querySelectorAll(".product-button");
    productButtons.forEach((button) => {
      const productId = button.getAttribute("data-product-id");
      const product = this.products.find((p) => p.id === productId);

      if (product) {
        if (product.quantity <= 0) {
          button.setAttribute("disabled", "true");
          button.classList.add("disabled");
          button.textContent = "구매불가";
          return;
        }

        if (this.isCardPayment) {
          button.removeAttribute("disabled");
          button.classList.remove("disabled");
          button.textContent = "구매";
          return;
        }

        // Check if we can give change for this product
        const remainingAmount = this.balance - product.price;
        if (remainingAmount < 0) {
          button.setAttribute("disabled", "true");
          button.classList.add("disabled");
          button.textContent = "구매";
          return;
        }

        // Check if we have enough change
        let canGiveChange = true;
        let tempAmount = remainingAmount;
        const denominations = [10000, 5000, 1000, 500, 100];

        for (const denomination of denominations) {
          if (tempAmount >= denomination) {
            const count = Math.min(
              Math.floor(tempAmount / denomination),
              this.changeCounts[denomination]
            );
            tempAmount -= denomination * count;
            if (tempAmount === 0) break;
          }
        }

        if (tempAmount > 0) {
          canGiveChange = false;
        }

        if (this.balance >= product.price && canGiveChange) {
          button.removeAttribute("disabled");
          button.classList.remove("disabled");
          button.textContent = "구매";
        } else {
          button.setAttribute("disabled", "true");
          button.classList.add("disabled");
          button.textContent = "구매";
        }
      }
    });
  }

  private updateStockDisplay(): void {
    this.products.forEach((product) => {
      const stockElement = document.querySelector(
        `.product-count[data-product-id="${product.id}"]`
      );
      if (stockElement) {
        stockElement.textContent = `${product.quantity}개`;
      }
    });
  }

  togglePaymentMode(): void {
    if (this.balance > 0) {
      alert(
        "현금이 투입된 상태에서는 카드 결제로 전환할 수 없습니다. 잔돈을 반환해주세요."
      );
      return;
    }

    this.isCardPayment = !this.isCardPayment;
    if (this.isCardPayment) {
      this.balance = 0;
      this.startCardPaymentTimer();
    } else {
      this.clearCardPaymentTimer();
    }
    this.updateDisplay();
  }

  private startCardPaymentTimer(): void {
    // Clear any existing timers
    this.clearCardPaymentTimer();

    // Reset countdown
    this.remainingSeconds = 30;
    this.updateCardTimerDisplay();

    // Start countdown timer
    this.cardCountdownTimer = setInterval(() => {
      this.remainingSeconds--;
      this.updateCardTimerDisplay();

      if (this.remainingSeconds <= 0) {
        this.clearCardPaymentTimer();
        if (this.isCardPayment) {
          this.isCardPayment = false;
          alert("30초 동안 구매가 없어 카드 결제 모드가 종료됩니다.");
          this.updateDisplay();
        }
      }
    }, 1000);

    // Start the main timer
    this.cardPaymentTimer = setTimeout(() => {
      this.clearCardPaymentTimer();
      if (this.isCardPayment) {
        this.isCardPayment = false;
        this.updateDisplay();
      }
    }, 30000);
  }

  private clearCardPaymentTimer(): void {
    if (this.cardPaymentTimer) {
      clearTimeout(this.cardPaymentTimer);
      this.cardPaymentTimer = null;
    }
    if (this.cardCountdownTimer) {
      clearInterval(this.cardCountdownTimer);
      this.cardCountdownTimer = null;
    }
    this.remainingSeconds = 30;
    this.updateCardTimerDisplay();
  }
}

// DOM 이벤트 핸들러
document.addEventListener("DOMContentLoaded", () => {
  const vendingMachine = new VendingMachine();

  // 돈 투입 버튼들
  document.querySelectorAll(".money-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const amount = parseInt(target.dataset.amount || "0");
      vendingMachine.insertMoney(amount);
    });
  });

  // 카드 결제 버튼
  const cardButton = document.querySelector(".card-button");
  if (cardButton) {
    cardButton.addEventListener("click", () => {
      vendingMachine.togglePaymentMode();
    });
  }

  // 잔돈 반환 버튼
  const returnButton = document.querySelector(".return-button");
  if (returnButton) {
    returnButton.addEventListener("click", () => {
      vendingMachine.returnMoney();
    });
  }
});
