import Message from '../models/Message.js';
import StudyGroup from '../models/StudyGroup.js';

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
      const { groupId } = data;
      const userId = socket.userId; // Set by auth middleware

      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (!groupId) {
        socket.emit('error', { message: 'Group ID is required' });
        return;
      }

      // Verify user is a member of the group
      const group = await StudyGroup.findById(groupId);
      if (!group || !group.members.includes(userId)) {
        socket.emit('error', { message: 'Access denied: Not a group member' });
        return;
      }

      const roomId = `group-${groupId}`;

      // Leave any existing rooms first
      const currentRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      currentRooms.forEach(room => socket.leave(room));

      // Join the new room
      socket.join(roomId);
      console.log(`User ${userId} joined room: ${roomId}`);

      // Send recent messages
      const messages = await Message.getGroupMessages(groupId);

      socket.emit('room-joined', {
        roomId,
        messages: messages.map(msg => ({
          _id: msg._id,
          content: msg.content,
          sender: msg.sender,
          pollData: msg.pollData,
          audioUrl: msg.audioUrl,
          createdAt: msg.createdAt
        }))
      });
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { groupId, content } = data;
      const userId = socket.userId;

      if (!userId || !groupId || !content || !content.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Verify user is a member
      const group = await StudyGroup.findById(groupId);
      if (!group || !group.members.includes(userId)) {
        socket.emit('error', { message: 'Access denied: Not a group member' });
        return;
      }

      const message = await Message.createGroupMessage(groupId, userId, content);
      const roomId = `group-${groupId}`;

      // Populate sender info
      await message.populate('sender', 'username _id');

      // Emit to room
      const messageData = {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        pollData: message.pollData,
        audioUrl: message.audioUrl,
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
      const { groupId } = data;

      if (groupId) {
        const roomId = `group-${groupId}`;
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
