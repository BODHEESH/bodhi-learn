const mongoose = require('mongoose');

// Common validators
const validators = {
    url: {
        validator: (v) => /^(http|https):\/\/[^ "]+$/.test(v),
        message: props => `${props.value} is not a valid URL!`
    },
    email: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: props => `${props.value} is not a valid email address!`
    },
    futureDate: {
        validator: (v) => v > new Date(),
        message: 'Date must be in the future!'
    },
    positiveNumber: {
        validator: (v) => v >= 0,
        message: 'Value must be non-negative!'
    },
    timeZone: {
        validator: (v) => Intl.supportedValuesOf('timeZone').includes(v),
        message: props => `${props.value} is not a valid timezone!`
    }
};

// Course validators
const courseValidators = {
    title: {
        validator: function(v) {
            return v.length >= 5 && v.length <= 200;
        },
        message: 'Course title must be between 5 and 200 characters!'
    },
    description: {
        validator: function(v) {
            return v.length >= 20 && v.length <= 5000;
        },
        message: 'Course description must be between 20 and 5000 characters!'
    },
    moduleOrder: {
        validator: function(modules) {
            const orders = modules.map(m => m.order);
            return new Set(orders).size === orders.length;
        },
        message: 'Module orders must be unique within a course!'
    },
    pricing: {
        validator: function(pricing) {
            if (!pricing.amount) return true;
            if (pricing.discounts) {
                return pricing.discounts.every(d => d.percentage > 0 && d.percentage <= 100);
            }
            return true;
        },
        message: 'Invalid pricing configuration!'
    },
    schedule: {
        validator: function(schedule) {
            if (!schedule) return true;
            if (schedule.startDate && schedule.endDate) {
                return schedule.endDate > schedule.startDate;
            }
            return true;
        },
        message: 'End date must be after start date!'
    }
};

// Content validators
const contentValidators = {
    content: {
        validator: function(content) {
            if (typeof content === 'string') {
                return content.length >= 10;
            }
            return true;
        },
        message: 'Content must be at least 10 characters long!'
    },
    tags: {
        validator: function(tags) {
            return tags.every(tag => tag.length >= 2 && tag.length <= 50);
        },
        message: 'Tags must be between 2 and 50 characters!'
    },
    media: {
        validator: function(media) {
            return media.every(m => {
                if (m.type === 'video') {
                    return m.duration && m.duration > 0;
                }
                return true;
            });
        },
        message: 'Invalid media configuration!'
    }
};

// Mentorship validators
const mentorshipValidators = {
    duration: {
        validator: function(duration) {
            if (!duration.start || !duration.end) return true;
            return duration.end > duration.start;
        },
        message: 'Mentorship end date must be after start date!'
    },
    goals: {
        validator: function(goals) {
            return goals.every(goal => {
                return goal.description && goal.description.length >= 10;
            });
        },
        message: 'Each goal must have a description of at least 10 characters!'
    },
    schedule: {
        validator: function(schedule) {
            if (!schedule.preferredTimes) return true;
            return schedule.preferredTimes.every(time => {
                const start = new Date(`1970-01-01T${time.startTime}`);
                const end = new Date(`1970-01-01T${time.endTime}`);
                return end > start;
            });
        },
        message: 'Invalid schedule configuration!'
    }
};

// Challenge validators
const challengeValidators = {
    goals: {
        validator: function(goals) {
            return goals.every(goal => {
                return goal.points > 0 && goal.description.length >= 10;
            });
        },
        message: 'Invalid goal configuration!'
    },
    duration: {
        validator: function(challenge) {
            return challenge.endDate > challenge.startDate;
        },
        message: 'Challenge end date must be after start date!'
    },
    rewards: {
        validator: function(rewards) {
            return rewards.xp > 0;
        },
        message: 'XP reward must be positive!'
    }
};

// Study session validators
const studySessionValidators = {
    duration: {
        validator: function(duration) {
            return duration >= 15 && duration <= 240;
        },
        message: 'Session duration must be between 15 and 240 minutes!'
    },
    participants: {
        validator: function(participants) {
            if (!this.maxParticipants) return true;
            return participants.length <= this.maxParticipants;
        },
        message: 'Cannot exceed maximum participants limit!'
    },
    schedule: {
        validator: function(scheduledDate) {
            return scheduledDate > new Date();
        },
        message: 'Session must be scheduled in the future!'
    }
};

module.exports = {
    validators,
    courseValidators,
    contentValidators,
    mentorshipValidators,
    challengeValidators,
    studySessionValidators
};
