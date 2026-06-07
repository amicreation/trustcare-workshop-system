<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users
        DB::table('users')->insert([
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@trustcare.com',
                'role' => 'admin',
                'password' => Hash::make('admin123'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Service Advisor',
                'username' => 'advisor',
                'email' => 'advisor@trustcare.com',
                'role' => 'advisor',
                'password' => Hash::make('advisor123'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Store Manager',
                'username' => 'manager',
                'email' => 'manager@trustcare.com',
                'role' => 'manager',
                'password' => Hash::make('manager123'),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 2. Seed Default Settings
        DB::table('settings')->insert([
            ['key' => 'workshop_name', 'value' => 'TRUST CARE WORKSHOP', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'tagline', 'value' => 'Driven by Trust, Powered by Skill', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'address', 'value' => 'Near Vaishnodevi Circle, Ahmedabad', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'mobile', 'value' => '8200695660 | 9512660711', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'email', 'value' => 'info@trustcare.com', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'gst', 'value' => '24AAAAT0000A1Z1', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'terms', 'value' => 'Payment required upon vehicle collection. Parts warranty subject to manufacturer terms. Labour warranty applicable only to covered repairs.', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'logo', 'value' => '', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'invoice_prefix', 'value' => 'TCW-', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'jobcard_prefix', 'value' => 'JC-', 'created_at' => now(), 'updated_at' => now()]
        ]);

        // 3. Seed Default Inventory Categories
        DB::table('inventory_categories')->insert([
            ['name' => 'Engine Oil', 'description' => 'Engine lubricants and synthetic oils', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Oil Filters', 'description' => 'Oil replacement filters', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Air Filters', 'description' => 'Engine and cabin air filters', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Brake Pads', 'description' => 'Front and rear brake pads', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Brake Oil', 'description' => 'Brake fluid', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Coolant', 'description' => 'Radiator coolants', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Batteries', 'description' => '12V vehicle batteries', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Spare Parts', 'description' => 'Mechanical spare parts and components', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Consumables', 'description' => 'Screws, zip ties, cleaning sprays, lubricants', 'created_at' => now(), 'updated_at' => now()]
        ]);
    }
}
