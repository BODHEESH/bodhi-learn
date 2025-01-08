const EventEmitter = require('events');
const logger = require('../config/logger');
const notificationClient = require('./notificationClient');

class CourseWorkflowManager extends EventEmitter {
    constructor() {
        super();
        this.stages = {
            PLANNING: 'planning',
            DEVELOPMENT: 'development',
            REVIEW: 'review',
            PUBLISHED: 'published'
        };

        this.transitions = {
            [this.stages.PLANNING]: [this.stages.DEVELOPMENT],
            [this.stages.DEVELOPMENT]: [this.stages.REVIEW, this.stages.PLANNING],
            [this.stages.REVIEW]: [this.stages.PUBLISHED, this.stages.DEVELOPMENT],
            [this.stages.PUBLISHED]: [this.stages.DEVELOPMENT]
        };

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Handle stage transitions
        this.on('stageTransition', async (data) => {
            await this.handleStageTransition(data);
        });

        // Handle workflow completion
        this.on('workflowComplete', async (data) => {
            await this.handleWorkflowCompletion(data);
        });
    }

    /**
     * Validate stage transition
     */
    validateTransition(fromStage, toStage) {
        const allowedTransitions = this.transitions[fromStage] || [];
        return allowedTransitions.includes(toStage);
    }

    /**
     * Get stage requirements
     */
    getStageRequirements(stage) {
        const requirements = {
            [this.stages.PLANNING]: [
                { type: 'field', name: 'title', required: true },
                { type: 'field', name: 'description', required: true },
                { type: 'field', name: 'objectives', required: true },
                { type: 'field', name: 'targetAudience', required: true }
            ],
            [this.stages.DEVELOPMENT]: [
                { type: 'field', name: 'content', required: true },
                { type: 'field', name: 'resources', required: true },
                { type: 'field', name: 'assessments', required: false }
            ],
            [this.stages.REVIEW]: [
                { type: 'approval', role: 'reviewer', required: true },
                { type: 'checklist', name: 'contentQuality', required: true },
                { type: 'checklist', name: 'technicalQuality', required: true }
            ],
            [this.stages.PUBLISHED]: [
                { type: 'approval', role: 'admin', required: true },
                { type: 'field', name: 'publishDate', required: true }
            ]
        };

        return requirements[stage] || [];
    }

    /**
     * Check if stage requirements are met
     */
    async checkStageRequirements(course, stage) {
        const requirements = this.getStageRequirements(stage);
        const unmetRequirements = [];

        for (const req of requirements) {
            if (req.required) {
                switch (req.type) {
                    case 'field':
                        if (!course[req.name]) {
                            unmetRequirements.push(`Missing required field: ${req.name}`);
                        }
                        break;
                    case 'approval':
                        const hasApproval = await this.checkApproval(course, req.role);
                        if (!hasApproval) {
                            unmetRequirements.push(`Missing approval from: ${req.role}`);
                        }
                        break;
                    case 'checklist':
                        const isComplete = await this.checkChecklist(course, req.name);
                        if (!isComplete) {
                            unmetRequirements.push(`Incomplete checklist: ${req.name}`);
                        }
                        break;
                }
            }
        }

        return {
            met: unmetRequirements.length === 0,
            unmetRequirements
        };
    }

    /**
     * Handle stage transition
     */
    async handleStageTransition(data) {
        const { course, fromStage, toStage, userId } = data;

        try {
            // Validate transition
            if (!this.validateTransition(fromStage, toStage)) {
                throw new Error(`Invalid transition from ${fromStage} to ${toStage}`);
            }

            // Check requirements
            const { met, unmetRequirements } = await this.checkStageRequirements(course, toStage);
            if (!met) {
                throw new Error(`Stage requirements not met: ${unmetRequirements.join(', ')}`);
            }

            // Update workflow stage
            await this.updateWorkflowStage(course, toStage, userId);

            // Notify relevant users
            await this.notifyStageTransition(course, fromStage, toStage);

            // Emit completion event if published
            if (toStage === this.stages.PUBLISHED) {
                this.emit('workflowComplete', { course });
            }
        } catch (error) {
            logger.error('Stage transition error:', error);
            throw error;
        }
    }

    /**
     * Handle workflow completion
     */
    async handleWorkflowCompletion(data) {
        const { course } = data;

        try {
            // Perform completion tasks
            await Promise.all([
                this.updateCourseStatus(course),
                this.notifyWorkflowCompletion(course),
                this.generateCompletionReport(course)
            ]);
        } catch (error) {
            logger.error('Workflow completion error:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    async updateWorkflowStage(course, stage, userId) {
        course.workflow.currentStage = stage;
        course.workflow.stages.push({
            name: stage,
            status: 'inProgress',
            assignedTo: userId,
            startDate: new Date()
        });
        await course.save();
    }

    async notifyStageTransition(course, fromStage, toStage) {
        await notificationClient.sendNotification({
            type: 'COURSE_STAGE_TRANSITION',
            title: `Course Stage Updated: ${course.title}`,
            description: `Course moved from ${fromStage} to ${toStage}`,
            recipients: this.getStageRecipients(course, toStage),
            data: { courseId: course._id, fromStage, toStage }
        });
    }

    async notifyWorkflowCompletion(course) {
        await notificationClient.sendNotification({
            type: 'COURSE_WORKFLOW_COMPLETE',
            title: `Course Workflow Completed: ${course.title}`,
            description: 'Course has been published successfully',
            recipients: this.getWorkflowRecipients(course),
            data: { courseId: course._id }
        });
    }

    getStageRecipients(course, stage) {
        const recipients = new Set([...course.instructors]);

        switch (stage) {
            case this.stages.REVIEW:
                // Add reviewers
                break;
            case this.stages.PUBLISHED:
                // Add administrators
                break;
        }

        return Array.from(recipients);
    }

    getWorkflowRecipients(course) {
        return [
            ...course.instructors,
            ...this.getAdministrators(),
            ...this.getStakeholders(course)
        ];
    }

    async generateCompletionReport(course) {
        // Implementation for generating completion report
        return {
            courseId: course._id,
            title: course.title,
            completionDate: new Date(),
            workflowDuration: this.calculateWorkflowDuration(course),
            stageMetrics: this.calculateStageMetrics(course),
            qualityMetrics: await this.calculateQualityMetrics(course)
        };
    }

    calculateWorkflowDuration(course) {
        const start = course.createdAt;
        const end = new Date();
        return end - start;
    }

    calculateStageMetrics(course) {
        return course.workflow.stages.map(stage => ({
            name: stage.name,
            duration: stage.endDate ? stage.endDate - stage.startDate : null,
            iterations: this.countStageIterations(course, stage.name)
        }));
    }

    async calculateQualityMetrics(course) {
        // Implementation for calculating quality metrics
        return {
            contentCompleteness: 0,
            technicalQuality: 0,
            reviewScore: 0
        };
    }

    countStageIterations(course, stageName) {
        return course.workflow.stages.filter(s => s.name === stageName).length;
    }
}

module.exports = new CourseWorkflowManager();
