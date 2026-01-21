import React, { useState } from 'react';
import axios from 'axios';

const Checkout = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId') || 'ORDER_12345';
    // For demo, amount is fixed or could be fetched. Let's assume 500.00
    const amount = 50000; // in paise

    const [method, setMethod] = useState('card'); // card | upi
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [vpa, setVpa] = useState('');
    const [status, setStatus] = useState('idle'); // idle | processing | success | failed
    const [receipt, setReceipt] = useState(null);

    // Embed mode check
    const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === 'true';

    const handlePayment = async (e) => {
        e.preventDefault();
        setStatus('processing');

        // Simulate processing time for UX
        await new Promise(r => setTimeout(r, 1500));

        try {
            const payload = {
                order_id: orderId,
                method,
                ...(method === 'upi' ? { vpa } : {
                    card: {
                        number: card.number.replace(/\s/g, ''),
                        expiry_month: card.expiry.split('/')[0],
                        expiry_year: '20' + card.expiry.split('/')[1],
                        cvv: card.cvv,
                        holder_name: card.name
                    }
                })
            };

            const response = await axios.post('http://localhost:8000/api/v1/payments', payload);

            // Poll for status or assume success for this demo flow if async returns pending
            // For 'Razorpay' feel, we show success immediately if API returns 201/200
            // But our API returns 'pending'.
            // Let's verify status.

            if (response.data.status === 'pending' || response.data.status === 'success') {
                setStatus('success');
                setReceipt(response.data);
                if (isEmbedded) {
                    window.parent.postMessage({ type: 'payment_success', data: response.data }, '*');
                }
            } else {
                throw new Error('Payment failed');
            }

        } catch (err) {
            setStatus('failed');
            if (isEmbedded) {
                window.parent.postMessage({ type: 'payment_failed', data: err.response?.data }, '*');
            }
        }
    };

    if (status === 'processing') {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-10 h-[400px]">
                    <div className="relative w-24 h-24 mb-8">
                        {/* Coin Animation */}
                        <div className="w-full h-full animate-coin-flip transform-style-preserve-3d">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full border-4 border-yellow-500 flex items-center justify-center shadow-lg backface-hidden">
                                <span className="text-4xl font-bold text-yellow-700">₹</span>
                            </div>
                            <div className="absolute inset-0 bg-yellow-400 rounded-full border-4 border-yellow-500 flex items-center justify-center shadow-lg backface-hidden rotate-y-180">
                                <div className="w-12 h-12 bg-yellow-600 rounded-full opacity-50"></div>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 animate-pulse">Processing Payment...</h2>
                    <p className="text-sm text-slate-500 mt-2 text-center">Please do not close this window.</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                    <div className="bg-emerald-500 p-8 text-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold">Payment Successful!</h2>
                        <p className="text-emerald-100 mt-1">Transaction ID: {receipt?.id?.slice(-8)}</p>
                    </div>
                    <div className="p-8">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-500">Amount Paid</span>
                            <span className="text-xl font-bold text-gray-900">₹{(amount / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-500">Paid via</span>
                            <span className="font-medium text-gray-900 uppercase">{method}</span>
                        </div>
                        <button
                            onClick={() => isEmbedded ? window.parent.postMessage({ type: 'close_modal' }, '*') : window.location.href = 'http://localhost:3000/dashboard'}
                            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-colors shadow-lg shadow-slate-900/20"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isEmbedded ? 'bg-transparent' : 'bg-gray-50'} flex items-center justify-center p-4 font-sans`}>
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-slate-100">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 text-blue-400 mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path></svg>
                            <span className="text-xs font-bold tracking-widest uppercase">Trusted Pay</span>
                        </div>
                        <h1 className="text-lg font-medium text-slate-200">Test Merchant</h1>
                        <div className="text-3xl font-bold mt-1 text-white">₹{(amount / 100).toFixed(2)}</div>
                    </div>
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 relative z-10">
                        <span className="text-white font-bold text-xs">TM</span>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Payment Method</p>

                    {/* Method Tabs */}
                    <div className="flex space-x-3 mb-6 p-1 bg-slate-200/50 rounded-2xl">
                        <button
                            onClick={() => setMethod('card')}
                            className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${method === 'card' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            <span className="text-xs font-bold">Card</span>
                        </button>
                        <button
                            onClick={() => setMethod('upi')}
                            className={`flex-1 flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${method === 'upi' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            <span className="text-xs font-bold">UPI</span>
                        </button>
                    </div>

                    <form id="payment-form" onSubmit={handlePayment} className="space-y-5">
                        {method === 'card' ? (
                            <div className="space-y-4 animate-fade-in-up">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Card Number</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            value={card.number}
                                            onChange={(e) => setCard({ ...card, number: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm text-slate-800 shadow-sm group-hover:border-slate-300"
                                        />
                                        <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={card.expiry}
                                            onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">CVV</label>
                                        <input
                                            type="password"
                                            placeholder="123"
                                            value={card.cvv}
                                            onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Cardholder Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={card.name}
                                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in-up">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">UPI ID</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="username@upi"
                                            value={vpa}
                                            onChange={(e) => setVpa(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm group-hover:border-slate-300"
                                        />
                                        <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 ml-1">Securely pay using your Virtual Payment Address (VPA).</p>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Error Message */}
                    {status === 'failed' && (
                        <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm flex items-center border border-rose-100 animate-shake">
                            <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Payment Failed. Please try again.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100">
                    <button
                        form="payment-form"
                        disabled={status === 'processing'}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-all active:scale-95 disabled:scale-100 disabled:opacity-70 flex items-center justify-center text-[15px] tracking-wide"
                    >
                        Pay ₹{(amount / 100).toFixed(2)}
                    </button>
                    <div className="flex justify-center items-center mt-4 space-x-2 text-slate-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Secured by 256-bit Encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;