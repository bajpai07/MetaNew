import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Close } from './Marks';

/**
 * Payment sits on paper, like the checkout behind it. The "🔒 256-bit AES
 * Bank-grade Security" line is gone — it was the only sentence on the screen
 * shouting, and a padlock emoji is not what makes a house trustworthy.
 * The sandbox note stays, because that one is true and useful.
 */
export default function PaymentModal({ amount, onPay, onClose }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.replace(/(.{4})/g, '$1 ').trim();
    if (val.length <= 19) setCardNumber(val);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
    if (val.length <= 5) setExpiry(val);
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length <= 3) setCvv(val);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
      toast.error('Enter full card details to simulate payment');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPay();
    }, 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(14,12,11,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}
    >
      <div
        className="on-paper"
        style={{ width: '100%', maxWidth: '420px', padding: '36px 32px 32px', position: 'relative' }}
      >
        <button
          onClick={onClose}
          disabled={isProcessing}
          aria-label="Close payment"
          style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px', margin: '-10px' }}
        >
          <Close size={15} />
        </button>

        <h2 className="display display-m" style={{ marginBottom: '6px' }}>Payment</h2>
        <p className="meta" style={{ marginBottom: '32px' }}>Aiyaashi virtual gateway · sandbox</p>

        <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="meta" htmlFor="pay-card" style={{ display: 'block' }}>Card number</label>
            <input
              id="pay-card"
              className="field"
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              required
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={isProcessing}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label className="meta" htmlFor="pay-exp" style={{ display: 'block' }}>Valid to</label>
              <input
                id="pay-exp"
                className="field"
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                required
                value={expiry}
                onChange={handleExpiryChange}
                disabled={isProcessing}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="meta" htmlFor="pay-cvv" style={{ display: 'block' }}>Security code</label>
              <input
                id="pay-cvv"
                className="field"
                type="password"
                inputMode="numeric"
                placeholder="000"
                required
                value={cvv}
                onChange={handleCvvChange}
                disabled={isProcessing}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-bone" disabled={isProcessing} style={{ width: '100%', marginTop: '8px' }}>
            {isProcessing ? 'Processing' : `Pay ₹${Number(amount).toLocaleString('en-IN')}`}
          </button>
        </form>
      </div>
    </div>
  );
}
