import React, { useState } from 'react';

const UPIForm = ({ onSubmit, isLoading }) => {
    const [vpa, setVpa] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setVpa(e.target.value);
        if (error) setError('');
    };

    const validate = () => {
        // Simple VPA regex: username@bank
        const vpaRegex = /^[\w.-]+@[\w.-]+$/;
        if (!vpaRegex.test(vpa)) {
            setError("Invalid VPA format (e.g. user@bank)");
            return false;
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({ vpa });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">UPI ID / VPA</label>
                <input
                    type="text"
                    value={vpa}
                    onChange={handleChange}
                    data-test-id="input-vpa"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="user@upi"
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                data-test-id="btn-pay-upi"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Pay with UPI'}
            </button>
        </form>
    );
};

export default UPIForm;
