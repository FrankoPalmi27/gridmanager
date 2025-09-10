import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PurchaseStatusBadge } from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate as formatDateUtil } from '../lib/formatters';

interface Purchase {
  id: string;
  number: string;
  supplier: string;
  date: string;
  dueDate: string;
  status: 'pending' | 'received' | 'paid' | 'cancelled';
  subtotal: number;
  taxes: number;
  total: number;
  items: number;
}

const mockPurchases: Purchase[] = [
  {
    id: '1',
    number: 'COMP-001',
    supplier: 'Distribuidora Central S.A.',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    status: 'received',
    subtotal: 25000,
    taxes: 5250,
    total: 30250,
    items: 15
  },
  {
    id: '2',
    number: 'COMP-002',
    supplier: 'Mayorista del Norte',
    date: '2025-01-10',
    dueDate: '2025-01-25',
    status: 'pending',
    subtotal: 18500,
    taxes: 3885,
    total: 22385,
    items: 8
  },
  {
    id: '3',
    number: 'COMP-003',
    supplier: 'Proveedor Express',
    date: '2025-01-08',
    dueDate: '2025-01-08',
    status: 'paid',
    subtotal: 12000,
    taxes: 2520,
    total: 14520,
    items: 5
  },
  {
    id: '4',
    number: 'COMP-004',
    supplier: 'Distribuidora Central S.A.',
    date: '2025-01-05',
    dueDate: '2025-02-05',
    status: 'cancelled',
    subtotal: 8000,
    taxes: 1680,
    total: 9680,
    items: 3
  }
];

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  received: { label: 'Recibido', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

export function PurchasesPage() {
  const [purchases] = useState<Purchase[]>(mockPurchases);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const pendingPurchases = purchases.filter(p => p.status === 'pending');
  const receivedPurchases = purchases.filter(p => p.status === 'received');
  const overduePurchases = purchases.filter(p => 
    new Date(p.dueDate) < new Date() && (p.status === 'pending' || p.status === 'received')
  );

  const handleNewPurchase = () => {
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && (status === 'pending' || status === 'received');
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
            <p className="text-gray-600">Gestiona tus compras a proveedores</p>
          </div>
          <Button
            onClick={handleNewPurchase}
            variant="primary"
          >
            + Nueva Compra
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Compras</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPurchases)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-lg font-semibold text-yellow-600">{pendingPurchases.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Recibidos</p>
                <p className="text-lg font-semibold text-blue-600">{receivedPurchases.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Vencidos</p>
                <p className="text-lg font-semibold text-red-600">{overduePurchases.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar compras por número o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>}
              iconPosition="left"
              className="w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="received">Recibido</option>
            <option value="paid">Pagado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Compras</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{purchase.number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{purchase.supplier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Compra: {formatDateUtil(new Date(purchase.date))}</div>
                      <div className={`text-sm ${
                        isOverdue(purchase.dueDate, purchase.status) 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-500'
                      }`}>
                        Vence: {formatDateUtil(new Date(purchase.dueDate))}
                        {isOverdue(purchase.dueDate, purchase.status) && (
                          <span className="ml-1 text-red-600">⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{purchase.items} productos</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Sub: {formatCurrency(purchase.subtotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PurchaseStatusBadge status={purchase.status === 'paid' ? 'received' : purchase.status as 'received' | 'pending' | 'cancelled' | 'draft' | 'ordered'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 mr-2">
                        Ver
                      </Button>
                      {purchase.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-900 mr-2">
                          Recibir
                        </Button>
                      )}
                      {purchase.status === 'received' && (
                        <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-900 mr-2">
                          Pagar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        ⋯
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compras</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron compras con esos filtros.' : 'Comienza registrando tu primera compra.'}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Próximos Vencimientos</h4>
                <p className="text-sm text-gray-500">{overduePurchases.length} compras vencidas</p>
              </div>
              <Button variant="ghost" size="icon" className="text-yellow-600 hover:text-yellow-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Reporte Mensual</h4>
                <p className="text-sm text-gray-500">Compras de este mes</p>
              </div>
              <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Gestionar Proveedores</h4>
                <p className="text-sm text-gray-500">Ver y editar proveedores</p>
              </div>
              <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Compra"
        size="md"
        footer={
          <Button
            onClick={() => setIsModalOpen(false)}
            variant="secondary"
          >
            Cerrar
          </Button>
        }
      >
        <p className="text-gray-600">Funcionalidad en desarrollo...</p>
      </Modal>
    </div>
  );
}