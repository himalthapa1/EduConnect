/**
 * Group Data Contract
 * 
 * This interface defines the standardized data structure that all UI components
 * should use for group-related data. It abstracts away backend inconsistencies
 * and provides a consistent interface for the frontend.
 */

export interface Group {
  id: string;
  name: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  membersCount: number;
  rating?: number | null;
  isTrending?: boolean;
}

/**
 * Backend Group Data Interface
 * 
 * This interface represents the data structure returned by the backend APIs.
 * It may have different field names and optional fields that need transformation.
 */
export interface BackendGroup {
  _id?: string;
  id?: string;
  name: string;
  subject: string;
  difficulty: string;
  members_count?: number;
  memberCount?: number;
  averageRating?: number;
  popularityScore?: number;
  score?: number;
  members?: any[];
  creator?: any;
  createdAt?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Group Transformation Options
 */
export interface GroupTransformOptions {
  isTrending?: boolean;
  defaultCategory?: string;
  defaultLevel?: "beginner" | "intermediate" | "advanced";
  defaultMembersCount?: number;
  defaultRating?: number | null;
}

/**
 * Validates and normalizes a level value
 */
export function normalizeLevel(level: any): "beginner" | "intermediate" | "advanced" {
  const normalized = String(level || "").toLowerCase().trim();
  
  // Map common variations to standard values
  const levelMap: Record<string, "beginner" | "intermediate" | "advanced"> = {
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
export function normalizeCategory(category: any): string {
  if (!category) return 'General';
  
  const normalized = String(category).trim();
  return normalized.length > 0 ? normalized : 'General';
}

/**
 * Validates and normalizes a members count value
 */
export function normalizeMembersCount(membersCount: any): number {
  if (membersCount == null || membersCount === '') return 0;
  
  const count = Number(membersCount);
  return isNaN(count) || count < 0 ? 0 : Math.floor(count);
}

/**
 * Validates and normalizes a rating value
 */
export function normalizeRating(rating: any): number | null {
  if (rating == null || rating === '') return null;
  
  const normalizedRating = Number(rating);
  if (isNaN(normalizedRating)) return null;
  
  // Clamp rating between 0 and 5
  return Math.max(0, Math.min(5, normalizedRating));
}

/**
 * Transforms backend group data to the standardized Group interface
 */
export function transformGroup(
  backendGroup: BackendGroup, 
  options: GroupTransformOptions = {}
): Group {
  const {
    isTrending = false,
    defaultCategory = 'General',
    defaultLevel = 'beginner',
    defaultMembersCount = 0,
    defaultRating = null
  } = options;

  // Extract ID (try multiple possible field names)
  const id = backendGroup._id || backendGroup.id || '';
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
export function transformGroups(
  backendGroups: BackendGroup[], 
  options: GroupTransformOptions = {}
): Group[] {
  if (!Array.isArray(backendGroups)) {
    console.warn('Group transformation: Expected array, got', typeof backendGroups);
    return [];
  }

  return backendGroups
    .filter(group => group && (group._id || group.id)) // Filter out invalid groups
    .map(group => transformGroup(group, options))
    .filter(group => group.id); // Ensure all groups have valid IDs
}

/**
 * Validates a Group object against the contract
 */
export function validateGroup(group: any): group is Group {
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
export function createDefaultGroup(id: string = 'default'): Group {
  return {
    id,
    name: 'Group Unavailable',
    category: 'General',
    level: 'beginner',
    membersCount: 0,
    rating: null
  };
}