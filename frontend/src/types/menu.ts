// src/types/menu.ts


export interface SidebarItem {
  title: string;
  path: string;
  icon: string; // Magaca icon-ka oo string ah ama loo dhiibo LucideIcon
  roles: ('ADMIN' | 'STAFF' | 'CASHIER')[]; // Kuwa loo oggol yahay oo kaliya
}