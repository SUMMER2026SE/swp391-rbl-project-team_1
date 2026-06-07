import api from "./api";

export interface CreatePaymentUrlResponse {
    message: string;
    paymentUrl: string;
}

export interface MockPayResponse {
    message: string;
    success: boolean;
    appointmentId: string;
    transactionId: string;
}

export const paymentService = {
    /**
     * Request backend to create VNPay checkout URL
     */
    async createPaymentUrl(appointmentId: string): Promise<CreatePaymentUrlResponse> {
        const response = await api.post<CreatePaymentUrlResponse>("/payment/create-url", {
            appointmentId,
        });
        return response.data;
    },

    /**
     * Request backend to instantly complete a simulated mock payment
     */
    async mockPay(appointmentId: string): Promise<MockPayResponse> {
        const response = await api.post<MockPayResponse>("/payment/mock-pay", {
            appointmentId,
        });
        return response.data;
    },
};
