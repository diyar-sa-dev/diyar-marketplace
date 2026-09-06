interface ApplePaySessionStatic {
  canMakePayments(): boolean;
}

interface Window {
  ApplePaySession?: ApplePaySessionStatic;
}
