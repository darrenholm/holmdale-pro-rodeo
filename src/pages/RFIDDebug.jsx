import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RFIDDebug() {
  const [events, setEvents] = useState([]);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const addEvent = (type, data) => {
    setEvents(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      data: JSON.stringify(data, null, 2)
    }].slice(-20)); // Keep last 20 events
  };

  useEffect(() => {
    inputRef.current?.focus();

    // Keyboard events
    const handleKeyDown = (e) => {
      addEvent('keyDown', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
    };

    const handleKeyUp = (e) => {
      addEvent('keyUp', { key: e.key, code: e.code });
    };

    const handleKeyPress = (e) => {
      addEvent('keyPress', { key: e.key, charCode: e.charCode });
    };

    // Input/Change events
    const handleChange = (e) => {
      addEvent('onChange', { value: e.target.value });
      setValue(e.target.value);
    };

    const handleInput = (e) => {
      addEvent('onInput', { value: e.target.value });
    };

    // Mouse/Click events
    const handleMouseDown = (e) => {
      addEvent('onMouseDown', { button: e.button, x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
      addEvent('onMouseUp', { button: e.button });
    };

    const handleClick = (e) => {
      addEvent('onClick', { button: e.button });
    };

    // Paste events
    const handlePaste = (e) => {
      addEvent('onPaste', { text: e.clipboardData?.getData('text') });
    };

    // Document level
    const handleDocKeyDown = (e) => {
      addEvent('doc-keyDown', { key: e.key, code: e.code });
    };

    const handleDocMouseDown = (e) => {
      addEvent('doc-mouseDown', { target: e.target?.tagName, button: e.button });
    };

    inputRef.current?.addEventListener('keydown', handleKeyDown);
    inputRef.current?.addEventListener('keyup', handleKeyUp);
    inputRef.current?.addEventListener('keypress', handleKeyPress);
    inputRef.current?.addEventListener('change', handleChange);
    inputRef.current?.addEventListener('input', handleInput);
    inputRef.current?.addEventListener('mousedown', handleMouseDown);
    inputRef.current?.addEventListener('mouseup', handleMouseUp);
    inputRef.current?.addEventListener('click', handleClick);
    inputRef.current?.addEventListener('paste', handlePaste);

    document.addEventListener('keydown', handleDocKeyDown);
    document.addEventListener('mousedown', handleDocMouseDown);

    return () => {
      inputRef.current?.removeEventListener('keydown', handleKeyDown);
      inputRef.current?.removeEventListener('keyup', handleKeyUp);
      inputRef.current?.removeEventListener('keypress', handleKeyPress);
      inputRef.current?.removeEventListener('change', handleChange);
      inputRef.current?.removeEventListener('input', handleInput);
      inputRef.current?.removeEventListener('mousedown', handleMouseDown);
      inputRef.current?.removeEventListener('mouseup', handleMouseUp);
      inputRef.current?.removeEventListener('click', handleClick);
      inputRef.current?.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleDocKeyDown);
      document.removeEventListener('mousedown', handleDocMouseDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-white mb-6">RFID Scanner Debug</h1>

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white">Scanner Input Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">Point scanner at this field and scan a tag.</p>
            <Input
              ref={inputRef}
              type="text"
              value={value}
              className="bg-stone-800 border-stone-700 text-white text-lg p-6 text-center focus:ring-2 focus:ring-green-500"
              autoFocus
              placeholder="Scan here..."
            />
            <div className="bg-stone-800 p-4 rounded border border-stone-700">
              <p className="text-white font-mono text-sm break-all">{value}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white">Event Log (Last 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500">No events captured yet. Scan a tag or interact with the input field.</p>
              ) : (
                events.map((event, idx) => (
                  <div key={idx} className="bg-stone-800 p-3 rounded text-xs border-l-2 border-green-500">
                    <div className="text-green-400 font-mono">{event.timestamp} - {event.type}</div>
                    <pre className="text-gray-300 mt-1 text-xs overflow-x-auto">{event.data}</pre>
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={() => setEvents([])}
              variant="outline"
              className="w-full mt-4 border-stone-700 text-white hover:bg-stone-800"
            >
              Clear Log
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-yellow-950 border-yellow-800">
          <CardContent className="p-4">
            <p className="text-yellow-200 text-sm">
              <strong>Tip:</strong> If you see keyboard events, the scanner is sending key codes. If you see mouse events, it might be emulating clicks. If nothing shows up, the scanner may need driver support or may be blocked by the system.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}