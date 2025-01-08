const httpStatus = require('http-status');
const LearningPath = require('../models/learning-path.model');
const Enrollment = require('../models/enrollment.model');
const { ApiError } = require('../../../utils/errors');
const { paginate } = require('../../../utils/helpers');
const logger = require('../../../config/logger');
const LearningPathUtils = require('../utils/learning-path.utils');

class LearningPathService {
    /**
     * Create Learning Path
     */
    async createLearningPath(pathData) {
        const path = await LearningPath.create(pathData);
        return path;
    }

    /**
     * Get Learning Path by ID
     */
    async getLearningPathById(pathId, options = {}) {
        const path = await LearningPath.findById(pathId)
            .populate(options.populate || [])
            .select(options.select || '');
        return path;
    }

    /**
     * Update Learning Path
     */
    async updateLearningPath(pathId, updateData, userId) {
        const path = await LearningPath.findById(pathId);
        if (!path) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
        }

        Object.assign(path, {
            ...updateData,
            updatedBy: userId
        });

        await path.save();
        return path;
    }

    /**
     * Delete Learning Path
     */
    async deleteLearningPath(pathId) {
        const path = await LearningPath.findById(pathId);
        if (!path) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
        }

        // Check if there are active enrollments
        const activeEnrollments = await Enrollment.countDocuments({
            learningPathId: pathId,
            status: { $in: ['enrolled', 'in_progress'] }
        });

        if (activeEnrollments > 0) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Cannot delete learning path with active enrollments'
            );
        }

        await path.remove();
        return true;
    }

    /**
     * Query Learning Paths
     */
    async queryLearningPaths(filter, options) {
        const paths = await paginate(LearningPath, filter, options);
        return paths;
    }

    /**
     * Enroll User in Learning Path
     */
    async enrollUser(pathId, userId, options = {}) {
        const path = await LearningPath.findById(pathId);
        if (!path) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
        }

        // Check if user is already enrolled
        const existingEnrollment = await Enrollment.findOne({
            learningPathId: pathId,
            userId
        });

        if (existingEnrollment) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'User is already enrolled in this learning path'
            );
        }

        // Check prerequisites
        if (path.prerequisites && path.prerequisites.length > 0) {
            const prerequisitesMet = await this.checkPrerequisites(
                path.prerequisites,
                userId
            );
            if (!prerequisitesMet) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    'User does not meet prerequisites'
                );
            }
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            learningPathId: pathId,
            userId,
            status: 'enrolled',
            timeline: {
                enrolledAt: new Date(),
                deadline: options.deadline || LearningPathUtils.calculateDeadline(path)
            }
        });

        // Update learning path stats
        path.stats.enrollments += 1;
        await path.save();

        return enrollment;
    }

    /**
     * Update User Progress
     */
    async updateProgress(enrollmentId, progressData) {
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Enrollment not found');
        }

        const path = await LearningPath.findById(enrollment.learningPathId);
        if (!path) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
        }

        // Update milestone completion
        if (progressData.completedMilestone) {
            const { stageIndex, milestoneIndex, ...milestoneData } = progressData.completedMilestone;
            
            enrollment.progress.completedMilestones.push({
                stageIndex,
                milestoneIndex,
                completedAt: new Date(),
                ...milestoneData
            });

            // Check if stage is completed
            const stage = path.stages[stageIndex];
            const stageMilestones = stage.milestones;
            const completedStageMilestones = enrollment.progress.completedMilestones.filter(
                m => m.stageIndex === stageIndex
            );

            if (completedStageMilestones.length === stageMilestones.length) {
                enrollment.progress.completedStages.push({
                    stageIndex,
                    completedAt: new Date()
                });
            }
        }

        // Update current position
        if (progressData.currentPosition) {
            enrollment.progress.currentStage = progressData.currentPosition.stageIndex;
            enrollment.progress.currentMilestone = progressData.currentPosition.milestoneIndex;
        }

        // Update metrics
        await enrollment.updateProgress();

        // Check if learning path is completed
        if (enrollment.metrics.overallProgress === 100) {
            enrollment.status = 'completed';
            enrollment.timeline.completedAt = new Date();

            // Update learning path stats
            path.stats.completions += 1;
            path.stats.averageCompletionTime = LearningPathUtils.calculateAverageCompletionTime(
                path.stats.completions,
                path.stats.averageCompletionTime,
                enrollment.metrics.totalTimeSpent
            );
            await path.save();
        }

        await enrollment.save();
        return enrollment;
    }

    /**
     * Get User Progress
     */
    async getUserProgress(pathId, userId) {
        const enrollment = await Enrollment.findOne({
            learningPathId: pathId,
            userId
        }).populate('learningPathId');

        if (!enrollment) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Enrollment not found');
        }

        return {
            enrollment,
            nextMilestone: await this.getNextMilestone(enrollment),
            recommendations: await this.generateRecommendations(enrollment)
        };
    }

    /**
     * Get Learning Path Analytics
     */
    async getAnalytics(pathId) {
        const path = await LearningPath.findById(pathId);
        if (!path) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
        }

        const enrollments = await Enrollment.find({ learningPathId: pathId });
        
        return {
            overview: {
                totalEnrollments: path.stats.enrollments,
                completionRate: (path.stats.completions / path.stats.enrollments) * 100,
                averageRating: path.stats.averageRating,
                averageCompletionTime: path.stats.averageCompletionTime
            },
            stageAnalytics: await this.calculateStageAnalytics(path, enrollments),
            milestoneAnalytics: await this.calculateMilestoneAnalytics(path, enrollments),
            skillProgress: await this.calculateSkillProgress(path, enrollments),
            timeDistribution: LearningPathUtils.calculateTimeDistribution(enrollments)
        };
    }

    /**
     * Helper Methods
     */
    async checkPrerequisites(prerequisites, userId) {
        for (const prereq of prerequisites) {
            const met = await LearningPathUtils.checkPrerequisite(prereq, userId);
            if (!met) return false;
        }
        return true;
    }

    async getNextMilestone(enrollment) {
        const path = enrollment.learningPathId;
        const { currentStage, currentMilestone } = enrollment.progress;

        // If current stage is completed, move to next stage
        if (enrollment.progress.completedStages.find(s => s.stageIndex === currentStage)) {
            const nextStage = path.stages[currentStage + 1];
            if (!nextStage) return null; // Path completed
            return {
                stage: nextStage,
                milestone: nextStage.milestones[0]
            };
        }

        // Get next milestone in current stage
        const stage = path.stages[currentStage];
        const nextMilestone = stage.milestones[currentMilestone + 1];
        
        if (nextMilestone) {
            return {
                stage,
                milestone: nextMilestone
            };
        }

        // Move to next stage
        const nextStage = path.stages[currentStage + 1];
        if (!nextStage) return null; // Path completed
        
        return {
            stage: nextStage,
            milestone: nextStage.milestones[0]
        };
    }

    async generateRecommendations(enrollment) {
        const path = enrollment.learningPathId;
        const recommendations = [];

        // Check for struggling areas
        const strugglingSkills = enrollment.metrics.skillProgress.filter(
            skill => skill.progress < 70
        );

        for (const skill of strugglingSkills) {
            const relatedMilestones = this.findRelatedMilestones(path, skill.skillName);
            recommendations.push({
                type: 'skill_improvement',
                skill: skill.skillName,
                milestones: relatedMilestones
            });
        }

        // Check for time management
        const timeRecommendations = LearningPathUtils.generateTimeRecommendations(
            enrollment,
            path
        );
        recommendations.push(...timeRecommendations);

        return recommendations;
    }

    findRelatedMilestones(path, skillName) {
        const related = [];
        path.stages.forEach(stage => {
            stage.milestones.forEach(milestone => {
                if (milestone.skills.some(skill => skill.name === skillName)) {
                    related.push({
                        stageTitle: stage.title,
                        milestone
                    });
                }
            });
        });
        return related;
    }

    async calculateStageAnalytics(path, enrollments) {
        const stageAnalytics = path.stages.map((stage, index) => {
            const stageEnrollments = enrollments.filter(e =>
                e.progress.completedStages.some(s => s.stageIndex === index)
            );

            return {
                stageIndex: index,
                title: stage.title,
                completionRate: (stageEnrollments.length / enrollments.length) * 100,
                averageTime: LearningPathUtils.calculateAverageStageTime(stageEnrollments, index),
                dropoffRate: LearningPathUtils.calculateDropoffRate(enrollments, index)
            };
        });

        return stageAnalytics;
    }

    async calculateMilestoneAnalytics(path, enrollments) {
        const milestoneAnalytics = [];

        path.stages.forEach((stage, stageIndex) => {
            stage.milestones.forEach((milestone, milestoneIndex) => {
                const completions = enrollments.filter(e =>
                    e.progress.completedMilestones.some(
                        m => m.stageIndex === stageIndex && m.milestoneIndex === milestoneIndex
                    )
                );

                milestoneAnalytics.push({
                    stageIndex,
                    milestoneIndex,
                    title: milestone.title,
                    completionRate: (completions.length / enrollments.length) * 100,
                    averageScore: LearningPathUtils.calculateAverageMilestoneScore(
                        completions,
                        stageIndex,
                        milestoneIndex
                    ),
                    averageAttempts: LearningPathUtils.calculateAverageMilestoneAttempts(
                        completions,
                        stageIndex,
                        milestoneIndex
                    )
                });
            });
        });

        return milestoneAnalytics;
    }

    async calculateSkillProgress(path, enrollments) {
        const skillProgress = {};

        // Collect all unique skills
        path.stages.forEach(stage => {
            stage.milestones.forEach(milestone => {
                milestone.skills.forEach(skill => {
                    if (!skillProgress[skill.name]) {
                        skillProgress[skill.name] = {
                            name: skill.name,
                            averageProgress: 0,
                            levelDistribution: {
                                basic: 0,
                                intermediate: 0,
                                advanced: 0
                            }
                        };
                    }
                });
            });
        });

        // Calculate progress for each skill
        enrollments.forEach(enrollment => {
            enrollment.metrics.skillProgress.forEach(skill => {
                if (skillProgress[skill.skillName]) {
                    skillProgress[skill.skillName].averageProgress += skill.progress;
                    skillProgress[skill.skillName].levelDistribution[skill.currentLevel]++;
                }
            });
        });

        // Calculate averages
        Object.values(skillProgress).forEach(skill => {
            skill.averageProgress /= enrollments.length;
        });

        return Object.values(skillProgress);
    }
}

module.exports = new LearningPathService();
