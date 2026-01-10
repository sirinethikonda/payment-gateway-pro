import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getOrder = async (orderId) => {
    try {
        const response = await api.get(`/orders/public/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
};

export const createPayment = async (paymentData) => {
    try {
        const response = await api.post('/payments/public', paymentData);
        return response.data;
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
};

export const getPaymentStatus = async (paymentId) => {
    try {
        const response = await api.get(`/payments/public/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching payment status:", error);
        throw error;
    }
};

export default api;
