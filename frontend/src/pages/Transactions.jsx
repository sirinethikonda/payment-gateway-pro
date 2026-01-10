import { useEffect, useState } from 'react';
import { getPayments } from '../services/api';

const Transactions = () => {
    const [payments, setPayments] = useState([]);

	useEffect(() => {
	        const fetch = async () => {
	            try {
	                const data = await getPayments();
	                setPayments(data);
	            } catch { 
	                // Variable removed entirely to satisfy [no-unused-vars]
	                console.error("Failed to fetch transactions. Check your API and CORS settings.");
	            }
	        }
	        fetch();
	    }, []);
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Transactions</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table data-test-id="transactions-table" className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map(p => (
                                // Requirement: data-payment-id must match the payment ID
                                <tr key={p.id} data-test-id="transaction-row" data-payment-id={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td data-test-id="payment-id" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                                    <td data-test-id="order-id" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{p.orderId || '-'}</td>
                                    {/* Requirement: Amount display logic (division by 100 for INR) */}
                                    <td data-test-id="amount" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(p.amount / 100).toFixed(2)}</td>
                                    <td data-test-id="method" className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                        {p.method?.toLowerCase()}
                                    </td>
                                    <td data-test-id="status" className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                p.status?.toUpperCase() === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                                p.status?.toUpperCase() === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {p.status?.toLowerCase()}
                                        </span>
                                    </td>
                                    <td data-test-id="created-at" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;