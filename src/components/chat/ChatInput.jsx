import { useState } from 'react';
import { LuArrowLeft, LuMic, LuVote } from 'react-icons/lu';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, disabled, placeholder }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleMicClick = () => {
    // TODO: Implement voice message functionality
    console.log('Mic button clicked');
  };

  const handlePollClick = () => {
    // TODO: Implement poll creation functionality
    console.log('Poll button clicked');
  };



  return (
    <form className="chat-input" onSubmit={handleSubmit}>
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

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder || "Message…"}
        disabled={disabled}
        maxLength={1000}
        className="message-input"
      />

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
