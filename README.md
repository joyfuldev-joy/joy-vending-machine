# Joy Vending Machine🧃

이 프로젝트는 자판기의 기본적인 동작 메커니즘을 구현하고, 사용자가 현금 및 카드로 음료수를 구매하기까지의 전체 프로세스를 시뮬레이션합니다.

---

## 🔧 기술 스택

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

---

### 주요 기능

- **결제 시스템 **

  - 현금 결제 (100원, 500원, 1,000원, 5,000원, 10,000원)
  - 카드 결제 (충분한 잔액/제한된 잔액)
  - 잔돈 반환

- **상품 관리**

  - 콜라 (1,100원)
  - 물 (600원)
  - 커피 (700원)

- **상태 표시**
  - 현재 잔액 표시
  - 카드 결제 타이머
  - 상품 재고 상태
  - 잔돈 상태

## 시스템 구조

## 실행 결과

### 전체 실행 결과

### 현금 결제 프로세스

![현금 결제 프로세스]

1. 지폐/동전 투입
2. 상품 선택
3. 거스름돈 반환
4. 상품 배출

### 카드 결제 프로세스

1. 카드 삽입
2. 상품 선택
3. 결제 완료
4. 상품 배출

### 오류 처리

- 지원하지 않는 화폐
- 잔액 부족
- 거스름돈 부족
- 카드 타임아웃
- 품절 상품

## 실행 방법

1. 저장소 클론

```bash
git clone https://github.com/your-username/joy-vending-machine.git
cd joy-vending-machine
```

2. 의존성 설치

```bash
npm install
```

3. 개발 서버 실행

```bash
npm run dev
```

4. 빌드

```bash
npm run build
```

## 시스템 요구사항

- Node.js 16.x 이상
- npm 7.x 이상

## 프로젝트 구조

```
joy-vending-machine/
├── src/
│   ├── assets/
│   ├── managers/
│   │   ├── CardManager.ts
│   │   ├── MoneyManager.ts
│   │   └── ProductManager.ts
│   ├── index.html
│   ├── styles.scss
│   ├── types.ts
│   └── vendingMachine.ts
├── package.json
└── README.md
```

## 주요 로직

1. **결제 프로세스**

   - 현금 투입 시 잔액 확인 및 거스름돈 계산
   - 카드 결제 시 잔액 확인 및 타임아웃 처리
   - 결제 수단 전환 시 잔액 초기화

2. **상품 구매**

   - 재고 확인
   - 잔액 확인
   - 거스름돈 가능 여부 확인
   - 구매 처리 및 상품 배출

3. **예외 처리**
   - 지원하지 않는 화폐
   - 잔액 부족
   - 재고 부족
   - 거스름돈 부족
   - 카드 타임아웃

## 라이센스

MIT License
