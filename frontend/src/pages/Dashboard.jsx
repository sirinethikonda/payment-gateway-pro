import React, { useEffect, useState } from 'react';
import { getStats, getWebhookLogs, retryWebhook, updateWebhookConfig, regenerateWebhookSecret, getMerchant, logout, getPayments, getRefunds, createRefund, createOrder } from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalTransactions: 0, totalAmount: 0, successRate: 0 });
    const [creds, setCreds] = useState({ apiKey: '', apiSecret: '' });
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payments' | 'refunds' | 'terminal' | 'webhooks'

    // Data States
    const [payments, setPayments] = useState([]);
    const [refunds, setRefunds] = useState([]);

    // Webhook States
    const [webhookConfig, setWebhookConfig] = useState({ url: '', secret: '' });
    const [webhookLogs, setWebhookLogs] = useState([]);
    const [logsMeta, setLogsMeta] = useState({ total: 0, offset: 0, limit: 10 });
    const [configStatus, setConfigStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Refund Modal State
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundStatus, setRefundStatus] = useState('');

    // Terminal State
    const [terminal, setTerminal] = useState({ amount: '', currency: 'INR', receipt: '', notes: '' });
    const [createdOrder, setCreatedOrder] = useState(null);
    const [terminalLoading, setTerminalLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            const apiKey = localStorage.getItem('apiKey') || 'key_test_abc123';
            const apiSecret = localStorage.getItem('apiSecret') || 'secret_test_xyz789';
            setCreds({ apiKey, apiSecret });
            await fetchStats();
        };
        init();
    }, []);

    useEffect(() => {
        if (activeTab === 'webhooks') {
            fetchWebhookConfig();
            fetchWebhookLogs();
        } else if (activeTab === 'payments') {
            fetchPayments();
        } else if (activeTab === 'refunds') {
            fetchRefunds();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const data = await getStats();
            const totalTransactions = data.length;
            const totalAmount = data.reduce((sum, p) => p.status === 'success' ? sum + p.amount : sum, 0);
            const successCount = data.filter(p => p.status === 'success').length;
            const successRate = totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0;
            setStats({ totalTransactions, totalAmount, successRate });
        } catch (err) {
            console.error("Stats fetch failed", err);
        }
    };

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const data = await getPayments();
            const sorted = Array.isArray(data) ? data.reverse() : [];
            setPayments(sorted);
        } catch (err) {
            console.error("Payments fetch failed", err);
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRefunds = async () => {
        setIsLoading(true);
        try {
            const data = await getRefunds();
            const sorted = Array.isArray(data) ? data.reverse() : [];
            setRefunds(sorted);
        } catch (err) {
            console.error("Refunds fetch failed", err);
            setRefunds([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ... Webhook functions (fetchWebhookConfig, fetchWebhookLogs, handleSaveConfig, handleRegenerate, handleRetry) ...
    const fetchWebhookConfig = async () => {
        try {
            const merchant = await getMerchant();
            setWebhookConfig({
                url: merchant.webhookUrl || '',
                secret: merchant.webhookSecret || ''
            });
        } catch (err) {
            console.error("Config fetch failed", err);
        }
    };

    const fetchWebhookLogs = async (offset = 0) => {
        try {
            const data = await getWebhookLogs(offset, 10);
            setWebhookLogs(data.data);
            setLogsMeta({ total: data.total, offset: data.offset, limit: data.limit });
        } catch (err) {
            console.error("Logs fetch failed", err);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setConfigStatus('saving');
        try {
            await updateWebhookConfig(webhookConfig.url, webhookConfig.secret);
            setConfigStatus('saved');
            setTimeout(() => setConfigStatus(''), 2000);
        } catch (err) {
            setConfigStatus('error');
        }
    };

    const handleRegenerate = async () => {
        if (window.confirm("Regenerate secret? This will invalidate the old one.")) {
            try {
                const res = await regenerateWebhookSecret();
                setWebhookConfig(prev => ({ ...prev, secret: res.secret }));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleRetry = async (id) => {
        try {
            await retryWebhook(id);
            fetchWebhookLogs(logsMeta.offset);
        } catch (err) {
            alert("Retry failed");
        }
    };


    // Refund Handlers
    const openRefundModal = (payment) => {
        setSelectedPayment(payment);
        setRefundAmount(payment.amount); // Default to full amount
        setRefundReason('');
        setRefundStatus('');
        setRefundModalOpen(true);
    };

    const handleCreateRefund = async (e) => {
        e.preventDefault();
        setRefundStatus('processing');
        try {
            await createRefund(selectedPayment.id, parseInt(refundAmount), refundReason);
            setRefundStatus('success');
            setTimeout(() => {
                setRefundModalOpen(false);
                fetchPayments(); // Refresh list
            }, 1500);
        } catch (err) {
            setRefundStatus('error');
        }
    };

    // Terminal Handlers
    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setTerminalLoading(true);
        try {
            // Convert amount to paisa (dummy logic if input is INR)
            const amountInPaisa = parseInt(terminal.amount) * 100;
            const order = await createOrder(amountInPaisa, terminal.currency, terminal.receipt || `rcpt_${Date.now()}`);
            setCreatedOrder(order);
        } catch (err) {
            alert("Failed to create order");
        } finally {
            setTerminalLoading(false);
        }
    };

    const NavItem = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${activeTab === tab ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div data-test-id="dashboard" className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <div className="w-72 bg-slate-900 text-white flex flex-col fixed h-full shadow-2xl z-30">
                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">NovaPay</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem
                        tab="overview"
                        label="Overview"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>}
                    />
                    <NavItem
                        tab="payments"
                        label="Payments"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    />
                    <NavItem
                        tab="refunds"
                        label="Refunds"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>}
                    />
                    <NavItem
                        tab="terminal"
                        label="Terminal"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
                    />
                    <NavItem
                        tab="webhooks"
                        label="Developers"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>}
                    />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors w-full rounded-xl hover:bg-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-72 p-10 overflow-y-auto relative">

                {/* Modal Overlay */}
                {refundModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">Initiate Refund</h3>
                                <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateRefund} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment ID</label>
                                    <div className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-600">{selectedPayment?.id}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Paisa)</label>
                                    <input
                                        type="number"
                                        required
                                        max={selectedPayment?.amount}
                                        value={refundAmount}
                                        onChange={e => setRefundAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Max refundable: ₹{(selectedPayment?.amount / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Optional)</label>
                                    <textarea
                                        value={refundReason}
                                        onChange={e => setRefundReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        rows="2"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={refundStatus === 'processing'}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30"
                                >
                                    {refundStatus === 'processing' ? 'Processing...' : 'Confirm Refund'}
                                </button>
                                {refundStatus === 'success' && <div className="text-center text-emerald-600 font-bold text-sm">Refund Initiated!</div>}
                                {refundStatus === 'error' && <div className="text-center text-rose-600 font-bold text-sm">Action Failed. Try again.</div>}
                            </form>
                        </div>
                    </div>
                )}


                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <header className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
                                <p className="text-slate-500 mt-2 font-medium">Business performance at a glance.</p>
                            </div>
                        </header>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'Total Volume', value: `₹${(stats.totalAmount / 100).toLocaleString('en-IN')}`, color: 'blue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: 'Total Transactions', value: stats.totalTransactions, color: 'indigo', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                { label: 'Success Rate', value: `${Number(stats.successRate).toFixed(1)}%`, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-500 group-hover:text-white transition-all duration-300`}>
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon}></path></svg>
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{stat.label}</h3>
                                    <div className="text-4xl font-extrabold text-slate-900">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab: Payments */}
                {activeTab === 'payments' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <header className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payments</h2>
                            <p className="text-slate-500 mt-2 font-medium">Real-time transaction history.</p>
                        </header>

                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">All Payments</h3>
                                <button onClick={fetchPayments} className="text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                    Refresh Table
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="p-12 text-center text-slate-400">Loading payments...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="px-8 py-5">Payment ID</th>
                                                <th className="px-8 py-5">Amount</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                            {payments.map((txn) => (
                                                <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-8 py-5 font-mono text-xs text-blue-600 font-bold cursor-pointer hover:underline">{txn.id}</td>
                                                    <td className="px-8 py-5 font-bold text-slate-900">₹{(txn.amount / 100).toFixed(2)}</td>
                                                    <td className="px-8 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                            txn.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${txn.status === 'success' ? 'bg-emerald-500' :
                                                                txn.status === 'failed' ? 'bg-rose-500' :
                                                                    'bg-amber-500'
                                                                }`}></div>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        {txn.status === 'success' && (
                                                            <button
                                                                onClick={() => openRefundModal(txn)}
                                                                className="text-slate-600 hover:text-slate-900 font-bold text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                                            >
                                                                Refund
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {payments.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-16 text-center text-slate-400">
                                                        No payments found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Refunds */}
                {activeTab === 'refunds' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <header className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Refunds</h2>
                            <p className="text-slate-500 mt-2 font-medium">Track processed refunds.</p>
                        </header>

                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-800">All Refunds</h3>
                                <button onClick={fetchRefunds} className="text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                    Refresh Table
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="p-12 text-center text-slate-400">Loading refunds...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="px-8 py-5">Refund ID</th>
                                                <th className="px-8 py-5">Payment ID</th>
                                                <th className="px-8 py-5">Amount</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                            {refunds.map((ref) => (
                                                <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-8 py-5 font-mono text-xs text-slate-600">{ref.id}</td>
                                                    <td className="px-8 py-5 font-mono text-xs text-blue-600 hover:underline cursor-pointer">{ref.paymentId}</td>
                                                    <td className="px-8 py-5 font-bold text-slate-900">₹{(ref.amount / 100).toFixed(2)}</td>
                                                    <td className="px-8 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${ref.status === 'processed' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {ref.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right text-slate-500">{new Date(ref.createdAt || Date.now()).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {refunds.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-8 py-16 text-center text-slate-400">
                                                        No refunds found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Terminal (Virtual Terminal) */}
                {activeTab === 'terminal' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <header className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payment Links</h2>
                            <p className="text-slate-500 mt-2 font-medium">Create quick checkout links for customers.</p>
                        </header>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Create New Link</h3>
                                <form onSubmit={handleCreateOrder} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (INR)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="500"
                                            value={terminal.amount}
                                            onChange={e => setTerminal({ ...terminal, amount: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Consulting Fee"
                                            value={terminal.receipt}
                                            onChange={e => setTerminal({ ...terminal, receipt: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={terminalLoading || !terminal.amount}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all text-sm uppercase tracking-wide"
                                    >
                                        {terminalLoading ? 'Generating...' : 'Generate Payment Link'}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-6">
                                {createdOrder && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl animate-fade-in-up">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-emerald-800 font-bold mb-1">Link Generated!</h4>
                                                <p className="text-emerald-600 text-sm">Ready to share with customer.</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Checkout Link</label>
                                            <div className="space-y-3">
                                                <input
                                                    readOnly
                                                    value={`http://localhost:3001/?orderId=${createdOrder.id}`}
                                                    className="w-full px-3 py-3 bg-white border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    onClick={(e) => e.target.select()}
                                                />
                                                <a
                                                    href={`http://localhost:3001/?orderId=${createdOrder.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-center text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
                                                >
                                                    Open Payment Page
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!createdOrder && (
                                    <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8">
                                        <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        <p className="font-medium">No order created yet.</p>
                                        <p className="text-sm mt-1">Use the form to generate a test order.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* Tab: Webhooks */}
                {activeTab === 'webhooks' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <header className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Developers</h2>
                            <p className="text-slate-500 mt-2 font-medium">Manage webhooks and API settings.</p>
                        </header>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Configuration Config */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-8">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6">Webhook Configuration</h3>
                                    <form onSubmit={handleSaveConfig} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Callback URL</label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://api.yoursite.com/hook"
                                                value={webhookConfig.url}
                                                onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Secret Key</label>
                                            <div className="flex space-x-2">
                                                <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 truncate border-dotted border-2">
                                                    {webhookConfig.secret || 'Not Configured'}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRegenerate}
                                                    title="Regenerate Secret"
                                                    className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={configStatus === 'saving'}
                                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
                                        >
                                            {configStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        {configStatus === 'saved' && <div className="text-center text-emerald-600 text-sm font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100">Configuration Saved</div>}
                                    </form>
                                </div>
                            </div>

                            {/* Logs Table */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold text-slate-800">Recent Deliveries</h3>
                                        <button onClick={() => fetchWebhookLogs(0)} className="text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                            Refresh Logs
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                                <tr>
                                                    <th className="px-8 py-4">Status</th>
                                                    <th className="px-8 py-4">Event</th>
                                                    <th className="px-8 py-4">Time</th>
                                                    <th className="px-8 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {webhookLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-8 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                                log.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {log.status === 'success' && <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>}
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-4 font-mono text-xs text-slate-600 bg-slate-50/50 rounded p-1">{log.event}</td>
                                                        <td className="px-8 py-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                                        <td className="px-8 py-4 text-right">
                                                            <button
                                                                onClick={() => handleRetry(log.id)}
                                                                className="text-slate-600 hover:text-slate-900 font-bold text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                                            >
                                                                Retry
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {webhookLogs.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-8 py-12 text-center text-slate-400">
                                                            No webhooks sent yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-8 py-5 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500 bg-slate-50/30">
                                        <span>Page {Number(logsMeta.offset) / Number(logsMeta.limit) + 1}</span>
                                        <div className="space-x-2">
                                            <button
                                                disabled={Number(logsMeta.offset) === 0}
                                                onClick={() => fetchWebhookLogs(Math.max(0, Number(logsMeta.offset) - Number(logsMeta.limit)))}
                                                className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 font-medium transition-colors shadow-sm"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                disabled={Number(logsMeta.offset) + Number(logsMeta.limit) >= Number(logsMeta.total)}
                                                onClick={() => fetchWebhookLogs(Number(logsMeta.offset) + Number(logsMeta.limit))}
                                                className="px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 font-medium transition-colors shadow-sm"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;