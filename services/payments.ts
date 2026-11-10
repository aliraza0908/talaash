export type PaymentRequest = { amount: number; currency?: string; gigId: string; buyerId: string };
export type PaymentResult = { provider: string; status: "succeeded" | "pending"; platformFee: number; sellerAmount: number };
// Every provider follows one contract, keeping checkout easy to replace later.
export interface PaymentProvider { charge(request: PaymentRequest): Promise<PaymentResult>; }
export class MockPaymentProvider implements PaymentProvider { async charge(request: PaymentRequest): Promise<PaymentResult> { const platformFee = Math.round(request.amount * 0.1 * 100) / 100; return { provider: "mock", status: "succeeded", platformFee, sellerAmount: request.amount - platformFee }; } }
export class JazzCashProvider implements PaymentProvider { async charge(): Promise<PaymentResult> { throw new Error("TODO: connect JazzCash checkout and webhook verification."); } }
export class EasyPaisaProvider implements PaymentProvider { async charge(): Promise<PaymentResult> { throw new Error("TODO: connect EasyPaisa checkout and webhook verification."); } }