// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\tests\services\academic-calendar.service.test.js

const { expect } = require('chai');
const sinon = require('sinon');
const { v4: uuidv4 } = require('uuid');

const academicCalendarService = require('../../src/services/academic-calendar.service');
const AcademicCalendar = require('../../src/models/academic-calendar.model');
const AcademicTerm = require('../../src/models/academic-term.model');
const AcademicEvent = require('../../src/models/academic-event.model');
const learningManagementService = require('../../src/integrations/learning-management.service');
const { NotFoundError } = require('../../src/utils/errors/custom-error');

describe('Academic Calendar Service', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createCalendar', () => {
    it('should create a calendar successfully', async () => {
      const calendarData = {
        name: 'Academic Year 2025-2026',
        academicYear: '2025-2026',
        startDate: '2025-08-01',
        endDate: '2026-07-31',
        organizationId: uuidv4()
      };

      const createdCalendar = {
        id: uuidv4(),
        ...calendarData
      };

      sandbox.stub(AcademicCalendar, 'create').resolves(createdCalendar);

      const result = await academicCalendarService.createCalendar(calendarData);

      expect(result).to.deep.equal(createdCalendar);
      expect(AcademicCalendar.create.calledOnce).to.be.true;
    });
  });

  describe('addTerm', () => {
    it('should add term to calendar', async () => {
      const calendarId = uuidv4();
      const termData = {
        name: 'Fall 2025',
        code: 'F25',
        startDate: '2025-08-01',
        endDate: '2025-12-20',
        type: 'semester',
        sequence: 1
      };

      const calendar = {
        id: calendarId,
        startDate: '2025-08-01',
        endDate: '2026-07-31'
      };

      const createdTerm = {
        id: uuidv4(),
        calendarId,
        ...termData
      };

      sandbox.stub(academicCalendarService, 'getCalendar').resolves(calendar);
      sandbox.stub(AcademicTerm, 'create').resolves(createdTerm);

      const result = await academicCalendarService.addTerm(calendarId, termData);

      expect(result).to.deep.equal(createdTerm);
      expect(academicCalendarService.getCalendar.calledOnce).to.be.true;
      expect(AcademicTerm.create.calledOnce).to.be.true;
    });

    it('should validate term dates within calendar period', async () => {
      const calendarId = uuidv4();
      const termData = {
        startDate: '2025-01-01', // Before calendar start
        endDate: '2025-05-31'
      };

      const calendar = {
        id: calendarId,
        startDate: '2025-08-01',
        endDate: '2026-07-31'
      };

      sandbox.stub(academicCalendarService, 'getCalendar').resolves(calendar);

      try {
        await academicCalendarService.addTerm(calendarId, termData);
        expect.fail('Should throw ValidationError');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('addEvent', () => {
    it('should add event to calendar', async () => {
      const calendarId = uuidv4();
      const eventData = {
        title: 'Orientation Day',
        startDate: '2025-08-15T09:00:00Z',
        endDate: '2025-08-15T17:00:00Z',
        type: 'academic'
      };

      const calendar = {
        id: calendarId,
        startDate: '2025-08-01',
        endDate: '2026-07-31'
      };

      const createdEvent = {
        id: uuidv4(),
        calendarId,
        ...eventData
      };

      sandbox.stub(academicCalendarService, 'getCalendar').resolves(calendar);
      sandbox.stub(AcademicEvent, 'create').resolves(createdEvent);
      sandbox.stub(learningManagementService, 'syncCalendarEvents').resolves({ syncedCount: 1 });

      const result = await academicCalendarService.addEvent(calendarId, eventData);

      expect(result).to.deep.equal(createdEvent);
      expect(academicCalendarService.getCalendar.calledOnce).to.be.true;
      expect(AcademicEvent.create.calledOnce).to.be.true;
      expect(learningManagementService.syncCalendarEvents.calledOnce).to.be.true;
    });
  });

  describe('getCurrentTerm', () => {
    it('should return current term', async () => {
      const calendarId = uuidv4();
      const currentDate = new Date();
      
      const term = {
        id: uuidv4(),
        name: 'Fall 2025',
        startDate: '2025-08-01',
        endDate: '2025-12-20'
      };

      sandbox.stub(AcademicTerm, 'findOne').resolves(term);

      const result = await academicCalendarService.getCurrentTerm(calendarId);

      expect(result).to.deep.equal(term);
      expect(AcademicTerm.findOne.calledOnce).to.be.true;
    });

    it('should return null if no current term', async () => {
      const calendarId = uuidv4();
      
      sandbox.stub(AcademicTerm, 'findOne').resolves(null);

      const result = await academicCalendarService.getCurrentTerm(calendarId);

      expect(result).to.be.null;
      expect(AcademicTerm.findOne.calledOnce).to.be.true;
    });
  });

  describe('syncWithLMS', () => {
    it('should sync calendar events with LMS', async () => {
      const calendarId = uuidv4();
      const calendar = {
        id: calendarId,
        startDate: '2025-08-01',
        endDate: '2026-07-31',
        events: [
          {
            id: uuidv4(),
            title: 'Orientation Day'
          }
        ]
      };

      const learningActivities = [
        {
          id: uuidv4(),
          title: 'Course Start'
        }
      ];

      sandbox.stub(academicCalendarService, 'getCalendar').resolves(calendar);
      sandbox.stub(learningManagementService, 'getLearningActivities').resolves(learningActivities);
      sandbox.stub(learningManagementService, 'syncCalendarEvents').resolves({ syncedCount: 2 });

      const result = await academicCalendarService.syncWithLMS(calendarId);

      expect(result.syncedCount).to.equal(2);
      expect(academicCalendarService.getCalendar.calledOnce).to.be.true;
      expect(learningManagementService.getLearningActivities.calledOnce).to.be.true;
      expect(learningManagementService.syncCalendarEvents.calledOnce).to.be.true;
    });
  });
});
