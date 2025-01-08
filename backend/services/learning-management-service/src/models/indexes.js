const createIndexes = async (mongoose) => {
    // Course indexes
    await mongoose.model('Course').collection.createIndexes([
        { key: { title: 'text', description: 'text', tags: 'text' }, name: 'course_search' },
        { key: { status: 1, 'pricing.amount': 1 }, name: 'course_discovery' },
        { key: { 'engagement.averageRating': -1 }, name: 'course_rating' },
        { key: { instructors: 1 }, name: 'course_instructors' },
        { key: { skills: 1 }, name: 'course_skills' },
        { key: { level: 1, status: 1 }, name: 'course_level' },
        { key: { 'schedule.startDate': 1 }, name: 'course_schedule' },
        { key: { updatedAt: -1 }, name: 'course_updates' }
    ]);

    // Module indexes
    await mongoose.model('Module').collection.createIndexes([
        { key: { courseId: 1, order: 1 }, name: 'module_order' },
        { key: { status: 1 }, name: 'module_status' },
        { key: { prerequisites: 1 }, name: 'module_prerequisites' }
    ]);

    // Lesson indexes
    await mongoose.model('Lesson').collection.createIndexes([
        { key: { moduleId: 1, order: 1 }, name: 'lesson_order' },
        { key: { 'content.type': 1 }, name: 'lesson_type' },
        { key: { status: 1 }, name: 'lesson_status' }
    ]);

    // Content indexes
    await mongoose.model('Content').collection.createIndexes([
        { key: { title: 'text', description: 'text', tags: 'text' }, name: 'content_search' },
        { key: { type: 1, status: 1 }, name: 'content_discovery' },
        { key: { author: 1 }, name: 'content_author' },
        { key: { categories: 1 }, name: 'content_categories' },
        { key: { moderationStatus: 1 }, name: 'content_moderation' },
        { key: { views: -1 }, name: 'content_popularity' },
        { key: { createdAt: -1 }, name: 'content_recent' }
    ]);

    // Comment indexes
    await mongoose.model('Comment').collection.createIndexes([
        { key: { userId: 1 }, name: 'comment_user' },
        { key: { parentId: 1 }, name: 'comment_thread' },
        { key: { mentions: 1 }, name: 'comment_mentions' },
        { key: { moderationStatus: 1 }, name: 'comment_moderation' }
    ]);

    // Peer Review indexes
    await mongoose.model('PeerReview').collection.createIndexes([
        { key: { contentId: 1, contentType: 1 }, name: 'review_content' },
        { key: { reviewerId: 1 }, name: 'review_reviewer' },
        { key: { creatorId: 1 }, name: 'review_creator' },
        { key: { status: 1 }, name: 'review_status' },
        { key: { rating: -1 }, name: 'review_rating' }
    ]);

    // Mentorship indexes
    await mongoose.model('Mentorship').collection.createIndexes([
        { key: { mentorId: 1, status: 1 }, name: 'mentorship_mentor' },
        { key: { menteeId: 1, status: 1 }, name: 'mentorship_mentee' },
        { key: { type: 1 }, name: 'mentorship_type' },
        { key: { 'skillsFocus.skillId': 1 }, name: 'mentorship_skills' },
        { key: { 'duration.start': 1 }, name: 'mentorship_schedule' }
    ]);

    // Mentorship Session indexes
    await mongoose.model('MentorshipSession').collection.createIndexes([
        { key: { mentorshipId: 1, date: 1 }, name: 'session_schedule' },
        { key: { status: 1 }, name: 'session_status' }
    ]);

    // Learning Challenge indexes
    await mongoose.model('LearningChallenge').collection.createIndexes([
        { key: { title: 'text', description: 'text' }, name: 'challenge_search' },
        { key: { type: 1, status: 1 }, name: 'challenge_discovery' },
        { key: { startDate: 1, endDate: 1 }, name: 'challenge_schedule' },
        { key: { 'participants.userId': 1 }, name: 'challenge_participants' },
        { key: { creatorId: 1 }, name: 'challenge_creator' }
    ]);

    // Group Study Session indexes
    await mongoose.model('GroupStudySession').collection.createIndexes([
        { key: { scheduledDate: 1 }, name: 'study_schedule' },
        { key: { facilitatorId: 1 }, name: 'study_facilitator' },
        { key: { type: 1, status: 1 }, name: 'study_type' },
        { key: { topics: 1 }, name: 'study_topics' },
        { key: { 'participants.userId': 1 }, name: 'study_participants' }
    ]);

    // User Stats indexes
    await mongoose.model('UserStats').collection.createIndexes([
        { key: { userId: 1 }, unique: true, name: 'stats_user' },
        { key: { xp: -1 }, name: 'stats_leaderboard' },
        { key: { 'skills.skillId': 1, 'skills.level': -1 }, name: 'stats_skills' },
        { key: { 'mentorship.isMentor': 1 }, name: 'stats_mentors' },
        { key: { 'learning.coursesEnrolled': -1 }, name: 'stats_engagement' },
        { key: { 'preferences.learningStyle': 1 }, name: 'stats_preferences' }
    ]);

    // Compound indexes for advanced queries
    await mongoose.model('Course').collection.createIndexes([
        { 
            key: { 
                status: 1, 
                level: 1, 
                'engagement.averageRating': -1 
            }, 
            name: 'course_discovery_compound' 
        }
    ]);

    await mongoose.model('Content').collection.createIndexes([
        { 
            key: { 
                type: 1, 
                status: 1, 
                views: -1 
            }, 
            name: 'content_trending' 
        }
    ]);

    await mongoose.model('Mentorship').collection.createIndexes([
        { 
            key: { 
                type: 1, 
                status: 1, 
                'skillsFocus.skillId': 1 
            }, 
            name: 'mentorship_matching' 
        }
    ]);

    console.log('All indexes created successfully');
};

const dropIndexes = async (mongoose) => {
    const models = [
        'Course', 'Module', 'Lesson', 'Content', 'Comment',
        'PeerReview', 'Mentorship', 'MentorshipSession',
        'LearningChallenge', 'GroupStudySession', 'UserStats'
    ];

    for (const modelName of models) {
        await mongoose.model(modelName).collection.dropIndexes();
    }
    console.log('All indexes dropped successfully');
};

module.exports = {
    createIndexes,
    dropIndexes
};
