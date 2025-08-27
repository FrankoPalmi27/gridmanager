import { useQuery } from '@tanstack/react-query';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  UserGroupIcon, 
  BuildingStorefrontIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => dashboardApi.getRecentActivity(),
  });

  const dashboardData = summary?.data.data;
  const activityData = activity?.data.data;

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Disponible',
      value: formatCurrency(dashboardData?.totalAvailable || 0),
      icon: CurrencyDollarIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: 'Cuentas',
      value: dashboardData?.accountsCount || 0,
      icon: CreditCardIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Deudas Clientes',
      value: formatCurrency(dashboardData?.customerDebt || 0),
      icon: UserGroupIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      name: 'Deudas Proveedores',
      value: formatCurrency(dashboardData?.supplierDebt || 0),
      icon: BuildingStorefrontIcon,
      color: 'text-error-600',
      bgColor: 'bg-error-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general de tu negocio</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="stat-value text-lg">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Ventas Últimos 30 Días
            </h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.salesLast30Days || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
                    labelFormatter={(label) => `Fecha: ${new Date(label).toLocaleDateString()}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Exchange rates and tasks */}
        <div className="space-y-6">
          {/* Exchange rates */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Cotización del Dólar
              </h3>
            </div>
            <div className="card-body space-y-4">
              {dashboardData?.exchangeRates?.map((rate) => (
                <div key={rate.currency} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">USD</p>
                    <p className="text-sm text-gray-500">
                      {new Date(rate.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${rate.officialRate} (Oficial)
                    </p>
                    {rate.blueRate && (
                      <p className="text-sm text-blue-600">
                        ${rate.blueRate} (Blue)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending tasks */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Tareas Pendientes
                </h3>
                <span className="badge badge-warning">
                  {dashboardData?.pendingTasks || 0}
                </span>
              </div>
            </div>
            <div className="card-body">
              {dashboardData?.taskList && dashboardData.taskList.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.taskList.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-warning-500 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.description}</p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tareas pendientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {!activityLoading && activityData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent sales */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Ventas Recientes
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {activityData.recentSales?.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{sale.number}</p>
                      <p className="text-sm text-gray-500">{sale.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success-600">
                        {formatCurrency(sale.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent purchases */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Compras Recientes
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {activityData.recentPurchases?.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{purchase.number}</p>
                      <p className="text-sm text-gray-500">{purchase.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-error-600">
                        {formatCurrency(purchase.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}