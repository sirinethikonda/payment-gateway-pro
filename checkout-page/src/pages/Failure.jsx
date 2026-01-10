import React from 'react';

const Failure = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                    <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Failed</h2>
                <p className="text-gray-500 mb-8">Something went wrong. Please try again.</p>

                <button
                    onClick={() => window.history.back()}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default Failure;
