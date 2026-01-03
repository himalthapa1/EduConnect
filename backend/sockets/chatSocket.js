import Message from '../models/Message.js';
import StudyGroup from '../models/StudyGroup.js';
import Session from '../models/Session.js';

/**
 * Register chat socket handlers
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Client socket
 */
export const registerChatHandlers = async (io, socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a chat room
  socket.on('join-room', async (data) => {
    try {
      const { type, groupId, sessionId } = data;
      const userId = socket.userId; // Set by auth middleware

      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      let roomId;
      let hasAccess = false;

      if (type === 'group' && groupId) {
        // Verify user is a member of the group
        const group = await StudyGroup.findById(groupId);
        if (group && group.members.includes(userId)) {
          roomId = `group-${groupId}`;
          hasAccess = true;
        }
      } else if (type === 'session' && sessionId) {
        // Verify user is a participant in the session
        const session = await Session.findById(sessionId).populate('participants.user');
        if (session) {
          const isParticipant = session.participants.some(p =>
            p.user._id.toString() === userId.toString()
          );
          const isOrganizer = session.organizer.toString() === userId.toString();

          if (isParticipant || isOrganizer) {
            roomId = `session-${sessionId}`;
            hasAccess = true;
          }
        }
      }

      if (hasAccess && roomId) {
        // Leave any existing rooms first
        const currentRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
        currentRooms.forEach(room => socket.leave(room));

        // Join the new room
        socket.join(roomId);
        console.log(`User ${userId} joined room: ${roomId}`);

        // Send recent messages
        let messages = [];
        if (type === 'group') {
          messages = await Message.getGroupMessages(groupId);
        } else if (type === 'session') {
          messages = await Message.getSessionMessages(sessionId);
        }

        socket.emit('room-joined', {
          roomId,
          messages: messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            sender: msg.sender,
            createdAt: msg.createdAt
          }))
        });
      } else {
        socket.emit('error', { message: 'Access denied or invalid room' });
      }
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { chatType, groupId, sessionId, content } = data;
      const userId = socket.userId;

      if (!userId || !content || !content.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      let message;
      let roomId;

      if (chatType === 'group' && groupId) {
        // Verify user is a member
        const group = await StudyGroup.findById(groupId);
        if (!group || !group.members.includes(userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        message = await Message.createGroupMessage(groupId, userId, content);
        roomId = `group-${groupId}`;
      } else if (chatType === 'session' && sessionId) {
        // Verify user is a participant
        const session = await Session.findById(sessionId).populate('participants.user');
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const isParticipant = session.participants.some(p =>
          p.user._id.toString() === userId.toString()
        );
        const isOrganizer = session.organizer.toString() === userId.toString();

        if (!isParticipant && !isOrganizer) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        message = await Message.createSessionMessage(sessionId, userId, content);
        roomId = `session-${sessionId}`;
      } else {
        socket.emit('error', { message: 'Invalid chat type or ID' });
        return;
      }

      // Populate sender info
      await message.populate('sender', 'username');

      // Emit to room
      const messageData = {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        createdAt: message.createdAt
      };

      io.to(roomId).emit('new-message', messageData);

      console.log(`Message sent in ${roomId}: ${content.substring(0, 50)}...`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle leaving room
  socket.on('leave-room', (data) => {
    try {
      const { type, groupId, sessionId } = data;
      let roomId;

      if (type === 'group' && groupId) {
        roomId = `group-${groupId}`;
      } else if (type === 'session' && sessionId) {
        roomId = `session-${sessionId}`;
      }

      if (roomId) {
        socket.leave(roomId);
        console.log(`User ${socket.userId} left room: ${roomId}`);
      }
    } catch (error) {
      console.error('Leave room error:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
};
