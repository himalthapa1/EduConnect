import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import './ChatWindow.css';

// Get the API base URL for socket connection
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ChatWindow = ({ groupId, groupName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);



  // Check if user is authenticated
  if (!user) {
    return (
      <div className="chat-window">
        <div className="chat-error">
          <p>Please log in to use chat</p>
        </div>
      </div>
    );
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const initSocket = () => {
      const socket = io(API_BASE_URL, {
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

      socket.on('poll-updated', (updatedMessage) => {
        console.log('Poll updated:', updatedMessage);
        setMessages(prev => prev.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
      });

      socket.on('error', (error) => {
        console.error('Chat error:', error.message);
        setIsLoading(false);
      });

      // Join the group room
      socket.emit('join-room', { groupId });

      // Timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log('Chat loading timeout - showing chat anyway');
          setIsLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    };

    initSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { groupId });
        socketRef.current.disconnect();
      }
    };
  }, [groupId]);

  const handleSendMessage = (content) => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit('send-message', {
      groupId,
      content: content.trim()
    });
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
          {groupName || 'Group Chat'}
        </h3>
        <button className="chat-close-btn" onClick={onClose} title="Close chat">
          ×
        </button>
        {isConnected ? (
          <span className="connection-status connected">●</span>
        ) : (
          <span className="connection-status disconnected">●</span>
        )}
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
              isOwn={message.sender?._id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        placeholder={isConnected ? "Type a message..." : "Connecting..."}
        groupId={groupId}
      />
    </div>
  );
};

export default ChatWindow;
