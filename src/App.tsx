import React, { useState, useCallback, useRef, useEffect } from 'react';

const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

const PostItCard = ({ children, rotation = 0, position, onDragStop, id, color, boardRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const cardRect = cardRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - cardRect.left,
      y: e.clientY - cardRect.top
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();

    let newX = e.clientX - boardRect.left - dragStartRef.current.x;
    let newY = e.clientY - boardRect.top - dragStartRef.current.y;

    // Constrain movement within the board boundaries
    newX = Math.max(0, Math.min(newX, boardRect.width - cardRect.width));
    newY = Math.max(0, Math.min(newY, boardRect.height - cardRect.height));

    cardRef.current.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
  }, [isDragging, rotation, boardRef]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      const style = window.getComputedStyle(cardRef.current);
      const matrix = new DOMMatrix(style.transform);
      onDragStop(id, { x: matrix.m41, y: matrix.m42 });
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
    cardRef.current.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`;
  }, [position, rotation]);

  return (
    <div 
      ref={cardRef}
      style={{
        position: 'absolute',
        width: '250px',
        backgroundColor: color,
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '3px 3px 5px rgba(0,0,0,0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        zIndex: isDragging ? 1000 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
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
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left Sidebar */}
      <aside style={{ width: '250px', backgroundColor: '#f0f0f0', padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Users</h2>
        <ul>
          {users.map((user, index) => (
            <li 
              key={index} 
              style={{
                marginBottom: '0.5rem',
                padding: '0.5rem',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: selectedUser === user ? '#b3e0ff' : userColors[user],
                color: 'black'
              }}
              onClick={() => handleUserSelect(user)}
            >
              {user}
            </li>
          ))}
        </ul>
        {selectedUser && (
          <button 
            onClick={() => setSelectedUser(null)} 
            style={{ marginTop: '1rem', width: '100%', padding: '0.5rem' }}
          >
            Clear Filter
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, position: 'relative', backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
        <div ref={boardRef} style={{ position: 'absolute', inset: 0, overflow: 'auto', backgroundColor: '#f9f9f9' }}>
          {selectedUser && (
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem' }}>Messages from {selectedUser}</h2>
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{msg.user}</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{msg.message}</p>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>{msg.date}</p>
            </PostItCard>
          ))}
        </div>
      </main>

      {/* Right Sidebar - New Message Input */}
      <aside style={{ width: '250px', backgroundColor: '#f0f0f0', padding: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>New Message</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={handleUserNameChange}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Your Message"
          value={newMessage}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        />
        <button onClick={addMessage} style={{ width: '100%', padding: '0.5rem' }}>Add Message</button>
      </aside>
    </div>
  );
};

export default EnhancedMessageBoard;
