const crypto = require('crypto');
const { differenceInMinutes } = require('date-fns');

/**
 * Quiz Utility Functions
 */
class QuizUtils {
    /**
     * Generate a unique attempt ID
     */
    static generateAttemptId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Calculate time remaining for a quiz attempt
     */
    static calculateTimeRemaining(startTime, timeLimit) {
        const now = new Date();
        const elapsed = differenceInMinutes(now, startTime);
        return Math.max(0, timeLimit - elapsed);
    }

    /**
     * Calculate late submission penalty
     */
    static calculateLatePenalty(submissionTime, deadline, penaltyPercentage) {
        if (!submissionTime || !deadline || submissionTime <= deadline) {
            return 0;
        }

        return penaltyPercentage || 0;
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Calculate quiz statistics
     */
    static calculateQuizStats(attempts) {
        if (!attempts || attempts.length === 0) {
            return {
                totalAttempts: 0,
                averageScore: 0,
                passRate: 0,
                averageTime: 0,
                scoreDistribution: {
                    '0-20': 0,
                    '21-40': 0,
                    '41-60': 0,
                    '61-80': 0,
                    '81-100': 0
                }
            };
        }

        const stats = {
            totalAttempts: attempts.length,
            averageScore: 0,
            passRate: 0,
            averageTime: 0,
            scoreDistribution: {
                '0-20': 0,
                '21-40': 0,
                '41-60': 0,
                '61-80': 0,
                '81-100': 0
            }
        };

        let totalScore = 0;
        let totalTime = 0;
        let passCount = 0;

        attempts.forEach(attempt => {
            // Calculate average score
            totalScore += attempt.score || 0;

            // Calculate pass rate
            if (attempt.passed) {
                passCount++;
            }

            // Calculate average time
            if (attempt.startTime && attempt.endTime) {
                totalTime += (attempt.endTime - attempt.startTime);
            }

            // Calculate score distribution
            const score = attempt.score || 0;
            if (score <= 20) stats.scoreDistribution['0-20']++;
            else if (score <= 40) stats.scoreDistribution['21-40']++;
            else if (score <= 60) stats.scoreDistribution['41-60']++;
            else if (score <= 80) stats.scoreDistribution['61-80']++;
            else stats.scoreDistribution['81-100']++;
        });

        stats.averageScore = totalScore / attempts.length;
        stats.passRate = (passCount / attempts.length) * 100;
        stats.averageTime = totalTime / attempts.length;

        return stats;
    }

    /**
     * Calculate question difficulty based on response data
     */
    static calculateQuestionDifficulty(responses) {
        if (!responses || responses.length === 0) return 'unknown';

        const correctCount = responses.filter(r => r.correct).length;
        const difficultyRatio = correctCount / responses.length;

        if (difficultyRatio >= 0.8) return 'easy';
        if (difficultyRatio >= 0.4) return 'medium';
        return 'hard';
    }

    /**
     * Calculate question discrimination index
     */
    static calculateDiscriminationIndex(responses, totalScore) {
        if (!responses || responses.length < 2) return 0;

        // Sort attempts by total score
        const sortedAttempts = responses.sort((a, b) => b.totalScore - a.totalScore);

        // Get upper and lower groups (27% each)
        const groupSize = Math.floor(responses.length * 0.27);
        const upperGroup = sortedAttempts.slice(0, groupSize);
        const lowerGroup = sortedAttempts.slice(-groupSize);

        // Calculate correct responses in each group
        const upperCorrect = upperGroup.filter(r => r.correct).length;
        const lowerCorrect = lowerGroup.filter(r => r.correct).length;

        // Calculate discrimination index
        return (upperCorrect - lowerCorrect) / groupSize;
    }

    /**
     * Validate quiz settings
     */
    static validateQuizSettings(settings) {
        const errors = [];

        if (settings.timeLimit && settings.timeLimit < 1) {
            errors.push('Time limit must be at least 1 minute');
        }

        if (settings.attemptsAllowed && settings.attemptsAllowed < 1) {
            errors.push('Attempts allowed must be at least 1');
        }

        if (settings.passingScore && (settings.passingScore < 0 || settings.passingScore > 100)) {
            errors.push('Passing score must be between 0 and 100');
        }

        if (settings.schedule) {
            if (settings.schedule.endDate && settings.schedule.startDate) {
                if (settings.schedule.endDate <= settings.schedule.startDate) {
                    errors.push('End date must be after start date');
                }
            }

            if (settings.schedule.lateSubmission?.deadline && settings.schedule.endDate) {
                if (settings.schedule.lateSubmission.deadline <= settings.schedule.endDate) {
                    errors.push('Late submission deadline must be after end date');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format duration for display
     */
    static formatDuration(milliseconds) {
        const seconds = Math.floor((milliseconds / 1000) % 60);
        const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);

        return parts.join(' ') || '0s';
    }
}

module.exports = QuizUtils;
