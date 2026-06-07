<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $query = Vehicle::with('customer');

        if ($search) {
            $searchClean = strtoupper(str_replace(' ', '', $search));
            $query->where('registration_no', 'like', "%{$searchClean}%")
                  ->orWhere('registration_no', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%");
                  });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        if ($request->has('registration_no')) {
            $request->merge([
                'registration_no' => strtoupper(str_replace(' ', '', $request->registration_no))
            ]);
        }

        $request->validate([
            'registration_no' => 'required|string|unique:vehicles,registration_no|max:255',
            'customer_id' => 'required|exists:customers,id',
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'year' => 'nullable|integer',
            'fuel_type' => 'nullable|string|max:255',
            'engine_no' => 'nullable|string|max:255',
            'chassis_no' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'insurance_company' => 'nullable|string|max:255',
            'policy_number' => 'nullable|string|max:255',
            'policy_expiry' => 'nullable|date',
            'current_km' => 'nullable|integer',
        ]);

        $vehicle = Vehicle::create($request->all());

        ActivityLogger::log('Vehicle Registered', "Vehicle {$vehicle->registration_no} was registered.");

        return response()->json($vehicle, 201);
    }

    public function show($registration_no)
    {
        $registration_no = strtoupper(str_replace(' ', '', $registration_no));
        $vehicle = Vehicle::with('customer')->where('registration_no', $registration_no)->firstOrFail();
        return response()->json($vehicle);
    }

    public function update(Request $request, $registration_no)
    {
        $registration_no = strtoupper(str_replace(' ', '', $registration_no));
        $vehicle = Vehicle::where('registration_no', $registration_no)->firstOrFail();

        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'year' => 'nullable|integer',
            'fuel_type' => 'nullable|string|max:255',
            'engine_no' => 'nullable|string|max:255',
            'chassis_no' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'insurance_company' => 'nullable|string|max:255',
            'policy_number' => 'nullable|string|max:255',
            'policy_expiry' => 'nullable|date',
            'current_km' => 'nullable|integer',
        ]);

        $vehicle->update($request->all());

        ActivityLogger::log('Vehicle Updated', "Vehicle {$vehicle->registration_no} details updated.");

        return response()->json($vehicle);
    }

    public function destroy($registration_no)
    {
        $registration_no = strtoupper(str_replace(' ', '', $registration_no));
        $vehicle = Vehicle::where('registration_no', $registration_no)->firstOrFail();
        $regNo = $vehicle->registration_no;
        $vehicle->delete();

        ActivityLogger::log('Vehicle Deleted', "Vehicle {$regNo} was deleted.");

        return response()->json(['message' => 'Vehicle deleted successfully.']);
    }

    public function lookup($registration_no)
    {
        $registration_no = strtoupper(str_replace(' ', '', $registration_no));
        $vehicle = Vehicle::with('customer')->where('registration_no', $registration_no)->first();

        if (!$vehicle) {
            return response()->json(['error' => 'Vehicle registration not found.'], 404);
        }

        return response()->json([
            'vehicle' => $vehicle,
            'customer_name' => $vehicle->customer ? $vehicle->customer->name : 'N/A',
            'customer_mobile' => $vehicle->customer ? $vehicle->customer->mobile : '',
            'customer_email' => $vehicle->customer ? $vehicle->customer->email : '',
            'address_1' => $vehicle->customer ? $vehicle->customer->address_1 : '',
            'city' => $vehicle->customer ? $vehicle->customer->city : 'AHMEDABAD',
        ]);
    }

    public function history($registration_no)
    {
        $registration_no = strtoupper(str_replace(' ', '', $registration_no));
        $vehicle = Vehicle::where('registration_no', $registration_no)->firstOrFail();

        $jobCards = $vehicle->jobCards()->with('customer')->orderBy('date', 'desc')->get();
        $invoices = $vehicle->invoices()->with('customer')->orderBy('date', 'desc')->get();

        return response()->json([
            'vehicle' => $vehicle,
            'job_cards' => $jobCards,
            'invoices' => $invoices
        ]);
    }
}
