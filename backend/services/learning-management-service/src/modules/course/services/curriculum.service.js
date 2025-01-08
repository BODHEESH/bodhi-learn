const { Curriculum } = require('../models/curriculum.model');
const { Course } = require('../models/course.model');
const { ERROR_MESSAGES } = require('../constants/curriculum.constants');
const ApiError = require('../../../utils/ApiError');
const { getPagination } = require('../../../utils/pagination');

class CurriculumService {
    /**
     * Create curriculum
     * @param {Object} curriculumData
     * @returns {Promise<Curriculum>}
     */
    async createCurriculum(curriculumData) {
        // Check if course exists
        const course = await Course.findOne({
            _id: curriculumData.course,
            organizationId: curriculumData.organizationId,
            tenantId: curriculumData.tenantId
        });

        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        // Check if curriculum already exists for this course
        const existingCurriculum = await Curriculum.findOne({
            course: curriculumData.course,
            organizationId: curriculumData.organizationId,
            tenantId: curriculumData.tenantId
        });

        if (existingCurriculum) {
            throw new ApiError(400, ERROR_MESSAGES.CURRICULUM_EXISTS);
        }

        // Create curriculum
        const curriculum = new Curriculum(curriculumData);
        return curriculum.save();
    }

    /**
     * Get curriculum by ID
     * @param {string} curriculumId
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async getCurriculumById(curriculumId, organizationId, tenantId) {
        const curriculum = await Curriculum.findOne({
            _id: curriculumId,
            organizationId,
            tenantId
        }).populate('course', 'title');

        if (!curriculum) {
            throw new ApiError(404, ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
        }

        return curriculum;
    }

    /**
     * Update curriculum
     * @param {string} curriculumId
     * @param {Object} updateData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async updateCurriculum(curriculumId, updateData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        Object.assign(curriculum, updateData);
        return curriculum.save();
    }

    /**
     * Delete curriculum
     * @param {string} curriculumId
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async deleteCurriculum(curriculumId, organizationId, tenantId) {
        const curriculum = await Curriculum.findOneAndDelete({
            _id: curriculumId,
            organizationId,
            tenantId
        });

        if (!curriculum) {
            throw new ApiError(404, ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
        }

        return curriculum;
    }

    /**
     * Add section to curriculum
     * @param {string} curriculumId
     * @param {Object} sectionData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async addSection(curriculumId, sectionData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);

        // Check for duplicate section title
        const duplicateSection = curriculum.sections.find(
            section => section.title === sectionData.title
        );

        if (duplicateSection) {
            throw new ApiError(400, ERROR_MESSAGES.DUPLICATE_SECTION_TITLE);
        }

        // Add section
        curriculum.sections.push(sectionData);
        return curriculum.save();
    }

    /**
     * Update section
     * @param {string} curriculumId
     * @param {string} sectionId
     * @param {Object} updateData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async updateSection(curriculumId, sectionId, updateData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        const section = curriculum.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, ERROR_MESSAGES.SECTION_NOT_FOUND);
        }

        // Check for duplicate title if title is being updated
        if (updateData.title && updateData.title !== section.title) {
            const duplicateSection = curriculum.sections.find(
                s => s.title === updateData.title && s._id.toString() !== sectionId
            );

            if (duplicateSection) {
                throw new ApiError(400, ERROR_MESSAGES.DUPLICATE_SECTION_TITLE);
            }
        }

        Object.assign(section, updateData);
        return curriculum.save();
    }

    /**
     * Delete section
     * @param {string} curriculumId
     * @param {string} sectionId
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async deleteSection(curriculumId, sectionId, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        const section = curriculum.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, ERROR_MESSAGES.SECTION_NOT_FOUND);
        }

        section.remove();
        return curriculum.save();
    }

    /**
     * Add item to section
     * @param {string} curriculumId
     * @param {string} sectionId
     * @param {Object} itemData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async addItem(curriculumId, sectionId, itemData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        const section = curriculum.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, ERROR_MESSAGES.SECTION_NOT_FOUND);
        }

        // Check for duplicate item title in section
        const duplicateItem = section.items.find(
            item => item.title === itemData.title
        );

        if (duplicateItem) {
            throw new ApiError(400, ERROR_MESSAGES.DUPLICATE_ITEM_TITLE);
        }

        // Add item
        section.items.push(itemData);
        return curriculum.save();
    }

    /**
     * Update item
     * @param {string} curriculumId
     * @param {string} sectionId
     * @param {string} itemId
     * @param {Object} updateData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async updateItem(curriculumId, sectionId, itemId, updateData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        const section = curriculum.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, ERROR_MESSAGES.SECTION_NOT_FOUND);
        }

        const item = section.items.id(itemId);
        if (!item) {
            throw new ApiError(404, ERROR_MESSAGES.ITEM_NOT_FOUND);
        }

        // Check for duplicate title if title is being updated
        if (updateData.title && updateData.title !== item.title) {
            const duplicateItem = section.items.find(
                i => i.title === updateData.title && i._id.toString() !== itemId
            );

            if (duplicateItem) {
                throw new ApiError(400, ERROR_MESSAGES.DUPLICATE_ITEM_TITLE);
            }
        }

        Object.assign(item, updateData);
        return curriculum.save();
    }

    /**
     * Delete item
     * @param {string} curriculumId
     * @param {string} sectionId
     * @param {string} itemId
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async deleteItem(curriculumId, sectionId, itemId, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        const section = curriculum.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, ERROR_MESSAGES.SECTION_NOT_FOUND);
        }

        const item = section.items.id(itemId);
        if (!item) {
            throw new ApiError(404, ERROR_MESSAGES.ITEM_NOT_FOUND);
        }

        item.remove();
        return curriculum.save();
    }

    /**
     * Reorder sections
     * @param {string} curriculumId
     * @param {Array} orderData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async reorderSections(curriculumId, orderData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        // Update section orders
        orderData.forEach(({ sectionId, order }) => {
            const section = curriculum.sections.id(sectionId);
            if (section) {
                section.order = order;
            }
        });

        return curriculum.save();
    }

    /**
     * Reorder items within a section
     * @param {string} curriculumId
     * @param {string} sectionId
     * @param {Array} orderData
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async reorderItems(curriculumId, sectionId, orderData, organizationId, tenantId) {
        const curriculum = await this.getCurriculumById(curriculumId, organizationId, tenantId);
        
        const section = curriculum.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, ERROR_MESSAGES.SECTION_NOT_FOUND);
        }

        // Update item orders
        orderData.forEach(({ itemId, order }) => {
            const item = section.items.id(itemId);
            if (item) {
                item.order = order;
            }
        });

        return curriculum.save();
    }

    /**
     * Get curriculum by course ID
     * @param {string} courseId
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<Curriculum>}
     */
    async getCurriculumByCourse(courseId, organizationId, tenantId) {
        const curriculum = await Curriculum.findOne({
            course: courseId,
            organizationId,
            tenantId
        }).populate('course', 'title');

        if (!curriculum) {
            throw new ApiError(404, ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
        }

        return curriculum;
    }
}

module.exports = new CurriculumService();
