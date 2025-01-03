// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\tests\services\academic-program.service.test.js

const { expect } = require('chai');
const sinon = require('sinon');
const { v4: uuidv4 } = require('uuid');

const academicProgramService = require('../../src/services/academic-program.service');
const AcademicProgram = require('../../src/models/academic-program.model');
const ProgramLearningReference = require('../../src/models/program-learning-reference.model');
const learningManagementService = require('../../src/integrations/learning-management.service');
const { NotFoundError } = require('../../src/utils/errors/custom-error');

describe('Academic Program Service', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createProgram', () => {
    it('should create a program and sync with LMS', async () => {
      const programData = {
        name: 'Computer Science',
        code: 'CS-001',
        level: 'undergraduate',
        duration: 48,
        totalCredits: 120,
        organizationId: uuidv4(),
        departmentId: uuidv4()
      };

      const createdProgram = {
        id: uuidv4(),
        ...programData
      };

      const lmsProgram = {
        id: uuidv4(),
        organizationProgramId: createdProgram.id
      };

      sandbox.stub(AcademicProgram, 'create').resolves(createdProgram);
      sandbox.stub(learningManagementService, 'createProgram').resolves(lmsProgram);
      sandbox.stub(createdProgram, 'update').resolves(createdProgram);

      const result = await academicProgramService.createProgram(programData);

      expect(result).to.deep.equal(createdProgram);
      expect(AcademicProgram.create.calledOnce).to.be.true;
      expect(learningManagementService.createProgram.calledOnce).to.be.true;
      expect(createdProgram.update.calledOnce).to.be.true;
    });
  });

  describe('getProgram', () => {
    it('should return program with learning references', async () => {
      const programId = uuidv4();
      const program = {
        id: programId,
        name: 'Computer Science',
        learningReferences: []
      };

      sandbox.stub(AcademicProgram, 'findByPk').resolves(program);

      const result = await academicProgramService.getProgram(programId);

      expect(result).to.deep.equal(program);
      expect(AcademicProgram.findByPk.calledOnce).to.be.true;
    });

    it('should throw NotFoundError if program does not exist', async () => {
      const programId = uuidv4();
      sandbox.stub(AcademicProgram, 'findByPk').resolves(null);

      try {
        await academicProgramService.getProgram(programId);
        expect.fail('Should throw NotFoundError');
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
      }
    });
  });

  describe('updateProgram', () => {
    it('should update program and sync with LMS', async () => {
      const programId = uuidv4();
      const updateData = {
        name: 'Updated Computer Science',
        status: 'active'
      };

      const program = {
        id: programId,
        learningManagementId: uuidv4(),
        update: sandbox.stub().resolves({ id: programId, ...updateData })
      };

      sandbox.stub(academicProgramService, 'getProgram').resolves(program);
      sandbox.stub(learningManagementService, 'updateProgram').resolves();

      const result = await academicProgramService.updateProgram(programId, updateData);

      expect(result.name).to.equal(updateData.name);
      expect(academicProgramService.getProgram.calledOnce).to.be.true;
      expect(program.update.calledOnce).to.be.true;
      expect(learningManagementService.updateProgram.calledOnce).to.be.true;
    });
  });

  describe('deleteProgram', () => {
    it('should delete program and sync with LMS', async () => {
      const programId = uuidv4();
      const program = {
        id: programId,
        learningManagementId: uuidv4(),
        destroy: sandbox.stub().resolves()
      };

      sandbox.stub(academicProgramService, 'getProgram').resolves(program);
      sandbox.stub(learningManagementService, 'deleteProgram').resolves();

      const result = await academicProgramService.deleteProgram(programId);

      expect(result).to.be.true;
      expect(academicProgramService.getProgram.calledOnce).to.be.true;
      expect(program.destroy.calledOnce).to.be.true;
      expect(learningManagementService.deleteProgram.calledOnce).to.be.true;
    });
  });

  describe('addLearningReference', () => {
    it('should add learning reference to program', async () => {
      const programId = uuidv4();
      const referenceData = {
        courseId: uuidv4(),
        curriculumId: uuidv4(),
        type: 'course'
      };

      const program = {
        id: programId
      };

      const reference = {
        id: uuidv4(),
        programId,
        ...referenceData
      };

      sandbox.stub(academicProgramService, 'getProgram').resolves(program);
      sandbox.stub(ProgramLearningReference, 'create').resolves(reference);

      const result = await academicProgramService.addLearningReference(programId, referenceData);

      expect(result).to.deep.equal(reference);
      expect(academicProgramService.getProgram.calledOnce).to.be.true;
      expect(ProgramLearningReference.create.calledOnce).to.be.true;
    });
  });
});
