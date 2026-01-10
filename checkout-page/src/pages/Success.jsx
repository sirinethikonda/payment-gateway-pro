import React from 'react';
import { useSearchParams } from 'react-router-dom';

const Success = () => {
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('payment_id');
    
    // In a real app, you'd fetch these from the backend. 
    // Here we simulate based on the standard 18% GST.
    const totalAmountPaise = 60000; // Example: ₹600.00
    const totalAmount = totalAmountPaise / 100;
    const gstRate = 0.18;
    const basePrice = totalAmount / (1 + gstRate);
    const gstAmount = totalAmount - basePrice;

    const handleBackToMerchant = () => {
        // Redirecting back to verify the stats updated in the Merchant Dashboard
        window.location.href = 'http://localhost:3000/dashboard';
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Receipt Header */}
                <div className="bg-green-600 p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold">Payment Successful</h2>
                    <p className="opacity-80 text-sm">Thank you for your purchase</p>
                </div>

                {/* Receipt Details */}
                <div className="p-8 space-y-6">
                    <div className="border-b border-dashed pb-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium text-gray-800">{new Date().toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Transaction ID</span>
                            <span className="font-mono font-medium text-blue-600 uppercase text-xs">{paymentId}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Base Price</span>
                            <span className="text-gray-800">₹{basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">GST (18%)</span>
                            <span className="text-gray-800">₹{gstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-4 border-t">
                            <span className="text-gray-900">Total Paid</span>
                            <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={handleBackToMerchant}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-black transition-all transform hover:-translate-y-1"
                        >
                            Return to Merchant Dashboard
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">
                            
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Success;