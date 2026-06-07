<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'workshop_name' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'mobile' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'gst' => 'nullable|string|max:255',
            'terms' => 'nullable|string',
            'logo' => 'nullable|string', // Base64 or URL
            'invoice_prefix' => 'nullable|string',
            'jobcard_prefix' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->all() as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value ?? '']
                );
            }
            DB::commit();
            
            ActivityLogger::log('Settings Updated', 'Workshop settings updated successfully.');

            $settings = Setting::all()->pluck('value', 'key');
            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => $settings
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
