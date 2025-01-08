const CURRICULUM_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

const CURRICULUM_ITEM_TYPE = {
    VIDEO: 'video',
    DOCUMENT: 'document',
    QUIZ: 'quiz',
    ASSIGNMENT: 'assignment',
    LIVE_SESSION: 'live-session'
};

const ERROR_MESSAGES = {
    CURRICULUM_NOT_FOUND: 'Curriculum not found',
    SECTION_NOT_FOUND: 'Section not found',
    ITEM_NOT_FOUND: 'Curriculum item not found',
    DUPLICATE_SECTION_TITLE: 'Section with this title already exists in the curriculum',
    DUPLICATE_ITEM_TITLE: 'Item with this title already exists in the section',
    INVALID_ITEM_TYPE: 'Invalid curriculum item type',
    INVALID_STATUS: 'Invalid curriculum status',
    CONTENT_NOT_FOUND: 'Referenced content not found',
    CURRICULUM_EXISTS: 'Curriculum already exists for this course'
};

module.exports = {
    CURRICULUM_STATUS,
    CURRICULUM_ITEM_TYPE,
    ERROR_MESSAGES
};
