<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mobile')->unique();
            $table->string('alternate_mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('address_1')->nullable();
            $table->string('address_2')->nullable();
            $table->string('city')->default('AHMEDABAD');
            $table->string('state')->nullable();
            $table->string('pin')->nullable();
            $table->string('gst')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 2. Vehicles
        Schema::create('vehicles', function (Blueprint $table) {
            $table->string('registration_no')->primary();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('cascade');
            $table->string('make');
            $table->string('model');
            $table->integer('year')->nullable();
            $table->string('fuel_type')->nullable();
            $table->string('engine_no')->nullable();
            $table->string('chassis_no')->nullable();
            $table->string('color')->nullable();
            $table->string('insurance_company')->nullable();
            $table->string('policy_number')->nullable();
            $table->date('policy_expiry')->nullable();
            $table->integer('current_km')->default(0);
            $table->timestamps();
        });

        // 3. Inventory Categories
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 4. Inventory Items
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->foreignId('category_id')->constrained('inventory_categories')->onDelete('restrict');
            $table->string('unit');
            $table->decimal('purchase_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('gst_percent', 5, 2);
            $table->integer('current_stock')->default(0);
            $table->integer('minimum_stock')->default(5);
            $table->timestamps();
        });

        // 5. Inventory Transactions
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('inventory_items')->onDelete('cascade');
            $table->integer('quantity');
            $table->enum('transaction_type', ['stock_in', 'stock_out', 'adjustment']);
            $table->foreignId('user_id')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 6. Job Cards
        Schema::create('job_cards', function (Blueprint $table) {
            $table->id();
            $table->string('job_card_no')->unique();
            $table->date('date');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('vehicle_reg_no')->nullable();
            $table->foreign('vehicle_reg_no')->references('registration_no')->on('vehicles')->onDelete('set null');
            $table->integer('km_reading');
            $table->string('fuel_level');
            $table->text('complaints'); // JSON or serialized text list
            $table->text('inspection_notes')->nullable();
            $table->enum('status', ['Open', 'Inspection', 'In Progress', 'Waiting Parts', 'Completed', 'Delivered'])->default('Open');
            $table->timestamp('timeline_created_at')->nullable();
            $table->timestamp('timeline_assigned_at')->nullable();
            $table->timestamp('timeline_started_at')->nullable();
            $table->timestamp('timeline_completed_at')->nullable();
            $table->timestamp('timeline_delivered_at')->nullable();
            $table->timestamps();
        });

        // 7. Job Card Updates (Mechanic Updates)
        Schema::create('job_card_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained('job_cards')->onDelete('cascade');
            $table->string('mechanic_name')->nullable();
            $table->text('performed_work');
            $table->json('parts_used')->nullable(); // JSON list of parts used
            $table->decimal('labour_hours', 5, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->boolean('work_completed')->default(false);
            $table->boolean('test_drive_done')->default(false);
            $table->boolean('quality_check_done')->default(false);
            $table->timestamps();
        });

        // 8. Inspections
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->nullable()->constrained('job_cards')->onDelete('set null');
            $table->integer('odometer');
            $table->string('fuel_level');
            $table->enum('exterior_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('interior_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('tyres_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('battery_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('lights_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('brakes_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('suspension_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->enum('engine_status', ['Good', 'Attention Required', 'Critical'])->default('Good');
            $table->text('notes')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });

        // 9. Inspection Photos
        Schema::create('inspection_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->onDelete('cascade');
            $table->string('photo_path');
            $table->enum('view_type', ['front', 'rear', 'left', 'right', 'damage']);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 10. Invoice Headers
        Schema::create('invoice_headers', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->date('date');
            $table->date('inward_date')->nullable();
            $table->string('service_type')->default('General Service');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('vehicle_reg_no')->nullable();
            $table->foreign('vehicle_reg_no')->references('registration_no')->on('vehicles')->onDelete('set null');
            $table->integer('km_reading');
            $table->decimal('parts_total', 10, 2)->default(0);
            $table->decimal('labour_total', 10, 2)->default(0);
            $table->decimal('gst_total', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2)->default(0);
            $table->enum('payment_status', ['Pending', 'Partially Paid', 'Paid'])->default('Pending');
            $table->string('payment_mode')->default('Cash');
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance_due', 10, 2)->default(0);
            $table->string('residence')->nullable();
            $table->text('notes')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });

        // 11. Invoice Items
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_header_id')->constrained('invoice_headers')->onDelete('cascade');
            $table->enum('type', ['Part', 'Labour', 'Service']);
            $table->string('description');
            $table->integer('qty');
            $table->decimal('rate', 10, 2);
            $table->decimal('cost', 10, 2)->default(0);
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        // 12. Settings
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // 13. Activity Logs
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action');
            $table->text('description');
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoice_headers');
        Schema::dropIfExists('inspection_photos');
        Schema::dropIfExists('inspections');
        Schema::dropIfExists('job_card_updates');
        Schema::dropIfExists('job_cards');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_categories');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('customers');
    }
};
