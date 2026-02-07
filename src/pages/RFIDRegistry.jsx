import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Radio, Ticket, User, Calendar } from 'lucide-react';

export default function RFIDRegistry() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets-with-rfid'],
    queryFn: async () => {
      const allTickets = await base44.entities.TicketOrder.list();
      return allTickets.filter(ticket => ticket.rfid_tag_id);
    },
    initialData: [],
  });

  // Group tickets by confirmation code
  const groupedByCode = tickets.reduce((acc, ticket) => {
    const code = ticket.confirmation_code;
    if (!acc[code]) {
      acc[code] = [];
    }
    acc[code].push(ticket);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">RFID Registry</h1>
          <p className="text-gray-400">View all linked RFID bracelets and tickets</p>
        </div>

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              Linked RFID Bracelets ({tickets.length}) • {Object.keys(groupedByCode).length} Unique Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No RFID bracelets linked yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-stone-800 hover:bg-stone-800/50">
                      <TableHead className="text-gray-400">Confirmation Code</TableHead>
                      <TableHead className="text-gray-400">RFID Bracelets</TableHead>
                      <TableHead className="text-gray-400">Customer</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Quantity</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedByCode).map(([code, ticketGroup]) => {
                      const firstTicket = ticketGroup[0];
                      return (
                        <TableRow key={code} className="border-stone-800 hover:bg-stone-800/50">
                          <TableCell className="font-mono text-white font-semibold">
                            {code}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {ticketGroup.map((ticket, idx) => (
                                <div key={ticket.id} className="font-mono text-green-400 text-sm">
                                  {ticket.rfid_tag_id}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-gray-300">{firstTicket.customer_name}</div>
                            <div className="text-gray-500 text-xs">{firstTicket.customer_email}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-300 capitalize text-sm">
                              {firstTicket.ticket_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {ticketGroup.length} / {firstTicket.quantityAdult}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {ticketGroup.map((ticket) => (
                                <span 
                                  key={ticket.id}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    ticket.scanned 
                                      ? 'bg-green-900/30 text-green-400' 
                                      : 'bg-blue-900/30 text-blue-400'
                                  }`}
                                >
                                  {ticket.scanned ? 'Scanned' : 'Ready'}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}