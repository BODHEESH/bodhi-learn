// \d\DREAM\bodhi - learn\backend\models\mongodb\Class.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    studentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        required: true
    },
    note: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const classSchema = new Schema({
    institutionId: {
        type: String,
        required: true,
        index: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    section: String,
    academicYear: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    teachers: [{
        type: String, // User IDs
        required: true
    }],
    students: [{
        type: String, // User IDs
        required: true
    }],
    schedule: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String,
        endTime: String,
        room: String
    }],
    attendance: [attendanceSchema],
    assignments: [{
        title: String,
        description: String,
        dueDate: Date,
        totalMarks: Number,
        weight: Number
    }],
    evaluations: [{
        type: {
            type: String,
            enum: ['quiz', 'test', 'exam', 'project']
        },
        title: String,
        date: Date,
        totalMarks: Number,
        weight: Number
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    analytics: {
        averageAttendance: Number,
        averagePerformance: Number,
        lastUpdated: Date
    },
    metadata: {
        type: Map,
        of: Schema.Types.Mixed
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'classes'
});

// Indexes
classSchema.index({ institutionId: 1, courseId: 1, academicYear: 1, semester: 1 });
classSchema.index({ teachers: 1 });
classSchema.index({ students: 1 });
classSchema.index({ status: 1 });
classSchema.index({ isDeleted: 1 });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
