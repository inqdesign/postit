import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

const PostItCard = ({ children, rotation = 0, position, onDragStop, id, color, boardRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();
    
    let newX = e.clientX - dragStartRef.current.x;
    let newY = e.clientY - dragStartRef.current.y;

    // Constrain movement within the board boundaries
    newX = Math.max(0, Math.min(newX, boardRect.width - cardRect.width));
    newY = Math.max(0, Math.min(newY, boardRect.height - cardRect.height));

    positionRef.current = { x: newX, y: newY };
    cardRef.current.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
  }, [isDragging, rotation, boardRef]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragStop(id, positionRef.current);
    }
  }, [id, isDragging, onDragStop]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    positionRef.current = position;
    cardRef.current.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`;
  }, [position, rotation]);

  return (
    <div 
      ref={cardRef}
      className={`absolute cursor-grab hover:cursor-grab active:cursor-grabbing transform hover:scale-105 hover:z-10 ${isDragging ? 'z-50' : ''}`}
      style={{
        width: '250px',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="rounded-lg shadow-lg p-4"
        style={{
          backgroundColor: color,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px)',
          boxShadow: '3px 3px 5px rgba(0,0,0,0.1), inset 0 0 20px rgba(0,0,0,0.05)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const EnhancedMessageBoard = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userColors, setUserColors] = useState({});
  const boardRef = useRef(null);

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleUserNameChange = (e) => {
    setUserName(e.target.value);
  };

  const addMessage = useCallback(() => {
    if (newMessage.trim() !== '' && userName.trim() !== '' && boardRef.current) {
      const user = userName.trim();
      let color = userColors[user];
      if (!color) {
        color = generatePastelColor();
        setUserColors(prev => ({ ...prev, [user]: color }));
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const newMsg = {
        id: Date.now(),
        user: user,
        message: newMessage.trim(),
        date: new Date().toISOString().split('T')[0],
        rotation: Math.random() * 6 - 3,
        position: { 
          x: Math.random() * (boardRect.width - 250), 
          y: Math.random() * (boardRect.height - 250) 
        },
        color: color,
      };
      setMessages(prevMessages => [...prevMessages, newMsg]);
      
      if (!users.includes(user)) {
        setUsers(prevUsers => [...prevUsers, user]);
      }
      
      setNewMessage('');
      setUserName('');
    }
  }, [newMessage, userName, users, userColors]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMessage();
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(selectedUser === user ? null : user);
  };

  const handleDragStop = (id, newPosition) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, position: newPosition } : msg
      )
    );
  };

  const filteredMessages = selectedUser
    ? messages.filter(msg => msg.user === selectedUser)
    : messages;

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <aside className="w-64 bg-gray-100 p-4 border-r overflow-auto">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <ul>
          {users.map((user, index) => (
            <li 
              key={index} 
              className={`mb-2 p-2 rounded cursor-pointer ${selectedUser === user ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
              onClick={() => handleUserSelect(user)}
              style={{ backgroundColor: userColors[user], color: 'black' }}
            >
              {user}
            </li>
          ))}
        </ul>
        {selectedUser && (
          <Button 
            onClick={() => setSelectedUser(null)} 
            className="mt-4 w-full"
          >
            Clear Filter
          </Button>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative bg-white border-l border-r border-gray-200">
        <div ref={boardRef} className="absolute inset-0 overflow-auto bg-gray-50">
          {selectedUser && (
            <h2 className="text-xl font-bold m-4">Messages from {selectedUser}</h2>
          )}
          {filteredMessages.map((msg) => (
            <PostItCard 
              key={msg.id}
              id={msg.id}
              rotation={msg.rotation}
              position={msg.position}
              onDragStop={handleDragStop}
              color={msg.color}
              boardRef={boardRef}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold">{msg.user}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{msg.message}</p>
                <p className="text-xs text-gray-500">{msg.date}</p>
              </CardContent>
            </PostItCard>
          ))}
        </div>
      </main>

      {/* Right Sidebar - New Message Input */}
      <aside className="w-64 bg-gray-100 p-4 border-l">
        <h2 className="text-xl font-bold mb-4">New Message</h2>
        <Input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={handleUserNameChange}
          className="mb-2"
        />
        <Input
          type="text"
          placeholder="Your Message"
          value={newMessage}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          className="mb-2"
        />
        <Button onClick={addMessage}>Add Message</Button>
      </aside>
    </div>
  );
};

export default EnhancedMessageBoard;
