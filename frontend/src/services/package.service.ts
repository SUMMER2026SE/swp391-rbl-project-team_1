import api from "./api";

export interface MedicalPackage {
    id: string;
    name: string;
    description: string;
    price: number;
    estimatedDuration: number;
}

export const packageService = {
    async getPackages() {
        const response = await api.get<MedicalPackage[]>("/packages");
        return response.data;
    },
};
