import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ResendTicket() {
    const [searchName, setSearchName] = useState('');
    const [tickets, setTickets] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const [successId, setSuccessId] = useState(null);

    const handleSearch = async () => {
        if (!searchName.trim()) return;
        
        setIsSearching(true);
        try {
            const response = await base44.functions.invoke('searchTickets', {
                searchValue: searchName,
                searchType: 'name'
            });
            setTickets(response.data.results || []);
        } catch (error) {
            console.error('Search error:', error);
            alert('Failed to search tickets');
        } finally {
            setIsSearching(false);
        }
    };

    const handleResend = async (ticket) => {
        setSendingId(ticket.id);
        setSuccessId(null);
        
        try {
            await base44.functions.invoke('resendTicketEmail', {
                confirmation_code: ticket.confirmation_code
            });
            setSuccessId(ticket.id);
            setTimeout(() => setSuccessId(null), 3000);
        } catch (error) {
            console.error('Resend error:', error);
            alert('Failed to resend ticket: ' + (error.response?.data?.error || error.message));
        } finally {
            setSendingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link 
                    to={createPageUrl('Staff')}
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-green-400 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Staff Dashboard
                </Link>

                <Card className="bg-stone-900 border-stone-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Mail className="w-6 h-6 text-green-500" />
                            Resend Ticket QR Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-3">
                            <Input
                                type="text"
                                placeholder="Enter customer name..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="bg-stone-800 border-stone-700 text-white"
                            />
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || !searchName.trim()}
                                className="bg-green-500 hover:bg-green-600 text-stone-900"
                            >
                                {isSearching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {tickets.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold">Found {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</h3>
                                {tickets.map((ticket) => (
                                    <div 
                                        key={ticket.id}
                                        className="bg-stone-800/50 rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-white font-semibold">{ticket.customer_name}</h4>
                                                <p className="text-stone-400 text-sm">{ticket.customer_email}</p>
                                            </div>
                                            <Badge className={`${
                                                ticket.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                                ticket.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {ticket.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-stone-400">Type:</span>
                                                <span className="text-white ml-2">{ticket.ticket_type}</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400">Quantity:</span>
                                                <span className="text-white ml-2">{ticket.quantity_adult || 0} adults, {ticket.quantity_child || 0} children</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400">Confirmation:</span>
                                                <span className="text-white ml-2 font-mono text-xs">{ticket.confirmation_code}</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400">RFID:</span>
                                                <span className="text-white ml-2 font-mono text-xs">{ticket.rfid_tag_id || 'Not linked'}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleResend(ticket)}
                                            disabled={sendingId === ticket.id || successId === ticket.id}
                                            className={`w-full ${
                                                successId === ticket.id
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : 'bg-green-500 hover:bg-green-600'
                                            } text-stone-900`}
                                        >
                                            {sendingId === ticket.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : successId === ticket.id ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Email Sent!
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Resend Ticket Email
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isSearching && searchName && tickets.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-stone-400">No tickets found for "{searchName}"</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}