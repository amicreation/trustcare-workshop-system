<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\InspectionPhoto;
use App\Models\JobCard;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class InspectionController extends Controller
{
    public function show($id)
    {
        $inspection = Inspection::with('photos')->findOrFail($id);
        return response()->json($inspection);
    }

    public function store(Request $request)
    {
        $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'odometer' => 'required|integer',
            'fuel_level' => 'required|string',
            'exterior_status' => 'required|string|in:Good,Attention Required,Critical',
            'interior_status' => 'required|string|in:Good,Attention Required,Critical',
            'tyres_status' => 'required|string|in:Good,Attention Required,Critical',
            'battery_status' => 'required|string|in:Good,Attention Required,Critical',
            'lights_status' => 'required|string|in:Good,Attention Required,Critical',
            'brakes_status' => 'required|string|in:Good,Attention Required,Critical',
            'suspension_status' => 'required|string|in:Good,Attention Required,Critical',
            'engine_status' => 'required|string|in:Good,Attention Required,Critical',
            'notes' => 'nullable|string',
        ]);

        // Delete previous inspection if exists to keep it unique per job card
        Inspection::where('job_card_id', $request->job_card_id)->delete();

        $inspection = Inspection::create($request->all());

        ActivityLogger::log('Inspection Created', "Inspection logged for Job Card ID: {$request->job_card_id}.");

        return response()->json($inspection, 201);
    }

    public function uploadPhoto(Request $request, $id)
    {
        $inspection = Inspection::findOrFail($id);

        $request->validate([
            'photo' => 'required|image|max:10240', // 10MB Limit
            'view_type' => 'required|string|in:front,rear,left,right,damage',
            'description' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('inspections', 'public');
            
            $photo = InspectionPhoto::create([
                'inspection_id' => $inspection->id,
                'photo_path' => '/storage/' . $path,
                'view_type' => $request->view_type,
                'description' => $request->description,
            ]);

            return response()->json($photo, 201);
        }

        return response()->json(['error' => 'Photo upload failed.'], 400);
    }

    public function generatePDF($id)
    {
        $inspection = Inspection::with(['jobCard.customer', 'jobCard.vehicle', 'photos'])->findOrFail($id);
        
        $settingsRaw = \Illuminate\Support\Facades\DB::table('settings')->get();
        $settings = [];
        foreach ($settingsRaw as $row) {
            $settings[$row->key] = $row->value;
        }

        $logoData = '';
        if (!empty($settings['logo'])) {
            $logoData = $settings['logo'];
        } else {
            $logoPath = public_path('logo.png');
            if (file_exists($logoPath)) {
                $type = pathinfo($logoPath, PATHINFO_EXTENSION);
                $data = file_get_contents($logoPath);
                $logoData = 'data:image/' . $type . ';base64,' . base64_encode($data);
            }
        }

        $data = [
            'inspection' => $inspection,
            'jobCard' => $inspection->jobCard,
            'customer' => $inspection->jobCard->customer,
            'vehicle' => $inspection->jobCard->vehicle,
            'photos' => $inspection->photos,
            'settings' => $settings,
            'logo_data' => $logoData
        ];

        // Create PDF using dompdf
        $pdf = Pdf::loadView('pdf.inspection', $data);
        
        // Save PDF path
        $filename = "Inspection_" . $inspection->jobCard->job_card_no . ".pdf";
        $pdfPath = 'inspections/' . $filename;
        Storage::disk('public')->put($pdfPath, $pdf->output());

        $inspection->pdf_path = '/storage/' . $pdfPath;
        $inspection->save();

        return response()->json([
            'message' => 'PDF generated successfully.',
            'pdf_url' => $inspection->pdf_path
        ]);
    }
}
