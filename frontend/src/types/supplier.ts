// src/types/supplier.ts

export interface Supplier {
  sup_id: number;
  sup_name: string;
  sup_address: string;
  contact: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierInput {
  sup_name: string;
  sup_address: string;
  contact: string;
}