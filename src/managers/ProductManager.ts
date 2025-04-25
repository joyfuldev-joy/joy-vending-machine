import { Product } from "../types";

export class ProductManager {
  private products: Product[] = [
    { id: "cola", name: "콜라", price: 1100, quantity: 10 },
    { id: "water", name: "물", price: 600, quantity: 10 },
    { id: "coffee", name: "커피", price: 700, quantity: 10 },
  ];

  private dispensedDrinks: { [key: string]: number } = {};

  constructor() {
    // Constructor code if needed
  }

  getProduct(productId: string): Product | undefined {
    return this.products.find((product) => product.id === productId);
  }

  canPurchase(productId: string): boolean {
    const product = this.getProduct(productId);
    return product ? product.quantity > 0 : false;
  }

  purchase(productId: string): void {
    const product = this.getProduct(productId);
    if (product && product.quantity > 0) {
      product.quantity--;
      this.dispensedDrinks[productId] =
        (this.dispensedDrinks[productId] || 0) + 1;
    }
  }

  getAllProducts(): Product[] {
    return [...this.products];
  }

  getProducts(): Product[] {
    return this.products;
  }

  hasDispensedDrinks(): boolean {
    return Object.keys(this.dispensedDrinks).length > 0;
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

  getProductPrice(productId: string): number {
    const product = this.getProduct(productId);
    return product ? product.price : 0;
  }

  getProductName(productId: string): string {
    const product = this.getProduct(productId);
    return product ? product.name : "";
  }

  getDispensedDrinksDisplay(): string {
    return Object.entries(this.dispensedDrinks)
      .map(([id, count]) => {
        const product = this.getProduct(id);
        return product ? `${product.name} x ${count}` : "";
      })
      .filter((text) => text)
      .join("<br>");
  }
}
