// src/types/user.ts

// 1. Qaab-dhismeedka qofka isticmaalaha ah ee gudaha Login-ka dhex jira
export interface UserData {
  id: number;
  fullname: string;
  phone: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CASHIER';
  created_at: string;
  updated_at: string;
}

// 2. Nooca xogta dhabta ah ee ka soo baxda `/api/users/login`
export interface LoginResponse {
  message: string;
  data: {
    User: UserData;
    access_token: string;
    refresh_token: string;
  };
}

// 3. Nooca xogta qofka soo login gareysan ee ka soo baxda `/api/users/whoami`
export interface WhoAmIResponse {
  is_success: boolean;
  data: {
    user_id: number;
    username: string;
    role: 'ADMIN' | 'STAFF' | 'CASHIER';
  };
}
// Ku dar koodhkan faylkaaga src/types/user.ts si uu u dhammaystiro nidaamka

// 1. Xogta loo dirayo Backend-ka marka qof la diiwangelinayo
export interface RegisterRequest {
  fullname: string;
  email: string;
  phone: string;
  password: string;
  role: 'ADMIN' | 'STAFF' | 'CASHIER';
}

// 2. Jawaabta (Response) ka soo baxaysa /api/users/create
export interface RegisterResponse {
  is_success: boolean;
  message: string;
}