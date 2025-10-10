/**
 * Business calculations utilities
 * Standardized formulas for pricing and margins
 */

/**
 * Calculate profit margin percentage
 * Formula: ((price - cost) / price) * 100
 * This represents the percentage of the sale price that is profit
 *
 * @param price - Selling price
 * @param cost - Cost of goods
 * @returns Margin percentage (0-100)
 *
 * @example
 * calculateMargin(100, 70) // Returns 30 (30% margin)
 */
export const calculateMargin = (price: number, cost: number): number => {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
};

/**
 * Calculate markup percentage
 * Formula: ((price - cost) / cost) * 100
 * This represents how much you're marking up the cost
 *
 * @param price - Selling price
 * @param cost - Cost of goods
 * @returns Markup percentage
 *
 * @example
 * calculateMarkup(100, 70) // Returns 42.86 (42.86% markup on cost)
 */
export const calculateMarkup = (price: number, cost: number): number => {
  if (cost <= 0) return 0;
  return ((price - cost) / cost) * 100;
};

/**
 * Calculate profit amount
 *
 * @param price - Selling price
 * @param cost - Cost of goods
 * @returns Profit amount
 */
export const calculateProfit = (price: number, cost: number): number => {
  return price - cost;
};

/**
 * Calculate suggested price based on cost and target margin
 * Formula: cost / (1 - (targetMargin / 100))
 *
 * @param cost - Cost of goods
 * @param targetMargin - Desired margin percentage (0-100)
 * @returns Suggested selling price
 *
 * @example
 * calculatePriceFromMargin(70, 30) // Returns 100 (to achieve 30% margin)
 */
export const calculatePriceFromMargin = (cost: number, targetMargin: number): number => {
  if (cost <= 0 || targetMargin >= 100) return 0;
  return cost / (1 - (targetMargin / 100));
};

/**
 * Calculate suggested price based on cost and target markup
 * Formula: cost * (1 + (targetMarkup / 100))
 *
 * @param cost - Cost of goods
 * @param targetMarkup - Desired markup percentage
 * @returns Suggested selling price
 *
 * @example
 * calculatePriceFromMarkup(70, 30) // Returns 91 (70 + 30% of 70)
 */
export const calculatePriceFromMarkup = (cost: number, targetMarkup: number): number => {
  if (cost <= 0) return 0;
  return cost * (1 + (targetMarkup / 100));
};

/**
 * Determine if a margin is considered healthy
 *
 * @param margin - Margin percentage
 * @returns Object with health indicators
 */
export const evaluateMargin = (margin: number): {
  level: 'excellent' | 'good' | 'fair' | 'low' | 'critical';
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'red';
  message: string;
} => {
  if (margin >= 40) {
    return {
      level: 'excellent',
      color: 'green',
      message: 'Margen excelente'
    };
  } else if (margin >= 30) {
    return {
      level: 'good',
      color: 'blue',
      message: 'Margen bueno'
    };
  } else if (margin >= 20) {
    return {
      level: 'fair',
      color: 'yellow',
      message: 'Margen aceptable'
    };
  } else if (margin >= 10) {
    return {
      level: 'low',
      color: 'orange',
      message: 'Margen bajo - revisar'
    };
  } else {
    return {
      level: 'critical',
      color: 'red',
      message: 'Margen crítico'
    };
  }
};

/**
 * Calculate inventory value
 *
 * @param stock - Quantity in stock
 * @param cost - Unit cost
 * @returns Total inventory value at cost
 */
export const calculateInventoryValue = (stock: number, cost: number): number => {
  return stock * cost;
};

/**
 * Calculate potential revenue from inventory
 *
 * @param stock - Quantity in stock
 * @param price - Unit selling price
 * @returns Potential revenue if all stock is sold
 */
export const calculatePotentialRevenue = (stock: number, price: number): number => {
  return stock * price;
};
