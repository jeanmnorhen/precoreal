'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import type { PriceHistoryEntry } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon, Search, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/loading-spinner';
import { getDictionary, type Dictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n-config';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface MonitoringPageProps {
  params: { lang: Locale };
}

const fetchPriceHistory = async (): Promise<PriceHistoryEntry[]> => {
  const historyRef = ref(db, 'priceHistory');
  const snapshot = await get(historyRef);
  if (snapshot.exists()) {
    const historyData = snapshot.val();
    return Object.entries(historyData).map(([id, entry]) => ({
      id,
      ...(entry as Omit<PriceHistoryEntry, 'id'>),
    }));
  }
  return [];
};

export default function MonitoringPage({ params: { lang } }: MonitoringPageProps) {
  const [dictionary, setDictionary] = useState<Dictionary['monitoringPage'] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  useEffect(() => {
    const fetchDict = async () => {
      const d = await getDictionary(lang);
      setDictionary(d.monitoringPage);
    };
    fetchDict();
  }, [lang]);

  const { data: priceHistory, isLoading, error } = useQuery<PriceHistoryEntry[]>({
    queryKey: ['priceHistory'],
    queryFn: fetchPriceHistory,
  });

  const uniqueProductNames = useMemo(() => {
    if (!priceHistory) return [];
    const names = new Set(priceHistory.map(entry => entry.productName));
    return Array.from(names).sort();
  }, [priceHistory]);

  const filteredHistory = useMemo(() => {
    if (!selectedProduct || !priceHistory) return [];
    return priceHistory
      .filter(entry => entry.productName === selectedProduct)
      .sort((a, b) => new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime());
  }, [selectedProduct, priceHistory]);

  const chartData = useMemo(() => {
    return filteredHistory.map(entry => ({
      date: format(new Date(entry.archivedAt), 'dd/MM/yy'),
      price: entry.price,
    }));
  }, [filteredHistory]);


  if (isLoading || !dictionary) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-xl text-muted-foreground">{dictionary?.loadingText || 'Loading...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-destructive/50" />
        <h3 className="text-xl font-semibold text-destructive">{dictionary.errorLoadingTitle || 'Error Loading Data'}</h3>
        <p className="text-muted-foreground">
          {dictionary.errorLoadingMessage || 'Could not fetch price history. Please try again later.'}
          <br />
          <span className="text-xs">{(error as Error)?.message}</span>
        </p>
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="animate-fadeIn py-8 text-center">
        <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h3 className="text-xl font-semibold">{dictionary.noHistoryFound}</h3>
        <p className="text-muted-foreground">{dictionary.noHistoryFoundMessage || 'There is no price history data to display yet.'}</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn py-8 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <LineChartIcon className="mr-2 h-7 w-7 text-primary" />
            {dictionary.title}
          </CardTitle>
          <CardDescription>{dictionary.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select onValueChange={setSelectedProduct} value={selectedProduct || ''}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder={dictionary.selectProductPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {uniqueProductNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && filteredHistory.length > 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{dictionary.tableTitle?.replace('{productName}', selectedProduct)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dictionary.priceColumn}</TableHead>
                        <TableHead>{dictionary.storeColumn}</TableHead>
                        <TableHead>{dictionary.dateColumn}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">R$ {entry.price.toFixed(2)}</TableCell>
                          <TableCell>{entry.storeName}</TableCell>
                          <TableCell>{format(new Date(entry.archivedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{dictionary.priceTrendChartTitle?.replace('{productName}', selectedProduct)}</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        tickFormatter={(value) => `R$${value}`}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        allowDecimals={false}
                      />
                      <Tooltip formatter={(value: number) => [`R$${value.toFixed(2)}`, dictionary.priceColumn]}/>
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} name={dictionary.priceColumn} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
           {selectedProduct && filteredHistory.length === 0 && (
             <p className="text-center text-muted-foreground py-4">{dictionary.noDataForProduct || 'No history data for the selected product.'}</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
