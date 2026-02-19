import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Download, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function TicketSalesReport() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['todayTicketSales'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTodayTicketSales', {});
      return response.data;
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['Today Ticket Sales Report'],
      ['Date', data.date],
      [''],
      ['SUMMARY'],
      ['Total Orders', data.totalOrders],
      ['Total Tickets Sold', data.totalTickets],
      ['Total Revenue', `$${data.totalRevenue}`],
      [''],
      ['BY TICKET TYPE'],
      ['Type', 'Orders', 'Tickets', 'Revenue']
    ];

    Object.entries(data.byType).forEach(([type, stats]) => {
      csv.push([type, stats.count, stats.quantity, `$${stats.revenue.toFixed(2)}`]);
    });

    const csvString = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-sales-${data.date}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-950 border-red-800">
            <CardContent className="pt-6">
              <p className="text-red-400">Error loading sales report: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Today's Ticket Sales</h1>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-stone-700 text-white hover:bg-stone-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-stone-900 border-stone-800">
                <CardContent className="pt-6">
                  <p className="text-stone-400 text-sm mb-2">Total Orders</p>
                  <p className="text-4xl font-bold text-green-400">{data?.totalOrders || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-stone-900 border-stone-800">
                <CardContent className="pt-6">
                  <p className="text-stone-400 text-sm mb-2">Total Tickets</p>
                  <p className="text-4xl font-bold text-green-400">{data?.totalTickets || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-stone-900 border-stone-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-stone-400 text-sm mb-2">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-400">${data?.totalRevenue || '0.00'}</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-500/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Type */}
            {data?.byType && Object.keys(data.byType).length > 0 && (
              <Card className="bg-stone-900 border-stone-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-white">Sales by Ticket Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(data.byType).map(([type, stats]) => (
                      <div key={type} className="flex items-center justify-between p-4 bg-stone-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-semibold capitalize">{type}</p>
                          <p className="text-stone-400 text-sm">{stats.count} order(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{stats.quantity} tickets</p>
                          <p className="text-green-400 font-bold">${stats.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders List */}
            {data?.orders && data.orders.length > 0 && (
              <Card className="bg-stone-900 border-stone-800 mb-8">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Orders</CardTitle>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    className="border-stone-700 text-white hover:bg-stone-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-stone-700">
                        <tr>
                          <th className="text-left py-3 px-4 text-stone-400">Time</th>
                          <th className="text-left py-3 px-4 text-stone-400">Customer</th>
                          <th className="text-left py-3 px-4 text-stone-400">Type</th>
                          <th className="text-center py-3 px-4 text-stone-400">Adults</th>
                          <th className="text-center py-3 px-4 text-stone-400">Children</th>
                          <th className="text-right py-3 px-4 text-stone-400">Revenue</th>
                          <th className="text-left py-3 px-4 text-stone-400">Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.map((order) => {
                          const adultQty = order.quantity_adult || 0;
                          const childQty = order.quantity_child || 0;
                          return (
                            <tr key={order.id} className="border-b border-stone-800 hover:bg-stone-800/50">
                              <td className="py-3 px-4 text-stone-300">
                                {format(new Date(order.created_date || order.created_at), 'HH:mm')}
                              </td>
                              <td className="py-3 px-4 text-stone-300">
                                <p className="font-medium">{order.customer_name}</p>
                                <p className="text-xs text-stone-500">{order.customer_email}</p>
                              </td>
                              <td className="py-3 px-4 text-stone-300 capitalize">{order.ticket_type}</td>
                              <td className="py-3 px-4 text-center text-stone-300">{adultQty}</td>
                              <td className="py-3 px-4 text-center text-stone-300">{Math.max(0, childQty)}</td>
                              <td className="py-3 px-4 text-right text-green-400 font-semibold">
                                ${parseFloat(order.total_price).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-stone-400 font-mono text-xs">{order.confirmation_code}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {!data?.orders || data.orders.length === 0 && (
              <Card className="bg-stone-900 border-stone-800">
                <CardContent className="pt-6 text-center">
                  <p className="text-stone-400">No ticket sales today</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}