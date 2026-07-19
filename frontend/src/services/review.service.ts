import api from "./api";

export interface Review {
    id: string;
    appointmentId: string;
    userId: string;
    doctorId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    doctor?: {
        name: string;
        avatar: string | null;
        specialty?: { name: string };
    };
    appointment?: {
        appointmentDate: string;
        patientProfileName: string;
    };
}

export const reviewService = {
    createReview: async (data: { appointmentId: string; rating: number; comment?: string }) => {
        const response = await api.post("/reviews", data);
        return response.data;
    },

    getMyReviews: async (): Promise<{ data: Review[] }> => {
        const response = await api.get("/reviews/me");
        return response.data;
    },

    getPendingReviews: async (): Promise<{ data: any[] }> => {
        const response = await api.get("/reviews/pending");
        return response.data;
    }
};
