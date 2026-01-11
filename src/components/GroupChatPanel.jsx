import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, API_BASE_URL } from '../utils/api';
import { Mic, BarChart2, Plus, Send } from 'lucide-react';
import './GroupChatPanel.css';

const GroupChatPanel = ({ group, isOpen, onClose, onMaximize }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActionPopover, setShowActionPopover] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: ['', ''] });
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [groupMembers, setGroupMembers] = useState([]);

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
      loadGroupMembers();
    }
  }, [isOpen, group]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-focus input when chat opens (Messenger behavior)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  const loadGroupMembers = async () => {
    if (!group) return;

    try {
      const response = await groupsAPI.getGroupMembers(group._id);
      setGroupMembers(response.data.data.members || []);
    } catch (error) {
      console.error('Failed to load group members:', error);
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
      setShowPollModal(false);
      setShowActionPopover(false);
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
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

  // Determine expansion state (Messenger-accurate)
  const hasText = newMessage.trim().length > 0;
  const isTyping = isInputFocused || hasText;

  console.log('Chat state:', { hasText, isTyping, isInputFocused, newMessage });

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionPopover && !event.target.closest('.action-popover, .plus-btn')) {
        setShowActionPopover(false);
      }
      if (showMentions && !event.target.closest('.mentions-dropdown, input')) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionPopover, showMentions]);

  // Handle mention detection and keyboard navigation
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setNewMessage(value);
    setCursorPosition(cursorPos);

    // Check for @ symbol
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1);
      if (query.length === 0 || query.match(/^\w*$/)) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (member) => {
    const textBeforeAt = newMessage.substring(0, newMessage.lastIndexOf('@'));
    const textAfterCursor = newMessage.substring(cursorPosition);
    const mention = `@${member.username} `;

    const newText = textBeforeAt + mention + textAfterCursor;
    setNewMessage(newText);
    setShowMentions(false);
    setMentionQuery('');

    // Focus back to input and set cursor position
    setTimeout(() => {
      inputRef.current.focus();
      const newCursorPos = textBeforeAt.length + mention.length;
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (!showMentions) return;

    const filteredMembers = groupMembers.filter(member =>
      member.username.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => (prev + 1) % filteredMembers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => prev === 0 ? filteredMembers.length - 1 : prev - 1);
    } else if (e.key === 'Enter' && filteredMembers.length > 0) {
      e.preventDefault();
      handleMentionSelect(filteredMembers[mentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="chat-panel-backdrop" onClick={!isMobile ? onClose : undefined} />

      {/* Panel */}
      <div className={`group-chat-panel ${isMaximized ? 'maximized' : ''} ${isMinimized ? 'minimized' : ''}`}>
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
              className="chat-panel-close-btn"
              onClick={onClose}
              title={isMobile ? "Back" : "Close chat"}
            >
              {isMobile ? '←' : '×'}
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
          ) : !Array.isArray(messages) || messages.length === 0 ? (
            <div className="chat-empty">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`chat-message ${message.senderId._id === user?.id ? 'own' : 'other'}`}
              >
                <div className="message-sender">
                  {message.senderId.username}
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

                <div className="message-time">
                  {formatTime(message.createdAt)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Messenger-Style Progressive Disclosure */}
        <div className="chat-panel-input">
          <div className="input-container">
            {/* LEFT ACTION AREA - Conditional based on typing state */}
            {!isTyping && (
              <>
                <button
                  className="action-btn"
                  onClick={handleVoiceNote}
                  title="Voice"
                  disabled={isRecording}
                >
                  <Mic size={18} />
                </button>
                <button
                  className="action-btn"
                  onClick={() => setShowPollModal(true)}
                  title="Poll"
                >
                  <BarChart2 size={18} />
                </button>
              </>
            )}

            {isTyping && (
              <button
                className="action-btn plus-btn"
                onClick={() => setShowActionPopover(prev => !prev)}
                title="More"
              >
                <Plus size={18} />
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                if (!newMessage.trim()) setIsInputFocused(false);
              }}
              placeholder="Type a message..."
              disabled={sending}
              className={`message-input ${isTyping ? 'expanded' : ''}`}
            />

            {/* Send button ALWAYS visible */}
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!hasText || sending}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Mentions Dropdown */}
          {showMentions && (
            <div className="mentions-dropdown">
              {groupMembers
                .filter(member =>
                  member.username.toLowerCase().includes(mentionQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((member, index) => (
                  <button
                    key={member._id}
                    className={`mention-item ${index === mentionIndex ? 'selected' : ''}`}
                    onClick={() => handleMentionSelect(member)}
                  >
                    <span className="mention-username">@{member.username}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Action Popover - only shown in typing state */}
          {showActionPopover && isExpanded && (
            <div className="action-popover">
              <button
                className={`popover-item ${isRecording ? 'recording' : ''}`}
                onClick={() => {
                  handleVoiceNote();
                  setShowActionPopover(false);
                }}
              >
                <Mic size={15} />
                <span>{isRecording ? 'Stop Recording' : 'Voice Note'}</span>
              </button>
              <button
                className="popover-item"
                onClick={() => {
                  setShowPollModal(true);
                  setShowActionPopover(false);
                }}
              >
                <BarChart2 size={16} />
                <span>Create Poll</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="poll-modal-overlay" onClick={() => setShowPollModal(false)}>
          <div className="poll-modal" onClick={e => e.stopPropagation()}>
            <div className="poll-modal-header">
              <h3>Create Poll</h3>
              <button
                className="poll-modal-close"
                onClick={() => setShowPollModal(false)}
              >
                ×
              </button>
            </div>

            <div className="poll-modal-body">
              <div className="poll-form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={pollData.question}
                  onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="What's your question?"
                  maxLength={200}
                />
              </div>

              <div className="poll-options-section">
                <label>Options</label>
                {pollData.options.map((option, index) => (
                  <div key={index} className="poll-option-input">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollData.options];
                        newOptions[index] = e.target.value;
                        setPollData(prev => ({ ...prev, options: newOptions }));
                      }}
                      placeholder={`Option ${index + 1}`}
                      maxLength={100}
                    />
                    {pollData.options.length > 2 && (
                      <button
                        className="remove-option-btn"
                        onClick={() => {
                          const newOptions = pollData.options.filter((_, i) => i !== index);
                          setPollData(prev => ({ ...prev, options: newOptions }));
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {pollData.options.length < 10 && (
                  <button
                    className="add-option-btn"
                    onClick={() => {
                      setPollData(prev => ({ ...prev, options: [...prev.options, ''] }));
                    }}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>

            <div className="poll-modal-footer">
              <button
                className="poll-cancel-btn"
                onClick={() => {
                  setShowPollModal(false);
                  setPollData({ question: '', options: ['', ''] });
                }}
              >
                Cancel
              </button>
              <button
                className="poll-create-btn"
                onClick={() => {
                  if (!pollData.question.trim() || pollData.options.filter(opt => opt.trim()).length < 2) {
                    alert('Please enter a question and at least 2 options');
                    return;
                  }
                  handleCreatePoll();
                }}
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupChatPanel;


