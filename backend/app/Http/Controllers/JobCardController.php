<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;

class JobCardController extends Controller
{
    private function generateJobCardNumber()
    {
        $year = date('Y');
        $prefix = "JC-{$year}-";
        
        $count = JobCard::where('job_card_no', 'like', "{$prefix}%")->count();
        $next = $count + 1;
        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $query = JobCard::with(['customer', 'vehicle']);

        if ($search) {
            $searchClean = strtoupper(str_replace(' ', '', $search));
            $query->where(function($q) use ($search, $searchClean) {
                $q->where('job_card_no', 'like', "%{$search}%")
                  ->orWhere('vehicle_reg_no', 'like', "%{$searchClean}%")
                  ->orWhere('vehicle_reg_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($c) use ($search) {
                      $c->where('name', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%");
                  });
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        return response()->json($query->orderBy('date', 'desc')->orderBy('job_card_no', 'desc')->get());
    }

    public function store(Request $request)
    {
        if ($request->has('vehicle_reg_no')) {
            $request->merge([
                'vehicle_reg_no' => strtoupper(str_replace(' ', '', $request->vehicle_reg_no))
            ]);
        }

        $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'vehicle_reg_no' => 'required|exists:vehicles,registration_no',
            'km_reading' => 'required|integer|min:0',
            'fuel_level' => 'required|string',
            'complaints' => 'required|array',
            'inspection_notes' => 'nullable|string',
            'status' => 'nullable|string|in:Open,Inspection,In Progress,Waiting Parts,Completed,Delivered'
        ]);

        // Auto update vehicle km if reading is higher
        $vehicle = Vehicle::where('registration_no', $request->vehicle_reg_no)->first();
        if ($vehicle && $request->km_reading > $vehicle->current_km) {
            $vehicle->current_km = $request->km_reading;
            $vehicle->save();
        }

        $data = $request->all();
        $data['job_card_no'] = $this->generateJobCardNumber();
        $data['timeline_created_at'] = now();
        
        $status = $request->status ?? 'Open';
        if ($status === 'In Progress') {
            $data['timeline_started_at'] = now();
        } elseif ($status === 'Completed') {
            $data['timeline_completed_at'] = now();
        } elseif ($status === 'Delivered') {
            $data['timeline_delivered_at'] = now();
        }

        $jobCard = JobCard::create($data);

        ActivityLogger::log('Job Card Created', "Job Card {$jobCard->job_card_no} was created for vehicle {$jobCard->vehicle_reg_no}.");

        return response()->json($jobCard, 201);
    }

    public function show($id)
    {
        $jobCard = JobCard::with(['customer', 'vehicle', 'inspection.photos', 'updates'])->findOrFail($id);
        return response()->json($jobCard);
    }

    public function update(Request $request, $id)
    {
        $jobCard = JobCard::findOrFail($id);

        if ($request->has('vehicle_reg_no')) {
            $request->merge([
                'vehicle_reg_no' => strtoupper(str_replace(' ', '', $request->vehicle_reg_no))
            ]);
        }

        $request->validate([
            'date' => 'nullable|date',
            'customer_id' => 'nullable|exists:customers,id',
            'vehicle_reg_no' => 'nullable|exists:vehicles,registration_no',
            'km_reading' => 'nullable|integer|min:0',
            'fuel_level' => 'nullable|string',
            'complaints' => 'nullable|array',
            'inspection_notes' => 'nullable|string',
            'status' => 'nullable|string|in:Open,Inspection,In Progress,Waiting Parts,Completed,Delivered'
        ]);

        $statusChanged = $request->status && $request->status !== $jobCard->status;
        $oldStatus = $jobCard->status;

        if ($request->km_reading) {
            $vehicle = Vehicle::where('registration_no', $jobCard->vehicle_reg_no)->first();
            if ($vehicle && $request->km_reading > $vehicle->current_km) {
                $vehicle->current_km = $request->km_reading;
                $vehicle->save();
            }
        }

        $jobCard->update($request->all());

        if ($statusChanged) {
            $newStatus = $request->status;
            if ($newStatus === 'In Progress' && !$jobCard->timeline_started_at) {
                $jobCard->timeline_started_at = now();
            } elseif ($newStatus === 'Completed' && !$jobCard->timeline_completed_at) {
                $jobCard->timeline_completed_at = now();
            } elseif ($newStatus === 'Delivered' && !$jobCard->timeline_delivered_at) {
                $jobCard->timeline_delivered_at = now();
            }
            $jobCard->save();

            ActivityLogger::log('Job Card Status Changed', "Job Card {$jobCard->job_card_no} status changed from {$oldStatus} to {$newStatus}.");
        }

        return response()->json($jobCard);
    }

    public function destroy($id)
    {
        $jobCard = JobCard::findOrFail($id);
        $no = $jobCard->job_card_no;
        $jobCard->delete();

        ActivityLogger::log('Job Card Deleted', "Job Card {$no} was deleted.");

        return response()->json(['message' => 'Job Card deleted successfully.']);
    }
}
