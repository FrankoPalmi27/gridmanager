import React from 'react';
import { Button } from '../components/ui/Button';

export function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3"></div>
              <span className="text-xl font-bold text-gray-900">Grid Manager</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  window.history.pushState({}, '', '/login');
                  onNavigate('login');
                }}
              >
                Iniciar Sesión
              </Button>
              <Button
                onClick={() => {
                  window.history.pushState({}, '', '/register');
                  onNavigate('tenant-register');
                }}
              >
                Crear Cuenta
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Grid Manager
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma completa de gestión empresarial que tu negocio necesita.
            Administra ventas, inventario, clientes y finanzas desde una sola aplicación.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => {
                window.history.pushState({}, '', '/register');
                onNavigate('tenant-register');
              }}
              className="text-lg px-8 py-4"
            >
              🚀 Probar Gratis 14 Días
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('demo')}
              className="text-lg px-8 py-4"
            >
              Ver Demo
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestión de Ventas</h3>
              <p className="text-gray-600">
                Procesa ventas, gestiona clientes y controla el flujo de efectivo en tiempo real.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Control de Inventario</h3>
              <p className="text-gray-600">
                Administra productos, stock, categorías y recibe alertas de stock crítico.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes Avanzados</h3>
              <p className="text-gray-600">
                Analiza el rendimiento de tu negocio con dashboards y reportes en tiempo real.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Empresas registradas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Ventas procesadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600">Tiempo de actividad</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">24/7</div>
              <div className="text-gray-600">Soporte disponible</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3"></div>
                <span className="text-xl font-bold text-gray-900">Grid Manager</span>
              </div>
              <p className="text-gray-600 text-sm">
                La solución completa para la gestión empresarial moderna.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-gray-900">Precios</a></li>
                <li><a href="#" className="hover:text-gray-900">Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Documentación</a></li>
                <li><a href="#" className="hover:text-gray-900">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-gray-900">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Acerca de</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Términos</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 Grid Manager. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}