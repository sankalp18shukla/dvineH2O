import { razorpayEnabled } from './razorpay';
/** Test payments run only without Razorpay keys, and in production only if ALLOW_TEST_PAYMENTS=true. */
export const testPaymentsAllowed = () => !razorpayEnabled() && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_PAYMENTS === 'true');
