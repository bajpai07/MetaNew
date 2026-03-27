import React, { useState } from 'react';
import toast from 'react-hot-toast';

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
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    if (val.length <= 5) setExpiry(val);
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length <= 3) setCvv(val);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
      toast.error("Please enter valid card details to simulate payment");
      return;
    }

    setIsProcessing(true);
    // 2-Second Simulated Network Delay
    setTimeout(() => {
      setIsProcessing(false);
      onPay();
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', position: 'relative', border: '0.5px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <button onClick={onClose} disabled={isProcessing} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
        
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 5px 0', color: 'var(--white)', fontSize: '24px', fontWeight: 400 }}>Complete Payment</h2>
        <p style={{ margin: '0 0 25px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>MetaShop Virtual Gateway (Sandbox)</p>

        <form onSubmit={handlePayment}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', letterSpacing: '0.1em', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Card Number</label>
            <input type="text" placeholder="XXXX XXXX XXXX XXXX" required value={cardNumber} onChange={handleCardNumberChange} disabled={isProcessing} style={{ width: '100%', padding: '14px', border: '0.5px solid var(--border)', borderRadius: '8px', fontSize: '15px', letterSpacing: '2px', background: 'var(--surface-2)', color: 'var(--white)', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', letterSpacing: '0.1em', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Valid Thru</label>
              <input type="text" placeholder="MM/YY" required value={expiry} onChange={handleExpiryChange} disabled={isProcessing} style={{ width: '100%', padding: '14px', border: '0.5px solid var(--border)', borderRadius: '8px', fontSize: '15px', textAlign: 'center', background: 'var(--surface-2)', color: 'var(--white)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
               <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', letterSpacing: '0.1em', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CVV</label>
               <input type="password" placeholder="•••" required value={cvv} onChange={handleCvvChange} disabled={isProcessing} style={{ width: '100%', padding: '14px', border: '0.5px solid var(--border)', borderRadius: '8px', fontSize: '15px', textAlign: 'center', letterSpacing: '4px', background: 'var(--surface-2)', color: 'var(--white)', outline: 'none' }} />
            </div>
          </div>

          <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '16px', background: isProcessing ? 'var(--surface-3)' : 'var(--rose)', color: 'var(--white)', border: 'none', borderRadius: '8px', fontSize: '13px', letterSpacing: '0.15em', fontWeight: '500', cursor: isProcessing ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
            {isProcessing ? 'PROCESSING...' : `PAY ₹${amount}`}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px', color: 'var(--text-muted)' }}>
           🔒 256-bit AES Bank-grade Security
        </div>
      </div>
    </div>
  );
}
