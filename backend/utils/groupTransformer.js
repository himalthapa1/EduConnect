/**
 * Group Data Transformation Utilities
 * 
 * This module provides functions to transform and validate group data
 * for consistent frontend display. It replaces the TypeScript interfaces
 * and transformation logic.
 */

/**
 * Validates and normalizes a level value
 */
function normalizeLevel(level) {
  const normalized = String(level || "").toLowerCase().trim();
  
  // Map common variations to standard values
  const levelMap = {
    'beginner': 'beginner',
    'begining': 'beginner', // Common typo
    'intermediate': 'intermediate',
    'advanced': 'advanced',
    'expert': 'advanced',
    'pro': 'advanced'
  };

  return levelMap[normalized] || 'beginner';
}

/**
 * Validates and normalizes a category value
 */
function normalizeCategory(category) {
  if (!category) return 'General';
  
  const normalized = String(category).trim();
  return normalized.length > 0 ? normalized : 'General';
}

/**
 * Validates and normalizes a members count value
 */
function normalizeMembersCount(membersCount) {
  if (membersCount == null || membersCount === '') return 0;
  
  const count = Number(membersCount);
  return isNaN(count) || count < 0 ? 0 : Math.floor(count);
}

/**
 * Validates and normalizes a rating value
 */
function normalizeRating(rating) {
  if (rating == null || rating === '') return null;
  
  const normalizedRating = Number(rating);
  if (isNaN(normalizedRating)) return null;
  
  // Clamp rating between 0 and 5
  return Math.max(0, Math.min(5, normalizedRating));
}

/**
 * Transforms backend group data to the standardized Group interface
 */
function transformGroup(backendGroup, options = {}) {
  const {
    isTrending = false,
    defaultCategory = 'General',
    defaultLevel = 'beginner',
    defaultMembersCount = 0,
    defaultRating = null
  } = options;

  // Extract ID (try multiple possible field names)
  const id = backendGroup.group_id || backendGroup.id || '';
  if (!id) {
    console.warn('Group transformation: Missing ID in backend data', backendGroup);
  }

  // Transform and validate each field
  const name = String(backendGroup.name || '').trim() || 'Unnamed Group';
  const category = normalizeCategory(backendGroup.subject || defaultCategory);
  const level = normalizeLevel(backendGroup.difficulty || defaultLevel);
  
  // Handle members count (try multiple possible field names)
  const membersCount = normalizeMembersCount(
    backendGroup.members_count ?? 
    backendGroup.memberCount ?? 
    backendGroup.members?.length ?? 
    defaultMembersCount
  );

  // Handle rating
  const rating = normalizeRating(backendGroup.averageRating ?? defaultRating);

  return {
    id,
    name,
    category,
    level,
    membersCount,
    rating,
    isTrending
  };
}

/**
 * Transforms an array of backend groups to standardized Group array
 */
function transformGroups(backendGroups, options = {}) {
  if (!Array.isArray(backendGroups)) {
    console.warn('Group transformation: Expected array, got', typeof backendGroups);
    return [];
  }

  return backendGroups
    .filter(group => group && (group.group_id || group.id)) // Filter out invalid groups
    .map(group => transformGroup(group, options))
    .filter(group => group.id); // Ensure all groups have valid IDs
}

/**
 * Validates a Group object against the contract
 */
function validateGroup(group) {
  if (!group || typeof group !== 'object') return false;
  
  const requiredFields = ['id', 'name', 'category', 'level', 'membersCount'];
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!(field in group)) return false;
  }
  
  // Validate field types and values
  if (typeof group.id !== 'string' || !group.id.trim()) return false;
  if (typeof group.name !== 'string' || !group.name.trim()) return false;
  if (typeof group.category !== 'string' || !group.category.trim()) return false;
  if (typeof group.membersCount !== 'number' || group.membersCount < 0) return false;
  
  // Validate level
  if (!validLevels.includes(group.level)) return false;
  
  // Validate optional rating
  if (group.rating !== undefined && group.rating !== null) {
    if (typeof group.rating !== 'number' || group.rating < 0 || group.rating > 5) {
      return false;
    }
  }
  
  // Validate optional isTrending
  if (group.isTrending !== undefined && typeof group.isTrending !== 'boolean') {
    return false;
  }
  
  return true;
}

/**
 * Creates a default Group object for error states
 */
function createDefaultGroup(id = 'default') {
  return {
    id,
    name: 'Group Unavailable',
    category: 'General',
    level: 'beginner',
    membersCount: 0,
    rating: null
  };
}

/**
 * Formats member count for display (e.g., 1000 -> "1k")
 */
function formatMemberCount(count) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Formats rating to one decimal place
 */
function formatRating(rating) {
  return rating.toFixed(1);
}

/**
 * Formats difficulty for display (uppercase first letter)
 */
function formatDifficulty(difficulty) {
  if (!difficulty) return 'Beginner';
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Creates a complete group display object with all formatting applied
 */
function createGroupDisplayObject(backendGroup, options = {}) {
  const transformedGroup = transformGroup(backendGroup, options);
  
  if (!validateGroup(transformedGroup)) {
    return createDefaultGroup();
  }

  return {
    ...transformedGroup,
    // Add formatted versions for display
    formattedMembersCount: formatMemberCount(transformedGroup.membersCount),
    formattedRating: transformedGroup.rating ? formatRating(transformedGroup.rating) : null,
    formattedDifficulty: formatDifficulty(transformedGroup.level)
  };
}

// Export all functions
export {
  normalizeLevel,
  normalizeCategory,
  normalizeMembersCount,
  normalizeRating,
  transformGroup,
  transformGroups,
  validateGroup,
  createDefaultGroup,
  formatMemberCount,
  formatRating,
  formatDifficulty,
  createGroupDisplayObject
};

// For CommonJS compatibility (Node.js)
module.exports = {
  normalizeLevel,
  normalizeCategory,
  normalizeMembersCount,
  normalizeRating,
  transformGroup,
  transformGroups,
  validateGroup,
  createDefaultGroup,
  formatMemberCount,
  formatRating,
  formatDifficulty,
  createGroupDisplayObject
};