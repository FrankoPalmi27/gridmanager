
// Script para ejecutar en el navegador (Consola de DevTools)
// Este script limpia todos los datos de Grid Manager

console.log('🧹 Iniciando limpieza de datos...');

try {
    // Limpiar todas las claves específicas de Grid Manager
    localStorage.removeItem('gridmanager_customers');
    localStorage.removeItem('gridmanager_products');
    localStorage.removeItem('gridmanager_categories');
    localStorage.removeItem('gridmanager_stock_movements');
    localStorage.removeItem('gridmanager_sales');
    localStorage.removeItem('gridmanager_accounts');
    localStorage.removeItem('gridmanager_transactions');
    localStorage.removeItem('gridmanager_suppliers');
    localStorage.removeItem('gridmanager_purchases');
    localStorage.removeItem('gridmanager_purchase_stats');
    localStorage.removeItem('gridmanager_auth');
    localStorage.removeItem('gridmanager_dashboard_stats');
    localStorage.removeItem('gridmanager_system_config');

    // Verificar que se limpiaron correctamente
    const remainingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gridmanager_')) {
            remainingKeys.push(key);
        }
    }

    if (remainingKeys.length === 0) {
        console.log('✅ Todos los datos han sido limpiados correctamente');
        console.log('🔄 Recarga la página para ver la aplicación en estado limpio');
    } else {
        console.warn('⚠️ Algunas claves no se pudieron limpiar:', remainingKeys);
    }

} catch (error) {
    console.error('❌ Error durante la limpieza:', error);
}
