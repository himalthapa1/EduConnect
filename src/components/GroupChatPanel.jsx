import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, API_BASE_URL } from '../utils/api';
import { Icons } from '../ui/icons';
import './GroupChatPanel.css';

const GroupChatPanel = ({ group, isOpen, onClose, onMaximize }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''] });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && group) {
      loadMessages();
    }
  }, [isOpen, group]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!group) return;

    setLoading(true);
    try {
      const response = await groupsAPI.getGroupMessages(group._id);
      setMessages(response.data.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await groupsAPI.sendTextMessage(group._id, {
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, response.data.data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePlusClick = () => {
    setShowPlusMenu(!showPlusMenu);
  };

  const handleVoiceNote = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voice-note.webm');

          try {
            const response = await groupsAPI.sendVoiceMessage(group._id, formData);
            setMessages(prev => [...prev, response.data.data.message]);
          } catch (error) {
            console.error('Failed to send voice note:', error);
          }

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please check permissions.');
      }
    }
    setShowPlusMenu(false);
  };

  const handleCreatePoll = async () => {
    if (!pollData.question.trim() || pollData.options.some(opt => !opt.trim())) {
      alert('Please fill in the question and all options');
      return;
    }

    try {
      const response = await groupsAPI.createPoll(group._id, {
        question: pollData.question.trim(),
        options: pollData.options.filter(opt => opt.trim())
      });

      setMessages(prev => [...prev, response.data.data.message]);
      setPollData({ question: '', options: ['', ''] });
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
    setShowPlusMenu(false);
  };

  const handleVote = async (messageId, optionIndex) => {
    try {
      await groupsAPI.voteInPoll(group._id, messageId, optionIndex);
      // Reload messages to get updated poll results
      loadMessages();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen || !group) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="chat-panel-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="group-chat-panel">
        {/* Header */}
        <div className="chat-panel-header">
          <div className="chat-panel-header-info">
            <h3>{group.name}</h3>
            <span className="chat-panel-members">
              {group.members?.length || 0} members
            </span>
          </div>
          <div className="chat-panel-header-actions">
            <button
              className="chat-panel-maximize-btn"
              onClick={onMaximize}
              title="Maximize chat"
            >
              <Icons.maximize size={16} />
            </button>
            <button
              className="chat-panel-close-btn"
              onClick={onClose}
              title="Close chat"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-panel-messages">
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`chat-message ${message.senderId._id === user?.id ? 'own' : 'other'}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.senderId.username}
                  </span>
                  <span className="message-time">
                    {formatTime(message.createdAt)}
                  </span>
                </div>

                {message.type === 'text' && (
                  <div className="message-content">
                    {message.content}
                  </div>
                )}

                {message.type === 'voice' && (
                  <div className="message-voice">
                    <audio controls>
                      <source src={`${API_BASE_URL}/api/${message.audioUrl}`} type="audio/webm" />
                      Voice message
                    </audio>
                  </div>
                )}

                {message.type === 'poll' && (
                  <div className="message-poll">
                    <h4>📊 {message.pollData.question}</h4>
                    <div className="poll-options">
                      {message.pollData.options.map((option, index) => {
                        const hasVoted = option.votes.some(vote => vote.equals(user?.id));
                        const voteCount = option.votes.length;
                        const totalVotes = message.pollData.options.reduce((sum, opt) => sum + opt.votes.length, 0);

                        return (
                          <button
                            key={index}
                            className={`poll-option ${hasVoted ? 'voted' : ''}`}
                            onClick={() => handleVote(message._id, index)}
                            disabled={hasVoted}
                          >
                            <span className="option-text">{option.text}</span>
                            <span className="option-votes">
                              {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                              {totalVotes > 0 && ` (${Math.round((voteCount / totalVotes) * 100)}%)`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="poll-total">
                      Total votes: {message.pollData.options.reduce((sum, opt) => sum + opt.votes.length, 0)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-panel-input">
          <div className="input-container">
            <button
              className={`plus-btn ${showPlusMenu ? 'active' : ''}`}
              onClick={handlePlusClick}
              title="Add attachment"
            >
              +
            </button>

            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
            />

            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>

          {/* Plus Menu */}
          {showPlusMenu && (
            <div className="plus-menu">
              <button
                className={`menu-item ${isRecording ? 'recording' : ''}`}
                onClick={handleVoiceNote}
              >
                <Icons.mic size={16} />
                {isRecording ? 'Stop Recording' : 'Voice Note'}
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setShowPlusMenu(false);
                  // Show poll creation modal (simplified for now)
                  const question = prompt('Poll question:');
                  if (question) {
                    const option1 = prompt('Option 1:');
                    const option2 = prompt('Option 2:');
                    if (option1 && option2) {
                      setPollData({
                        question,
                        options: [option1, option2]
                      });
                      handleCreatePoll();
                    }
                  }
                }}
              >
                <Icons.barChart size={16} />
                Create Poll
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupChatPanel;