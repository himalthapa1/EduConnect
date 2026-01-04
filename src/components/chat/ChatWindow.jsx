import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import './ChatWindow.css';

const ChatWindow = ({ type, groupId, sessionId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const initSocket = () => {
      const socket = io('http://localhost:3001', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      // Chat events
      socket.on('room-joined', (data) => {
        console.log('Joined chat room:', data.roomId);
        setMessages(data.messages || []);
        setIsLoading(false);
      });

      socket.on('new-message', (message) => {
        console.log('New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      socket.on('error', (error) => {
        console.error('Chat error:', error.message);
        setIsLoading(false);
      });

      // Join the appropriate room
      const roomData = type === 'group'
        ? { type: 'group', groupId }
        : { type: 'session', sessionId };

      socket.emit('join-room', roomData);
    };

    initSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', {
          type,
          groupId,
          sessionId
        });
        socketRef.current.disconnect();
      }
    };
  }, [type, groupId, sessionId]);

  const handleSendMessage = (content) => {
    if (!socketRef.current || !isConnected) return;

    const messageData = {
      chatType: type,
      content: content.trim(),
      ...(type === 'group' ? { groupId } : { sessionId })
    };

    socketRef.current.emit('send-message', messageData);
  };

  if (isLoading) {
    return (
      <div className="chat-window">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>
          {type === 'group' ? 'Group Chat' : 'Session Chat'}
          {isConnected ? (
            <span className="connection-status connected">●</span>
          ) : (
            <span className="connection-status disconnected">●</span>
          )}
        </h3>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        placeholder={isConnected ? "Type a message..." : "Connecting..."}
      />
    </div>
  );
};

export default ChatWindow;
