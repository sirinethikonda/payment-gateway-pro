import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getOrder, createPayment, getPaymentStatus } from '../services/api';

const Checkout = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState(''); 
    const [paymentState, setPaymentState] = useState('input');
    const [paymentId, setPaymentId] = useState(''); // Variable now used below

    const [vpa, setVpa] = useState('');
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (orderId) {
                    const data = await getOrder(orderId);
                    setOrder(data);
                }
            } catch (_err) { 
                // FIX: Log the error to satisfy the [no-unused-vars] linter
                console.error("Order load error:", _err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchOrder();
    }, [orderId]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setPaymentState('processing');

        try {
            const payload = { 
                order_id: orderId, 
                method: method,
                ...(method === 'upi' ? { vpa } : { card: { 
                    number: cardData.number, 
                    expiry_month: cardData.expiry.split('/')[0], 
                    expiry_year: '20' + cardData.expiry.split('/')[1], 
                    cvv: cardData.cvv, 
                    holder_name: cardData.name 
                }})
            };

            const payment = await createPayment(payload);
            setPaymentId(payment.id); // Assignment

            const interval = setInterval(async () => {
                try {
                    const statusData = await getPaymentStatus(payment.id);
                    if (statusData.status?.toLowerCase() === 'success') {
                        clearInterval(interval);
                        setPaymentState('success');
                        setTimeout(() => navigate(`/success?payment_id=${payment.id}`), 1500);
                    }
                } catch (_err) { 
                    // FIX: Log to satisfy linter
                    console.warn("Polling retry...", _err); 
                }
            }, 2000);

        } catch (_err) { 
            console.error("Payment initiation failed:", _err);
            setPaymentState('failed'); 
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header with Amount */}
                <div className="bg-blue-600 p-8 text-white text-center">
                    <p className="text-sm opacity-80 uppercase tracking-widest">Amount to Pay</p>
                    <h2 className="text-5xl font-extrabold mt-2">₹{(order.amount / 100).toFixed(2)}</h2>
                </div>

                <div className="p-8">
                    {paymentState === 'input' && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <button onClick={() => setMethod('upi')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${method === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-200 text-gray-400'}`}>UPI</button>
                                <button onClick={() => setMethod('card')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${method === 'card' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : 'border-gray-200 text-gray-400'}`}>Card</button>
                            </div>
                            {method && (
                                <form onSubmit={handlePayment} className="space-y-4">
                                    <input placeholder={method === 'upi' ? "user@bank" : "Card Number"} className="w-full p-4 border rounded-xl outline-none" required onChange={(e) => method === 'upi' ? setVpa(e.target.value) : setCardData({...cardData, number: e.target.value})} />
                                    <button data-test-id="pay-button" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">Pay Now</button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* PROCESSING STATE: COIN STYLE */}
                    {paymentState === 'processing' && (
                        <div data-test-id="processing-state" className="text-center py-10">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-yellow-100 border-t-yellow-500 animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-14 h-14 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-xl flex items-center justify-center animate-bounce">
                                        <span className="text-2xl font-black text-yellow-900">₹</span>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Processing Payment</h3>
                        </div>
                    )}

                    {/* SUCCESS STATE: Uses paymentId to satisfy linter */}
                    {paymentState === 'success' && (
                        <div data-test-id="success-state" className="text-center py-10">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h2 className="text-2xl font-bold">Payment Successful</h2>
                            {/* FIX: Reading paymentId satisfies [no-unused-vars] */}
                            <p className="text-xs text-gray-400 mt-2 font-mono">Ref: {paymentId}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Checkout;