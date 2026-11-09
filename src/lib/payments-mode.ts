import { razorpayEnabled } from './razorpay';
import { phonepeEnabled } from './phonepe';

export type Gateway = 'phonepe' | 'razorpay' | 'test';

/**
 * Which gateway takes new payments. PAYMENT_GATEWAY=phonepe|razorpay picks one explicitly;
 * otherwise PhonePe is used when its keys are set, then Razorpay, then the built-in test gateway.
 * Refunds always go back through the gateway that took the original payment.
 */
export function activeGateway(): Gateway {
  const pick = process.env.PAYMENT_GATEWAY;
  if (pick === 'phonepe' && phonepeEnabled()) return 'phonepe';
  if (pick === 'razorpay' && razorpayEnabled()) return 'razorpay';
  if (phonepeEnabled()) return 'phonepe';
  if (razorpayEnabled()) return 'razorpay';
  return 'test';
}

export const GATEWAY_LABEL: Record<string, string> = { phonepe: 'PhonePe', razorpay: 'Razorpay', test: 'Test gateway' };

/** Test payments run only when no real gateway is configured, and in production only if ALLOW_TEST_PAYMENTS=true. */
export const testPaymentsAllowed = () => activeGateway() === 'test' && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_PAYMENTS === 'true');
