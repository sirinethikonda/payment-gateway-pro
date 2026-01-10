import React, { useState } from 'react';

const CardForm = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        holder_name: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.number || formData.number.length < 13) newErrors.number = "Invalid card number";
        if (!formData.holder_name) newErrors.holder_name = "Holder name is required";
        if (!formData.expiry_month || formData.expiry_month < 1 || formData.expiry_month > 12) newErrors.expiry_month = "Invalid month";
        if (!formData.expiry_year || formData.expiry_year.length !== 4) newErrors.expiry_year = "Invalid year";
        if (!formData.cvv || formData.cvv.length < 3) newErrors.cvv = "Invalid CVV";

        // Basic Luhn check could be added here for better UX, but backend validates too.

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Card Holder Name</label>
                <input
                    type="text"
                    name="holder_name"
                    value={formData.holder_name}
                    onChange={handleChange}
                    data-test-id="input-card-holder-name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="John Doe"
                />
                {errors.holder_name && <p className="mt-1 text-xs text-red-600">{errors.holder_name}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Card Number</label>
                <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    data-test-id="input-card-number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                />
                {errors.number && <p className="mt-1 text-xs text-red-600">{errors.number}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Month</label>
                    <input
                        type="number"
                        name="expiry_month"
                        value={formData.expiry_month}
                        onChange={handleChange}
                        data-test-id="input-card-expiry-month"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="MM"
                        min="1" max="12"
                    />
                    {errors.expiry_month && <p className="mt-1 text-xs text-red-600">{errors.expiry_month}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                        type="number"
                        name="expiry_year"
                        value={formData.expiry_year}
                        onChange={handleChange}
                        data-test-id="input-card-expiry-year"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="YYYY"
                    />
                    {errors.expiry_year && <p className="mt-1 text-xs text-red-600">{errors.expiry_year}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">CVV</label>
                    <input
                        type="password"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        data-test-id="input-card-cvv"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="123"
                        maxLength={4}
                    />
                    {errors.cvv && <p className="mt-1 text-xs text-red-600">{errors.cvv}</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                data-test-id="btn-pay-card"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
                {isLoading ? 'Processing...' : 'Pay with Card'}
            </button>
        </form>
    );
};

export default CardForm;
