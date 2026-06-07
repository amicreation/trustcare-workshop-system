<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardUpdate;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;

class JobCardUpdateController extends Controller
{
    public function getUpdates($jobCardId)
    {
        $updates = JobCardUpdate::where('job_card_id', $jobCardId)->orderBy('created_at', 'desc')->get();
        return response()->json($updates);
    }

    public function addUpdate(Request $request, $jobCardId)
    {
        $jobCard = JobCard::findOrFail($jobCardId);

        $request->validate([
            'mechanic_name' => 'nullable|string|max:255',
            'performed_work' => 'required|string',
            'parts_used' => 'nullable|array',
            'labour_hours' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
            'work_completed' => 'nullable|boolean',
            'test_drive_done' => 'nullable|boolean',
            'quality_check_done' => 'nullable|boolean',
        ]);

        $update = JobCardUpdate::create(array_merge($request->all(), [
            'job_card_id' => $jobCard->id
        ]));

        if ($update->work_completed && $update->test_drive_done && $update->quality_check_done) {
            $jobCard->status = 'Completed';
            if (!$jobCard->timeline_completed_at) {
                $jobCard->timeline_completed_at = now();
            }
            $jobCard->save();

            ActivityLogger::log('Job Card Status Changed', "Job Card {$jobCard->job_card_no} set to Completed by mechanic checklist.");
        }

        ActivityLogger::log('Job Card Mechanic Log Added', "Mechanic log added to Job Card {$jobCard->job_card_no}.");

        return response()->json($update, 201);
    }
}
