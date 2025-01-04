const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Library Routes
 */
router.get('/library/books', authMiddleware, 'LibraryController.listBooks');
router.get('/library/books/:id', authMiddleware, 'LibraryController.getBook');
router.post('/library/books', authMiddleware, 'LibraryController.addBook');
router.put('/library/books/:id', authMiddleware, 'LibraryController.updateBook');
router.delete('/library/books/:id', authMiddleware, 'LibraryController.deleteBook');
router.post('/library/books/:id/borrow', authMiddleware, 'LibraryController.borrowBook');
router.post('/library/books/:id/return', authMiddleware, 'LibraryController.returnBook');
router.get('/library/borrowed', authMiddleware, 'LibraryController.getBorrowedBooks');

/**
 * Inventory Routes
 */
router.get('/inventory/items', authMiddleware, 'InventoryController.list');
router.get('/inventory/items/:id', authMiddleware, 'InventoryController.get');
router.post('/inventory/items', authMiddleware, 'InventoryController.create');
router.put('/inventory/items/:id', authMiddleware, 'InventoryController.update');
router.delete('/inventory/items/:id', authMiddleware, 'InventoryController.delete');
router.post('/inventory/items/:id/checkout', authMiddleware, 'InventoryController.checkout');
router.post('/inventory/items/:id/checkin', authMiddleware, 'InventoryController.checkin');
router.get('/inventory/stock-levels', authMiddleware, 'InventoryController.getStockLevels');

/**
 * Facilities Routes
 */
router.get('/facilities', authMiddleware, 'FacilityController.list');
router.get('/facilities/:id', authMiddleware, 'FacilityController.get');
router.post('/facilities', authMiddleware, 'FacilityController.create');
router.put('/facilities/:id', authMiddleware, 'FacilityController.update');
router.delete('/facilities/:id', authMiddleware, 'FacilityController.delete');
router.get('/facilities/:id/availability', authMiddleware, 'FacilityController.checkAvailability');
router.post('/facilities/:id/reserve', authMiddleware, 'FacilityController.reserve');

/**
 * Equipment Routes
 */
router.get('/equipment', authMiddleware, 'EquipmentController.list');
router.get('/equipment/:id', authMiddleware, 'EquipmentController.get');
router.post('/equipment', authMiddleware, 'EquipmentController.create');
router.put('/equipment/:id', authMiddleware, 'EquipmentController.update');
router.delete('/equipment/:id', authMiddleware, 'EquipmentController.delete');
router.post('/equipment/:id/assign', authMiddleware, 'EquipmentController.assign');
router.post('/equipment/:id/maintain', authMiddleware, 'EquipmentController.scheduleMaintenance');

/**
 * Room Booking Routes
 */
router.get('/rooms', authMiddleware, 'RoomController.list');
router.get('/rooms/:id', authMiddleware, 'RoomController.get');
router.post('/rooms', authMiddleware, 'RoomController.create');
router.put('/rooms/:id', authMiddleware, 'RoomController.update');
router.delete('/rooms/:id', authMiddleware, 'RoomController.delete');
router.get('/rooms/:id/schedule', authMiddleware, 'RoomController.getSchedule');
router.post('/rooms/:id/book', authMiddleware, 'RoomController.book');
router.post('/rooms/:id/cancel', authMiddleware, 'RoomController.cancelBooking');

/**
 * Maintenance Routes
 */
router.get('/maintenance/requests', authMiddleware, 'MaintenanceController.listRequests');
router.get('/maintenance/requests/:id', authMiddleware, 'MaintenanceController.getRequest');
router.post('/maintenance/requests', authMiddleware, 'MaintenanceController.createRequest');
router.put('/maintenance/requests/:id', authMiddleware, 'MaintenanceController.updateRequest');
router.post('/maintenance/requests/:id/complete', authMiddleware, 'MaintenanceController.completeRequest');
router.get('/maintenance/schedule', authMiddleware, 'MaintenanceController.getSchedule');
router.post('/maintenance/schedule', authMiddleware, 'MaintenanceController.scheduleTask');

module.exports = router;
