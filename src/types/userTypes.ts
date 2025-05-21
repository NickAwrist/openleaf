export interface User {
    id: string;
    nickname: string;
    phoneNumber?: string;
    email?: string;
    masterPassword: string;
    sessionExpiresAt: string;
    createdAt: string;
}