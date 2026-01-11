import { useState, useRef, useEffect } from 'react';
import { LuPlay, LuPause } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { groupsAPI } from '../../utils/api';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn }) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle polls
  if (message.pollData) {
    const { pollData } = message;
    const totalVotes = pollData.options.reduce((sum, option) => sum + option.votes.length, 0);
    const userVotedOption = pollData.options.findIndex(option =>
      option.votes.some(vote => vote.equals(user?.id))
    );

    const handleVote = async (optionIndex) => {
      if (!user) return;

      try {
        await groupsAPI.voteInPoll(message._id, optionIndex);
        // The vote will be reflected via socket updates
      } catch (error) {
        console.error('Error voting in poll:', error);
      }
    };

    return (
      <div className={`message-bubble poll-bubble ${isOwn ? 'own' : 'other'}`}>
        {!isOwn && (
          <div className="message-sender">
            {message.sender?.username || 'Unknown'}
          </div>
        )}

        <div className="poll-content">
          <div className="poll-question">
            {pollData.question}
          </div>

          <div className="poll-options">
            {pollData.options.map((option, index) => {
              const voteCount = option.votes.length;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const isUserVote = userVotedOption === index;

              return (
                <button
                  key={index}
                  className={`poll-option ${isUserVote ? 'voted' : ''}`}
                  onClick={() => handleVote(index)}
                  disabled={!user}
                >
                  <div className="option-content">
                    <span className="option-text">{option.text}</span>
                    <span className="vote-count">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                  <div
                    className="vote-bar"
                    style={{ width: `${percentage}%` }}
                  />
                </button>
              );
            })}
          </div>

          <div className="poll-footer">
            <span className="total-votes">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
            </span>
          </div>
        </div>

        <div className="message-time">
          {formatTime(message.createdAt)}
        </div>
      </div>
    );
  }

  // Handle voice messages
  if (message.type === 'voice') {
    return (
      <div className={`message-bubble voice-bubble ${isOwn ? 'own' : 'other'}`}>
        {!isOwn && (
          <div className="message-sender">
            {message.sender?.username || 'Unknown'}
          </div>
        )}

        <div className="voice-message-content">
          <button
            className="voice-play-button"
            onClick={togglePlayback}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <LuPause size={16} /> : <LuPlay size={16} />}
          </button>

          <div className="voice-info">
            <div className="voice-duration">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
            <div className="voice-waveform">
              {/* Simple waveform visualization */}
              <div className="wave-bars">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`wave-bar ${isPlaying ? 'playing' : ''}`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: `${Math.random() * 20 + 5}px`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${message.audioUrl}`}
            preload="metadata"
          />
        </div>

        <div className="message-time">
          {formatTime(message.createdAt)}
        </div>
      </div>
    );
  }

  // Handle text messages (existing functionality)
  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <div className="message-sender">
          {message.sender?.username || 'Unknown'}
        </div>
      )}

      <div className="message-content">
        <p>{message.content}</p>
      </div>

      <div className="message-time">
        {formatTime(message.createdAt)}
      </div>
    </div>
  );
};

export default MessageBubble;
