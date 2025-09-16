import React, { useState } from 'react';
import { Button } from '../components/ui/Button';

interface RegistrationData {
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  industry: string;
  employeeCount: string;
  password: string;
  confirmPassword: string;
}

interface RegistrationResponse {
  success: boolean;
  data?: {
    tenant: {
      name: string;
      slug: string;
      plan: string;
      trialEnds: string;
    };
    user: {
      name: string;
      email: string;
      role: string;
    };
    tempPassword: string;
    loginUrl: string;
  };
  message?: string;
  error?: string;
}

export function TenantRegisterPage() {
  const [formData, setFormData] = useState<RegistrationData>({
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    industry: '',
    employeeCount: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const industries = [
    'Retail/Comercio',
    'Servicios',
    'Manufactura',
    'Tecnología',
    'Salud',
    'Educación',
    'Construcción',
    'Alimentos y Bebidas',
    'Automotriz',
    'Otro'
  ];

  const employeeCounts = [
    '1-5',
    '6-20',
    '21-50',
    '51-200',
    '200+'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nombre de empresa es requerido';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Tu nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email debe tener un formato válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setRegistrationResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/register-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.ownerName,
          password: formData.password,
          tenantName: formData.companyName
        }),
      });

      const result: RegistrationResponse = await response.json();

      if (result.success) {
        setRegistrationResult(result);
      } else {
        setErrors({ general: result.error || 'Error al registrar empresa' });
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (registrationResult?.success) {
    const { tenant, user, tempPassword, loginUrl } = registrationResult.data!;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a Grid Manager!
            </h1>
            <p className="text-gray-600">
              Tu empresa <strong>{tenant.name}</strong> ha sido creada exitosamente.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Datos de acceso:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">URL de acceso:</span>
                <div className="font-mono bg-white p-2 rounded border">
                  /empresa/{tenant.slug}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <div className="font-mono">{user.email}</div>
              </div>
              <div>
                <span className="text-gray-600">Contraseña temporal:</span>
                <div className="font-mono bg-yellow-50 p-2 rounded border border-yellow-200">
                  {tempPassword}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">🎉</span>
              <span className="font-semibold text-blue-900">Prueba gratuita de 14 días</span>
            </div>
            <p className="text-sm text-blue-700">
              Tienes acceso completo hasta el {new Date(tenant.trialEnds).toLocaleDateString('es-AR')}.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = `/empresa/${tenant.slug}/dashboard`}
              className="w-full"
            >
              Acceder a mi Dashboard
            </Button>

            <p className="text-xs text-gray-500">
              💡 Te recomendamos cambiar tu contraseña después del primer acceso
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
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
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-900">Inicio</a>
              <a href="/pricing" className="text-gray-600 hover:text-gray-900">Precios</a>
              <a href="/features" className="text-gray-600 hover:text-gray-900">Funcionalidades</a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900">Contacto</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Inicia tu prueba gratuita
              </h1>
              <p className="text-gray-600">
                Configura tu empresa en menos de 2 minutos
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de tu empresa *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.companyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Mi Empresa SRL"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre completo *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ownerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {errors.ownerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email empresarial *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="juan@miempresa.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirma tu contraseña"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Sector/Industria
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona tu sector</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de empleados
                </label>
                <select
                  id="employeeCount"
                  name="employeeCount"
                  value={formData.employeeCount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona el tamaño</option>
                  {employeeCounts.map(count => (
                    <option key={count} value={count}>{count} empleados</option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-lg"
              >
                {isLoading ? 'Creando tu empresa...' : 'Crear cuenta gratis'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Inicia sesión
                  </a>
                </p>
              </div>
            </form>
          </div>

          {/* Features highlight */}
          <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">✨ Incluye en tu prueba gratuita:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Hasta 3 usuarios</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>100 productos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>500 ventas/mes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Reportes básicos</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}