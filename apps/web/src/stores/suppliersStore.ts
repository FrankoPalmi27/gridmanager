import { create } from 'zustand';

export interface Supplier {
  id: string;
  name: string;
  businessName: string;
  taxId: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms: number; // días
  currentBalance: number; // saldo actual (positivo = nos deben, negativo = les debemos)
  creditLimit?: number;
  category: string;
  active: boolean;
  lastPurchaseDate?: string;
  totalPurchases: number;
}

// Mock data for suppliers
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'TechDistributor SA',
    businessName: 'Tech Distributor Sociedad Anónima',
    taxId: '20-12345678-9',
    email: 'ventas@techdistributor.com',
    phone: '+54 11 4567-8900',
    address: 'Av. Córdoba 1234, CABA',
    contactPerson: 'Juan Carlos Pérez',
    paymentTerms: 30,
    currentBalance: -45000, // Les debemos
    creditLimit: 100000,
    category: 'Tecnología',
    active: true,
    lastPurchaseDate: '2024-01-20',
    totalPurchases: 250000
  },
  {
    id: '2',
    name: 'Logística Express',
    businessName: 'Logística Express SRL',
    taxId: '20-87654321-0',
    email: 'contacto@logisticaexpress.com',
    phone: '+54 11 5678-9012',
    address: 'Ruta 8 Km 45, Pilar',
    contactPerson: 'María González',
    paymentTerms: 15,
    currentBalance: 12000, // Nos deben
    creditLimit: 50000,
    category: 'Logística',
    active: true,
    lastPurchaseDate: '2024-01-18',
    totalPurchases: 180000
  },
  {
    id: '3',
    name: 'Papelería Central',
    businessName: 'Papelería Central LTDA',
    taxId: '20-11223344-5',
    email: 'pedidos@papeleriacentral.com',
    phone: '+54 11 6789-0123',
    address: 'San Martín 567, San Isidro',
    contactPerson: 'Roberto Silva',
    paymentTerms: 21,
    currentBalance: -8500, // Les debemos
    creditLimit: 25000,
    category: 'Oficina',
    active: true,
    lastPurchaseDate: '2024-01-15',
    totalPurchases: 95000
  },
  {
    id: '4',
    name: 'Servicios IT Pro',
    businessName: 'Servicios IT Profesionales SA',
    taxId: '20-55667788-9',
    email: 'info@serviciosit.com',
    phone: '+54 11 7890-1234',
    address: 'Belgrano 890, Vicente López',
    contactPerson: 'Ana Rodríguez',
    paymentTerms: 45,
    currentBalance: -22000, // Les debemos
    creditLimit: 75000,
    category: 'Servicios',
    active: true,
    lastPurchaseDate: '2024-01-12',
    totalPurchases: 320000
  },
  {
    id: '5',
    name: 'Materiales del Norte',
    businessName: 'Materiales del Norte SRL',
    taxId: '20-99887766-5',
    email: 'ventas@materialesnorte.com',
    phone: '+54 11 8901-2345',
    address: 'Panamericana Km 35, Tigre',
    contactPerson: 'Carlos Méndez',
    paymentTerms: 30,
    currentBalance: 5500, // Nos deben
    creditLimit: 40000,
    category: 'Materiales',
    active: true,
    lastPurchaseDate: '2024-01-10',
    totalPurchases: 145000
  },
  {
    id: '6',
    name: 'Marketing Digital Plus',
    businessName: 'Marketing Digital Plus LTDA',
    taxId: '20-44556677-8',
    email: 'contacto@marketingplus.com',
    phone: '+54 11 9012-3456',
    address: 'Libertador 2345, Olivos',
    contactPerson: 'Laura Fernández',
    paymentTerms: 15,
    currentBalance: -15000, // Les debemos
    creditLimit: 30000,
    category: 'Marketing',
    active: false,
    lastPurchaseDate: '2024-01-05',
    totalPurchases: 85000
  }
];

interface SuppliersState {
  suppliers: Supplier[];
  getSuppliers: () => Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getActiveSuppliers: () => Supplier[];
  getSupplierById: (id: string) => Supplier | undefined;
}

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  suppliers: mockSuppliers,
  
  getSuppliers: () => get().suppliers,
  
  addSupplier: (supplierData) => set((state) => ({
    suppliers: [
      ...state.suppliers,
      {
        ...supplierData,
        id: Date.now().toString(),
      }
    ]
  })),
  
  updateSupplier: (id, supplierData) => set((state) => ({
    suppliers: state.suppliers.map(supplier => 
      supplier.id === id 
        ? { ...supplier, ...supplierData }
        : supplier
    )
  })),
  
  deleteSupplier: (id) => set((state) => ({
    suppliers: state.suppliers.filter(supplier => supplier.id !== id)
  })),
  
  getActiveSuppliers: () => get().suppliers.filter(supplier => supplier.active),
  
  getSupplierById: (id) => get().suppliers.find(supplier => supplier.id === id),
}));