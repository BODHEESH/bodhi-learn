const COURSE_STATUS = {
    DRAFT: 'draft',
    REVIEW: 'review',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
    SUSPENDED: 'suspended'
};

const ENROLLMENT_TYPE = {
    FREE: 'free',
    PAID: 'paid',
    INVITE_ONLY: 'invite_only',
    SUBSCRIPTION: 'subscription'
};

const COURSE_LEVEL = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
    ALL_LEVELS: 'all_levels'
};

const COURSE_LANGUAGE = {
    ENGLISH: 'english',
    SPANISH: 'spanish',
    FRENCH: 'french',
    GERMAN: 'german',
    CHINESE: 'chinese',
    JAPANESE: 'japanese',
    KOREAN: 'korean',
    HINDI: 'hindi',
    ARABIC: 'arabic',
    PORTUGUESE: 'portuguese'
};

const ENROLLMENT_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

const RESOURCE_TYPE = {
    PDF: 'pdf',
    VIDEO: 'video',
    AUDIO: 'audio',
    LINK: 'link',
    CODE: 'code',
    PRESENTATION: 'presentation',
    DOCUMENT: 'document',
    SPREADSHEET: 'spreadsheet',
    ARCHIVE: 'archive'
};

const CATEGORY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};

const ERROR_MESSAGES = {
    COURSE_NOT_FOUND: 'Course not found',
    CATEGORY_NOT_FOUND: 'Category not found',
    INVALID_STATUS: 'Invalid course status',
    INVALID_ENROLLMENT_TYPE: 'Invalid enrollment type',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    DUPLICATE_TITLE: 'Course with this title already exists'
};

module.exports = {
    COURSE_STATUS,
    ENROLLMENT_TYPE,
    COURSE_LEVEL,
    COURSE_LANGUAGE,
    ENROLLMENT_STATUS,
    RESOURCE_TYPE,
    CATEGORY_STATUS,
    ERROR_MESSAGES
};