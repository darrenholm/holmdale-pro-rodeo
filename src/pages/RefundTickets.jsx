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
  const [searchType, setSearchType] = useState('code'); // 'code' or 'txn'
  const [searchValue, setSearchValue] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const queryClient = useQueryClient();

  // Search for refundable tickets
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['ticketSearch', searchValue, searchType],
    queryFn: async () => {
      if (!searchValue) return [];
      const response = await base44.functions.invoke('searchRefundableTickets', {
        searchType: searchType,
        searchValue: searchValue
      });
      return response.data?.results || [];
    },
    enabled: searchValue.length > 0
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

    if (selectedOrder.status !== 'confirmed' && selectedOrder.status !== 'paid') {
      alert(`Cannot refund tickets with status "${selectedOrder.status}". Only confirmed/paid tickets can be refunded.`);
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0 || amount > Number(selectedOrder.total_price)) {
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
              Find Refundable Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={searchType === 'code' ? 'default' : 'outline'}
                onClick={() => setSearchType('code')}
                className={searchType === 'code' ? 'bg-green-600 hover:bg-green-700' : 'border-stone-700 text-white hover:bg-stone-800'}
              >
                Confirmation Code
              </Button>
              <Button
                variant={searchType === 'txn' ? 'default' : 'outline'}
                onClick={() => setSearchType('txn')}
                className={searchType === 'txn' ? 'bg-green-600 hover:bg-green-700' : 'border-stone-700 text-white hover:bg-stone-800'}
              >
                Transaction ID
              </Button>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder={searchType === 'code' ? 'Enter confirmation code (e.g., CONF-12345)' : 'Enter Moneris transaction ID'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
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
        {searchValue && (
          <div className="space-y-4 mb-8">
            {isSearching ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
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
                            ${Number(order.total_price).toFixed(2)}
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
                  <span className="text-white font-medium">${Number(selectedOrder.total_price).toFixed(2)}</span>
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
                  Maximum refundable: ${Number(selectedOrder.total_price).toFixed(2)}
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