import { Product } from '../types';

export class ProductManager {
  private products: Product[];
  private dispensedDrinks: { [key: string]: number } = {};

  constructor() {
    this.products = [
      { id: 'water', name: '물', price: 1000, quantity: 10 },
      { id: 'coke', name: '콜라', price: 1500, quantity: 10 },
      { id: 'coffee', name: '커피', price: 2000, quantity: 10 },
    ];
  }

  getProduct(productId: string): Product | undefined {
    return this.products.find(p => p.id === productId);
  }

  canPurchase(productId: string): boolean {
    const product = this.getProduct(productId);
    return product ? product.quantity > 0 : false;
  }

  purchase(productId: string): boolean {
    const product = this.getProduct(productId);
    if (!product || !this.canPurchase(productId)) {
      return false;
    }

    product.quantity--;
    if (!this.dispensedDrinks[productId]) {
      this.dispensedDrinks[productId] = 0;
    }
    this.dispensedDrinks[productId]++;
    return true;
  }

  getDispensedDrinks(): { [key: string]: number } {
    return { ...this.dispensedDrinks };
  }

  clearDispensedDrinks(): void {
    this.dispensedDrinks = {};
  }

  getProductQuantity(productId: string): number {
    const product = this.getProduct(productId);
    return product ? product.quantity : 0;
  }

  getAllProducts(): Product[] {
    return [...this.products];
  }

  getProductPrice(productId: string): number {
    const product = this.getProduct(productId);
    return product ? product.price : 0;
  }

  getProductName(productId: string): string {
    const product = this.getProduct(productId);
    return product ? product.name : '';
  }

  hasDispensedDrinks(): boolean {
    return Object.keys(this.dispensedDrinks).length > 0;
  }

  getDispensedDrinksDisplay(): string {
    return Object.entries(this.dispensedDrinks)
      .map(([id, count]) => {
        const product = this.getProduct(id);
        return product ? `${product.name} ${count}개` : '';
      })
      .filter(text => text)
      .join('\n');
  }
}
