import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Mail } from 'lucide-react';

export default function AdminBarCredits() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);

  const { data: pendingCredits, isLoading } = useQuery({
    queryKey: ['pending-bar-credits'],
    queryFn: () => base44.entities.BarCredit.filter({ status: 'pending' }, '-created_date'),
  });

  const confirmMutation = useMutation({
    mutationFn: async (credit) => {
      setProcessingId(credit.id);
      
      // Update status to confirmed
      await base44.entities.BarCredit.update(credit.id, {
        status: 'confirmed'
      });

      // Send confirmation email
      await base44.functions.invoke('sendBarCreditConfirmation', {
        bar_credit_id: credit.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-bar-credits'] });
      setProcessingId(null);
    },
    onError: (error) => {
      alert('Error: ' + error.message);
      setProcessingId(null);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-6 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pending Bar Credits</h1>
          <p className="text-gray-400">Manually confirm pending orders</p>
        </div>

        {pendingCredits?.length === 0 ? (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No pending bar credits</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingCredits?.map((credit) => (
              <Card key={credit.id} className="bg-stone-900 border-stone-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{credit.customer_name}</CardTitle>
                      <p className="text-sm text-gray-400">{credit.customer_email}</p>
                    </div>
                    <Badge className="bg-yellow-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Confirmation Code</p>
                      <p className="text-white font-mono">{credit.confirmation_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Credits</p>
                      <p className="text-white">{credit.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Price</p>
                      <p className="text-white">${credit.total_price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{new Date(credit.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => confirmMutation.mutate(credit)}
                    disabled={processingId === credit.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === credit.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm & Send Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}