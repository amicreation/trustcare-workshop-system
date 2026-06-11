<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\JobCardController;
use App\Http\Controllers\JobCardUpdateController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;

// Public Auth Routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected REST API Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Profile & Management
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/settings/users', [AuthController::class, 'getUsers']);

    // Customers CRUD & Helpers
    Route::get('/customers/lookup/{mobile}', [CustomerController::class, 'lookup']);
    Route::get('/customers/{id}/history', [CustomerController::class, 'history']);
    Route::apiResource('customers', CustomerController::class);

    // Vehicles CRUD & Helpers
    Route::get('/vehicles/lookup/{registration_no}', [VehicleController::class, 'lookup']);
    Route::get('/vehicles/{registration_no}/history', [VehicleController::class, 'history']);
    Route::apiResource('vehicles', VehicleController::class)->parameters([
        'vehicles' => 'registration_no' // Tells Laravel key is registration_no instead of id
    ]);

    // Inventory Categories
    Route::get('/inventory/categories', [InventoryController::class, 'getCategories']);
    Route::post('/inventory/categories', [InventoryController::class, 'storeCategory']);
    Route::put('/inventory/categories/{id}', [InventoryController::class, 'updateCategory']);
    Route::delete('/inventory/categories/{id}', [InventoryController::class, 'destroyCategory']);

    // Inventory Items
    Route::get('/inventory/items', [InventoryController::class, 'getItems']);
    Route::post('/inventory/items', [InventoryController::class, 'storeItem']);
    Route::put('/inventory/items/{id}', [InventoryController::class, 'updateItem']);
    Route::delete('/inventory/items/{id}', [InventoryController::class, 'destroyItem']);

    // Inventory Transactions
    Route::post('/inventory/transactions', [InventoryController::class, 'logTransaction']);
    Route::get('/inventory/transactions/log', [InventoryController::class, 'getTransactionsLog']);

    // Job Cards CRUD
    Route::apiResource('jobcards', JobCardController::class);

    // Job Card Mechanic Updates
    Route::get('/jobcards/{id}/updates', [JobCardUpdateController::class, 'getUpdates']);
    Route::post('/jobcards/{id}/updates', [JobCardUpdateController::class, 'addUpdate']);

    // Vehicle Inspection Sheet & Photo Uploads
    Route::post('/inspections', [InspectionController::class, 'store']);
    Route::get('/inspections/{id}', [InspectionController::class, 'show']);
    Route::post('/inspections/{id}/photo', [InspectionController::class, 'uploadPhoto']);
    Route::get('/inspections/{id}/pdf', [InspectionController::class, 'generatePDF']);

    // Invoice Builder & Payments
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('/invoices/{id}/payment', [InvoiceController::class, 'recordPayment']);
    Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'generatePDF']);

    // Workshop Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'store']);

    // Dashboard Stats
    Route::get('/dashboard', [DashboardController::class, 'getStats']);

    // Analytical Reports
    Route::get('/reports/sales', [ReportController::class, 'getSalesReport']);
    Route::get('/reports/inventory', [ReportController::class, 'getInventoryReport']);
    Route::get('/reports/jobcards', [ReportController::class, 'getJobCardReport']);
    Route::get('/reports/customers', [ReportController::class, 'getCustomerReport']);
});
