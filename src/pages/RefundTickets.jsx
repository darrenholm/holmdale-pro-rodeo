import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Check, AlertCircle, Loader2, DollarSign, X } from 'lucide-react';

export default function RefundTickets() {
  const [searchCode, setSearchCode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const queryClient = useQueryClient();

  // Search for ticket by confirmation code
  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['ticketSearch', searchCode],
    queryFn: async () => {
      if (!searchCode) return [];
      const code = searchCode.trim();
      console.log('Searching for code:', code);
      
      // Try exact match first (case-insensitive)
      let results = await base44.asServiceRole.entities.TicketOrder.filter({
        confirmation_code: code
      });
      
      console.log('Exact match results:', results);
      
      // If no results, try all tickets and filter client-side
      if (!results || results.length === 0) {
        const allTickets = await base44.asServiceRole.entities.TicketOrder.list();
        console.log('Total tickets in database:', allTickets.length);
        console.log('All confirmation codes:', allTickets.map(t => t.confirmation_code));
        
        results = allTickets.filter(t => 
          t.confirmation_code && t.confirmation_code.toUpperCase().includes(code.toUpperCase())
        );
        console.log('Filtered results:', results);
      }
      
      return results || [];
    },
    enabled: searchCode.length > 0
  });

  const processRefund = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('refundTicket', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketSearch'] });
      setSelectedOrder(null);
      setRefundAmount('');
      setRefundReason('');
      alert('Refund processed successfully!');
    },
    onError: (error) => {
      alert(`Refund failed: ${error.message}`);
    }
  });

  const handleRefund = async () => {
    if (!selectedOrder || !refundAmount) {
      alert('Please select a ticket and enter refund amount');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0 || amount > selectedOrder.total_price) {
      alert('Invalid refund amount');
      return;
    }

    processRefund.mutate({
      ticket_order_id: selectedOrder.id,
      refund_amount: amount,
      reason: refundReason
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Refund Tickets</h1>
        <p className="text-stone-400 mb-8">Search and refund customer tickets</p>

        {/* Search Section */}
        <Card className="bg-stone-900 border-stone-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-green-500" />
              Find Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter confirmation code (e.g., CONF-12345)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                className="bg-stone-800 border-stone-700 text-white"
              />
              <Button 
                variant="outline"
                className="border-stone-700 text-white hover:bg-stone-800"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchCode && (
          <div className="space-y-4 mb-8">
            {isSearching ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : searchResults?.length > 0 ? (
              searchResults.map((order) => (
                <Card 
                  key={order.id}
                  className={`bg-stone-900 border-stone-800 cursor-pointer transition-all ${
                    selectedOrder?.id === order.id ? 'border-green-500 bg-green-500/10' : ''
                  }`}
                  onClick={() => {
                    setSelectedOrder(order);
                    setRefundAmount(order.total_price.toString());
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">{order.customer_name}</h3>
                          <Badge className={`${
                            order.status === 'refunded' ? 'bg-blue-500' :
                            order.status === 'cancelled' ? 'bg-red-500' :
                            'bg-green-500'
                          }`}>
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-stone-400 text-sm mb-2">Confirmation: {order.confirmation_code}</p>
                        <p className="text-stone-400 text-sm mb-2">Email: {order.customer_email}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-stone-300">
                            {order.ticket_type.toUpperCase()} × {order.quantityAdult || 0}
                          </span>
                          <span className="text-green-400 font-semibold">
                            ${order.total_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {selectedOrder?.id === order.id && (
                        <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-stone-900 border-stone-800">
                <CardContent className="pt-6 text-center">
                  <AlertCircle className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400">No tickets found with that confirmation code</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Refund Form */}
        {selectedOrder && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Process Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="bg-stone-800/50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-stone-300">Customer:</span>
                  <span className="text-white font-medium">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-stone-300">Original Amount:</span>
                  <span className="text-white font-medium">${selectedOrder.total_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Status:</span>
                  <Badge className={`${
                    selectedOrder.status === 'refunded' ? 'bg-blue-500' :
                    selectedOrder.status === 'cancelled' ? 'bg-red-500' :
                    'bg-green-500'
                  }`}>
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Refund Amount */}
              <div>
                <Label htmlFor="amount" className="text-stone-300 mb-2 block">
                  Refund Amount ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedOrder.total_price}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="bg-stone-800 border-stone-700 text-white"
                  placeholder="0.00"
                />
                <p className="text-stone-500 text-sm mt-2">
                  Maximum refundable: ${selectedOrder.total_price.toFixed(2)}
                </p>
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason" className="text-stone-300 mb-2 block">
                  Refund Reason (Optional)
                </Label>
                <Input
                  id="reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="bg-stone-800 border-stone-700 text-white"
                  placeholder="e.g., Customer request, Event cancellation"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRefund}
                  disabled={processRefund.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {processRefund.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Process Refund
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setRefundAmount('');
                    setRefundReason('');
                  }}
                  className="border-stone-700 text-white hover:bg-stone-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}