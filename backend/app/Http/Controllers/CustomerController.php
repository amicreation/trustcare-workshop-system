<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Vehicle;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $query = Customer::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|unique:customers|max:255',
            'alternate_mobile' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'address_1' => 'nullable|string|max:255',
            'address_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'pin' => 'nullable|string|max:255',
            'gst' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create($request->all());

        ActivityLogger::log('Customer Created', "Customer {$customer->name} was added to the database.");

        return response()->json($customer, 201);
    }

    public function show($id)
    {
        $customer = Customer::findOrFail($id);
        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|unique:customers,mobile,' . $id . '|max:255',
            'alternate_mobile' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'address_1' => 'nullable|string|max:255',
            'address_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'pin' => 'nullable|string|max:255',
            'gst' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $customer->update($request->all());

        ActivityLogger::log('Customer Updated', "Customer {$customer->name} was updated.");

        return response()->json($customer);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $name = $customer->name;
        $customer->delete();

        ActivityLogger::log('Customer Deleted', "Customer {$name} was deleted.");

        return response()->json(['message' => 'Customer deleted successfully.']);
    }

    public function lookup($mobile)
    {
        $customer = Customer::where('mobile', $mobile)->first();

        if (!$customer) {
            return response()->json(['error' => 'Customer not found.'], 404);
        }

        $vehicles = Vehicle::where('customer_id', $customer->id)->get();

        return response()->json([
            'customer' => $customer,
            'vehicles' => $vehicles
        ]);
    }

    public function history($id)
    {
        $customer = Customer::findOrFail($id);
        
        $jobCards = $customer->jobCards()->with('vehicle')->orderBy('date', 'desc')->get();
        $invoices = $customer->invoices()->with('vehicle')->orderBy('date', 'desc')->get();

        return response()->json([
            'customer' => $customer,
            'job_cards' => $jobCards,
            'invoices' => $invoices
        ]);
    }
}
