<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inspection extends Model
{
    protected $fillable = [
        'job_card_id', 'odometer', 'fuel_level', 
        'exterior_status', 'interior_status', 'tyres_status', 'battery_status',
        'lights_status', 'brakes_status', 'suspension_status', 'engine_status', 
        'notes', 'pdf_path'
    ];

    public function jobCard(): BelongsTo
    {
        return $this->belongsTo(JobCard::class, 'job_card_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(InspectionPhoto::class, 'inspection_id');
    }
}
