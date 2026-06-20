import type { Supplier } from './supplier';

export interface Shoe {
  shoe_id: number;
  shoe_name: string;
  shoe_type: string;
  shoe_brand: string;
  shoe_des: string;
  qty: number;
  price: number;
  supplier?: Supplier;
}

export interface ShoeInput {
  shoe_name: string;
  shoe_type: string;
  shoe_brand: string;
  shoe_des: string;
  qty: number | string;
  price: number | string;
  sup_id: number | string;
}