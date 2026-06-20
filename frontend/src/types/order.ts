import type { Customer } from './customer';
import type { Shoe } from './shoe';
import type { Employee } from './employee';

export interface Order {
  o_id: number;
  qty: number;
  total_price: number;
  status: 'PAID' | 'DEBT' | 'PARTIAL';
  order_date: string;
  customer?: Customer;
  shoe?: Shoe;
  employee?: Employee;
  user?: Employee;
  order_items?: OrderItem[];
  cus_id?: number;
  shoe_id?: number;
  emp_id?: number;
}

export interface OrderItem {
  qty: number;
  shoe?: Shoe;
  shoe_id?: number;
}

export interface CreateOrderPayload {
  cus_id: number;
  shoe_id: number;
  emp_id: number;
  qty: number;
  amount_paid: number;
  payment_method: string;
}

export interface CartItem {
  shoe_id: number;
  shoe_name: string;
  shoe_brand: string;
  price: number;
  stock: number;
  qty: number;
}
