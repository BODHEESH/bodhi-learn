const mongoose = require('mongoose');
const schemas = require('./schemas');

// Course Module Models
const Course = mongoose.model('Course', schemas.CourseSchema);
const Module = mongoose.model('Module', schemas.ModuleSchema);
const Lesson = mongoose.model('Lesson', schemas.LessonSchema);

// Content Module Models
const Content = mongoose.model('Content', schemas.ContentSchema);
const Comment = mongoose.model('Comment', schemas.CommentSchema);

// Social Learning Models
const PeerReview = mongoose.model('PeerReview', schemas.PeerReviewSchema);
const Mentorship = mongoose.model('Mentorship', schemas.MentorshipSchema);
const MentorshipSession = mongoose.model('MentorshipSession', schemas.MentorshipSessionSchema);

// Engagement Models
const LearningChallenge = mongoose.model('LearningChallenge', schemas.LearningChallengeSchema);
const GroupStudySession = mongoose.model('GroupStudySession', schemas.GroupStudySessionSchema);
const SessionParticipation = mongoose.model('SessionParticipation', schemas.SessionParticipationSchema);

// Analytics Models
const UserStats = mongoose.model('UserStats', schemas.UserStatsSchema);

// Export all models
module.exports = {
    Course,
    Module,
    Lesson,
    Content,
    Comment,
    PeerReview,
    Mentorship,
    MentorshipSession,
    LearningChallenge,
    GroupStudySession,
    SessionParticipation,
    UserStats
};
