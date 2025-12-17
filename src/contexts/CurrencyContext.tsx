import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExchangeRates {
  IDR: number;
  USD: number;
  EUR: number;
  SGD: number;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates;
  setExchangeRates: (rates: ExchangeRates) => void;
  convertFromIDR: (amountIDR: number) => number;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const defaultRates: ExchangeRates = {
  IDR: 1,
  USD: 16668.25,
  EUR: 17730.05,
  SGD: 12439.93,
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('IDR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultRates);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') || 'IDR';
    const savedRates = localStorage.getItem('exchangeRates');
    
    setCurrencyState(savedCurrency);
    
    if (savedRates) {
      try {
        setExchangeRates(JSON.parse(savedRates));
      } catch (e) {
        console.warn('[CurrencyContext] Failed to parse saved rates');
      }
    }
  }, []);

  // Persist currency to localStorage
  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  // Convert amount from IDR to selected currency
  const convertFromIDR = (amountIDR: number): number => {
    if (currency === 'IDR') return amountIDR;
    
    const rate = exchangeRates[currency as keyof ExchangeRates];
    if (!rate || rate === 0) return amountIDR;
    
    // IDR amount / (rate of 1 unit to IDR) = amount in target currency
    return amountIDR / rate;
  };

  // Format amount according to selected currency
  const formatCurrency = (amount: number): string => {
    const converted = convertFromIDR(amount);
    
    switch (currency) {
      case 'USD':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted);
      
      case 'EUR':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted);
      
      case 'SGD':
        return new Intl.NumberFormat('en-SG', {
          style: 'currency',
          currency: 'SGD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(converted);
      
      case 'IDR':
      default:
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(converted);
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'SGD': return 'S$';
      case 'IDR':
      default: return 'Rp';
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRates,
        setExchangeRates,
        convertFromIDR,
        formatCurrency,
        getCurrencySymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
