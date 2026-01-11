import { useState, useRef, useEffect } from 'react';
import { LuArrowLeft, LuMic, LuVote, LuPlus } from 'react-icons/lu';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, disabled, placeholder }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showExtraButtons, setShowExtraButtons] = useState(true);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isTyping) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Max height in pixels

      if (scrollHeight > maxHeight) {
        textareaRef.current.style.height = maxHeight + 'px';
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.height = scrollHeight + 'px';
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [message, isTyping]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Enter typing mode when user starts typing
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      setShowExtraButtons(false);
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false);
      setShowExtraButtons(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      setShowExtraButtons(true);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Just Enter adds new line (only in textarea mode)
    // This is handled naturally by textarea
  };

  const handleMicClick = () => {
    // TODO: Implement voice message functionality
    console.log('Mic button clicked');
  };

  const handlePollClick = () => {
    // TODO: Implement poll creation functionality
    console.log('Poll button clicked');
  };

  const handlePlusClick = () => {
    setShowExtraButtons(!showExtraButtons);
  };

  const handleFocus = () => {
    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
      setShowExtraButtons(false);
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      {/* Default state buttons */}
      {(!isTyping || showExtraButtons) && (
        <>
          <button
            type="button"
            className="input-button mic-button"
            onClick={handleMicClick}
            disabled={disabled}
            title="Voice message"
          >
            <LuMic size={20} />
          </button>

          <button
            type="button"
            className="input-button poll-button"
            onClick={handlePollClick}
            disabled={disabled}
            title="Create poll"
          >
            <LuVote size={20} />
          </button>
        </>
      )}

      {/* Plus button when typing */}
      {isTyping && !showExtraButtons && (
        <button
          type="button"
          className="input-button plus-button"
          onClick={handlePlusClick}
          disabled={disabled}
          title="Show more options"
        >
          <LuPlus size={20} />
        </button>
      )}

      {/* Text input - switches between input and textarea */}
      {isTyping ? (
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder || "Message…"}
          disabled={disabled}
          maxLength={1000}
          className="message-textarea"
          rows={1}
        />
      ) : (
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || "Message…"}
          disabled={disabled}
          maxLength={1000}
          className="message-input"
        />
      )}

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="send-button"
        title="Send message"
      >
        <LuArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
      </button>
    </form>
  );
};

export default ChatInput;
