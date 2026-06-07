<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobCardUpdate extends Model
{
    protected $fillable = [
        'job_card_id', 'mechanic_name', 'performed_work', 'parts_used', 'labour_hours', 'remarks',
        'work_completed', 'test_drive_done', 'quality_check_done'
    ];

    protected $casts = [
        'parts_used' => 'array',
        'work_completed' => 'boolean',
        'test_drive_done' => 'boolean',
        'quality_check_done' => 'boolean'
    ];

    public function jobCard(): BelongsTo
    {
        return $this->belongsTo(JobCard::class, 'job_card_id');
    }
}
