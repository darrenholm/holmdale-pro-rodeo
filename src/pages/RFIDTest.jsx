import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, Trash2 } from 'lucide-react';

export default function RFIDTest() {
  const [input, setInput] = useState('');
  const [events, setEvents] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInput = (e) => {
    const value = e.target.value;
    setInput(value);
    addEvent(`INPUT: "${value}" (length: ${value.length})`);
  };

  const handleKeyDown = (e) => {
    addEvent(`KEY DOWN: "${e.key}" (code: ${e.code}, keyCode: ${e.keyCode})`);
  };

  const handleKeyUp = (e) => {
    addEvent(`KEY UP: "${e.key}"`);
  };

  const handleKeyPress = (e) => {
    addEvent(`KEY PRESS: "${e.key}"`);
  };

  const handleChange = (e) => {
    addEvent(`CHANGE: "${e.target.value}"`);
  };

  const addEvent = (message) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        message,
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })
      },
      ...prev
    ].slice(0, 50));
  };

  const clear = () => {
    setInput('');
    setEvents([]);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">RFID Input Tester</h1>
          <p className="text-gray-400">Test what your RFID reader is sending</p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                RFID Input Field
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onKeyPress={handleKeyPress}
                onChangeCapture={handleChange}
                placeholder="Scan RFID here..."
                className="bg-stone-800 border-stone-700 text-white text-lg p-6 text-center focus:ring-2 focus:ring-purple-500"
                autoComplete="off"
              />
              <div className="bg-stone-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Current Input:</p>
                <p className="text-white font-mono text-lg break-all">
                  {input || '(empty)'}
                </p>
                <p className="text-gray-500 text-xs mt-2">Length: {input.length}</p>
              </div>
              <Button
                onClick={clear}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">Event Log ({events.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-stone-950 rounded-lg p-4 h-96 overflow-y-auto space-y-1 font-mono text-sm">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events yet. Start scanning or typing...</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="text-gray-300 border-b border-stone-800 pb-1">
                      <span className="text-gray-500">[{event.time}]</span> {event.message}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}