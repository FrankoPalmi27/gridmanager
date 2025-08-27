import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from '@heroicons/react/24/outline';
import { customersApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '@/lib/utils';

export function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersApi.getAll({ page, limit: 20, search }),
    keepPreviousData: true,
  });

  const customers = data?.data.data.data || [];
  const totalPages = data?.data.data.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tus clientes y sus cuentas corrientes</p>
        </div>
        <button className="btn btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select className="input">
                <option>Todos los estados</option>
                <option>Activos</option>
                <option>Inactivos</option>
              </select>
              <button className="btn btn-secondary">
                Filtrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Contacto</th>
                <th className="table-header-cell">Saldo Actual</th>
                <th className="table-header-cell">Límite de Crédito</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Fecha de Registro</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8">
                    <div className="loading-spinner mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.name}
                        </div>
                        {customer.taxId && (
                          <div className="text-sm text-gray-500">
                            {customer.taxId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {customer.email && (
                          <div className="text-gray-900">{customer.email}</div>
                        )}
                        {customer.phone && (
                          <div className="text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`font-medium ${
                        customer.currentBalance > 0 
                          ? 'text-warning-600' 
                          : 'text-gray-900'
                      }`}>
                        {formatCurrency(customer.currentBalance)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {customer.creditLimit 
                        ? formatCurrency(customer.creditLimit)
                        : 'Sin límite'
                      }
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        getStatusBadge(customer.active ? 'ACTIVE' : 'INACTIVE').class
                      }`}>
                        {getStatusBadge(customer.active ? 'ACTIVE' : 'INACTIVE').label}
                      </span>
                    </td>
                    <td className="table-cell">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button className="btn btn-sm btn-secondary">
                          Ver
                        </button>
                        <button className="btn btn-sm btn-secondary">
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{page}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}