const { differenceInMinutes, addDays } = require('date-fns');

class LearningPathUtils {
    /**
     * Calculate deadline based on learning path settings
     */
    static calculateDeadline(path) {
        if (!path.settings.deadlines.enabled) {
            return null;
        }

        const defaultDuration = path.settings.deadlines.defaultDuration || 30;
        return addDays(new Date(), defaultDuration);
    }

    /**
     * Check if a prerequisite is met
     */
    static async checkPrerequisite(prerequisite, userId) {
        switch (prerequisite.type) {
            case 'skill':
                return await this.checkSkillPrerequisite(prerequisite, userId);
            case 'course':
                return await this.checkCoursePrerequisite(prerequisite, userId);
            case 'learning_path':
                return await this.checkLearningPathPrerequisite(prerequisite, userId);
            default:
                return false;
        }
    }

    /**
     * Calculate average completion time
     */
    static calculateAverageCompletionTime(completions, currentAverage, newTime) {
        return ((currentAverage * (completions - 1)) + newTime) / completions;
    }

    /**
     * Calculate average stage time
     */
    static calculateAverageStageTime(enrollments, stageIndex) {
        const stageTimes = enrollments.map(enrollment => {
            const stageCompletion = enrollment.progress.completedStages.find(
                s => s.stageIndex === stageIndex
            );
            if (!stageCompletion) return 0;

            const stageMilestones = enrollment.progress.completedMilestones.filter(
                m => m.stageIndex === stageIndex
            );
            return stageMilestones.reduce((total, m) => total + (m.timeSpent || 0), 0);
        });

        const totalTime = stageTimes.reduce((sum, time) => sum + time, 0);
        return stageTimes.length > 0 ? totalTime / stageTimes.length : 0;
    }

    /**
     * Calculate dropoff rate
     */
    static calculateDropoffRate(enrollments, stageIndex) {
        const totalEnrollments = enrollments.length;
        if (totalEnrollments === 0) return 0;

        const completedEnrollments = enrollments.filter(enrollment =>
            enrollment.progress.completedStages.some(s => s.stageIndex === stageIndex)
        ).length;

        return ((totalEnrollments - completedEnrollments) / totalEnrollments) * 100;
    }

    /**
     * Calculate average milestone score
     */
    static calculateAverageMilestoneScore(completions, stageIndex, milestoneIndex) {
        const scores = completions.map(enrollment => {
            const milestone = enrollment.progress.completedMilestones.find(
                m => m.stageIndex === stageIndex && m.milestoneIndex === milestoneIndex
            );
            return milestone ? milestone.score || 0 : 0;
        });

        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        return scores.length > 0 ? totalScore / scores.length : 0;
    }

    /**
     * Calculate average milestone attempts
     */
    static calculateAverageMilestoneAttempts(completions, stageIndex, milestoneIndex) {
        const attempts = completions.map(enrollment => {
            const milestone = enrollment.progress.completedMilestones.find(
                m => m.stageIndex === stageIndex && m.milestoneIndex === milestoneIndex
            );
            return milestone ? milestone.attempts || 1 : 0;
        });

        const totalAttempts = attempts.reduce((sum, attempt) => sum + attempt, 0);
        return attempts.length > 0 ? totalAttempts / attempts.length : 0;
    }

    /**
     * Calculate time distribution
     */
    static calculateTimeDistribution(enrollments) {
        const timeDistribution = {
            morning: 0, // 6-12
            afternoon: 0, // 12-18
            evening: 0, // 18-24
            night: 0 // 0-6
        };

        enrollments.forEach(enrollment => {
            enrollment.progress.completedMilestones.forEach(milestone => {
                const completionHour = new Date(milestone.completedAt).getHours();

                if (completionHour >= 6 && completionHour < 12) {
                    timeDistribution.morning++;
                } else if (completionHour >= 12 && completionHour < 18) {
                    timeDistribution.afternoon++;
                } else if (completionHour >= 18 && completionHour < 24) {
                    timeDistribution.evening++;
                } else {
                    timeDistribution.night++;
                }
            });
        });

        return timeDistribution;
    }

    /**
     * Generate time management recommendations
     */
    static generateTimeRecommendations(enrollment, path) {
        const recommendations = [];

        // Check completion pace
        const enrollmentDuration = differenceInMinutes(
            new Date(),
            enrollment.timeline.enrolledAt
        );
        const expectedDuration = path.duration * 60; // Convert hours to minutes

        if (enrollment.metrics.overallProgress < 50 && enrollmentDuration > expectedDuration / 2) {
            recommendations.push({
                type: 'pace_warning',
                message: 'You are falling behind the expected completion pace',
                suggestion: 'Consider allocating more time to complete the learning path'
            });
        }

        // Check deadline proximity
        if (enrollment.timeline.deadline) {
            const daysToDeadline = differenceInMinutes(
                enrollment.timeline.deadline,
                new Date()
            ) / (24 * 60);

            if (daysToDeadline < 7 && enrollment.metrics.overallProgress < 90) {
                recommendations.push({
                    type: 'deadline_warning',
                    message: 'Deadline is approaching',
                    suggestion: 'Increase your study time to complete the path before deadline'
                });
            }
        }

        // Check study patterns
        const timeDistribution = this.calculateTimeDistribution([enrollment]);
        const preferredTime = Object.entries(timeDistribution).reduce(
            (max, [time, count]) => (count > max.count ? { time, count } : max),
            { time: '', count: 0 }
        ).time;

        recommendations.push({
            type: 'study_pattern',
            message: `You seem to be most productive during ${preferredTime} hours`,
            suggestion: 'Try to schedule your learning sessions during your most productive hours'
        });

        return recommendations;
    }

    /**
     * Helper methods for prerequisite checking
     */
    static async checkSkillPrerequisite(prerequisite, userId) {
        // Implementation depends on skill assessment system
        return true;
    }

    static async checkCoursePrerequisite(prerequisite, userId) {
        // Implementation depends on course completion tracking
        return true;
    }

    static async checkLearningPathPrerequisite(prerequisite, userId) {
        // Implementation depends on learning path completion tracking
        return true;
    }
}

module.exports = LearningPathUtils;
