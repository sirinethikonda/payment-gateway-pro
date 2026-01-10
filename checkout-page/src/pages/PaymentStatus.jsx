import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPaymentStatus } from '../services/api';

const PaymentStatus = () => {
    const { paymentId } = useParams();
    const [status, setStatus] = useState('pending');
    const [details, setDetails] = useState(null);

    useEffect(() => {
        let intervalId;

        const checkStatus = async () => {
            try {
                const data = await getPaymentStatus(paymentId);
                setDetails(data);
                setStatus(data.status?.toLowerCase() || 'pending');

                if (data.status === 'SUCCESS' || data.status === 'FAILED') {
                    clearInterval(intervalId);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        };

        // Initial check
        checkStatus();

        // Poll every 2 seconds
        intervalId = setInterval(checkStatus, 2000);

        return () => clearInterval(intervalId);
    }, [paymentId]);

    const renderContent = () => {
        if (status === 'success') {
            return (
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                        <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 mb-8">Transaction ID: {paymentId}</p>
                    <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                        <p className="text-sm text-gray-600">Amount Paid</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {details?.currency} {details?.amount ? (details.amount / 100).toFixed(2) : '-.--'}
                        </p>
                    </div>
                </div>
            );
        }

        if (status === 'failed') {
            return (
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                        <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Failed</h2>
                    <p className="text-gray-500 mb-8">Please try again.</p>
                </div>
            );
        }

        return (
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6 animate-pulse">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
                <p className="text-gray-500">Please do not close this window.</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {renderContent()}
            </div>
        </div>
    );
};

export default PaymentStatus;
