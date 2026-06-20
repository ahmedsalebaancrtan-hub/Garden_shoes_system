export interface Customer {
  cus_id: number;
  cus_name: string;
  cus_address: string;
  cus_city: string;
  cus_phone: string;
  cus_age?: number;
}

export interface CustomerInput {
  cus_name: string;
  cus_address: string;
  cus_city: string;
  cus_phone: string;
  cus_age?: number | string;
}