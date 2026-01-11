import { useState, useRef, useEffect } from 'react';
import { LuArrowLeft, LuMic, LuVote, LuPlus } from 'react-icons/lu';
import { groupsAPI } from '../../utils/api';
import PollModal from './PollModal';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, disabled, placeholder, groupId, sessionId, type }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showExtraButtons, setShowExtraButtons] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showPollModal, setShowPollModal] = useState(false);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceMessage(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const uploadVoiceMessage = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('content', 'Voice message');

      if (type === 'group' && groupId) {
        await groupsAPI.sendVoiceMessage(groupId, formData);
      }

      // Reset recording state
      setRecordingTime(0);
    } catch (error) {
      console.error('Error uploading voice message:', error);
      alert('Failed to send voice message');
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePollClick = () => {
    setShowPollModal(true);
  };

  const handlePollSuccess = () => {
    // Poll created successfully
    setShowPollModal(false);
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
            className={`input-button mic-button ${isRecording ? 'recording' : ''}`}
            onClick={handleMicClick}
            disabled={disabled}
            title={isRecording ? `Recording (${recordingTime}s)` : "Voice message"}
          >
            <LuMic size={20} />
            {isRecording && <span className="recording-time">{recordingTime}s</span>}
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

      {/* Poll Modal */}
      {showPollModal && (
        <PollModal
          onClose={() => setShowPollModal(false)}
          onSuccess={handlePollSuccess}
          groupId={groupId}
        />
      )}
    </form>
  );
};

export default ChatInput;
