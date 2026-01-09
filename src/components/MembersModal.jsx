
import React, { useEffect, useRef } from 'react';
import { Icons } from '../ui/icons';
import { FiUserMinus } from 'react-icons/fi';
import './MembersModal.css';

const MembersModal = ({
    isOpen,
    onClose,
    members = [],
    currentUserId,
    groupCreatorId,
    onRemoveMember,
    groupName
}) => {
    const modalRef = useRef(null);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        // Lock scroll when open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleRemoveClick = (memberId, memberName) => {
        if (window.confirm(`Are you sure you want to remove ${memberName} from the group ? `)) {
            onRemoveMember(memberId);
        }
    };

    // Helper for safe ID comparison
    const isSameId = (id1, id2) => String(id1 || '') === String(id2 || '');

    // Sort members: Creator first, then alphabetical
    const sortedMembers = [...members].sort((a, b) => {
        const aId = a._id || a.id;
        const bId = b._id || b.id;

        // Creator always first
        if (isSameId(aId, groupCreatorId)) return -1;
        if (isSameId(bId, groupCreatorId)) return 1;

        // Then alphabetical by name
        const aName = a.username || a.name || '';
        const bName = b.username || b.name || '';
        return aName.localeCompare(bName);
    });

    const isAdmin = isSameId(currentUserId, groupCreatorId);

    return (
        <div className="members-modal-overlay" onClick={handleOverlayClick}>
            <div className="members-modal-content" ref={modalRef}>
                {/* Header */}
                <div className="members-modal-header">
                    <h3 className="members-modal-title">
                        <Icons.users size={20} />
                        Members ({members.length})
                    </h3>
                    <button className="members-modal-close" onClick={onClose} aria-label="Close">
                        <Icons.close size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="members-modal-list">
                    {members.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            No members found.
                        </div>
                    ) : (
                        sortedMembers.map((member) => {
                            const memberId = member._id || member.id;
                            const memberName = member.username || member.name || 'Unknown';
                            // const memberEmail = member.email || ''; // Kept hidden for clean UI
                            const isCreator = isSameId(memberId, groupCreatorId);
                            const isMe = isSameId(memberId, currentUserId);

                            // Determine if remove action should be shown
                            // Show remove if:
                            // 1. Current user is Admin AND the member row is NOT the admin themselves
                            // 2. OR (Optionally) user can remove themselves? Usually leaving is a different action (Leave Group button).
                            // The logic requested: "If removable -> HiUserRemove, If not removable -> disabled or hidden"
                            // typically "Group owner -> yes, Admin -> yes"
                            // "Normal member -> optional: only for themselves".
                            // In this app, "Leave Group" is usually on the card/details.
                            // Let's stick to Admin removing others.
                            const canRemove = isAdmin && !isCreator;

                            return (
                                <div key={memberId} className="member-row">
                                    <div className="member-info-left">
                                        <div className="member-avatar-circle">
                                            <Icons.user size={20} />
                                        </div>
                                        <div className="member-text">
                                            <div className="member-username">
                                                {memberName}
                                                {isMe && <span className="me-badge"> (You)</span>}
                                                {isCreator && (
                                                    <span className="admin-badge">
                                                        <Icons.lock size={10} />
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                            {/* Optional: Show email if needed, or keep it clean as per screenshot which only shows name usually */}
                                            {/* Screenshot shows just one line, but having email as subtext is helpful. I'll Keep it small. */}
                                        </div>
                                    </div>

                                    <div className="member-action-right">
                                        {canRemove && (
                                            <button
                                                className="btn-remove-user"
                                                onClick={() => handleRemoveClick(memberId, memberName)}
                                                title="Remove member"
                                                aria-label={`Remove ${memberName} `}
                                            >
                                                <FiUserMinus size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default MembersModal;
