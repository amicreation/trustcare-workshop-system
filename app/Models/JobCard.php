<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JobCard extends Model
{
    protected $fillable = [
        'job_card_no', 'date', 'customer_id', 'vehicle_reg_no', 'km_reading', 'fuel_level',
        'complaints', 'inspection_notes', 'status', 
        'timeline_created_at', 'timeline_assigned_at', 'timeline_started_at', 'timeline_completed_at', 'timeline_delivered_at'
    ];

    protected $casts = [
        'complaints' => 'array',
        'timeline_created_at' => 'datetime',
        'timeline_assigned_at' => 'datetime',
        'timeline_started_at' => 'datetime',
        'timeline_completed_at' => 'datetime',
        'timeline_delivered_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_reg_no', 'registration_no');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(JobCardUpdate::class, 'job_card_id');
    }

    public function inspection(): HasOne
    {
        return $this->hasOne(Inspection::class, 'job_card_id');
    }

    protected static function booted()
    {
        static::saving(function ($jobCard) {
            if ($jobCard->vehicle_reg_no) {
                $jobCard->vehicle_reg_no = strtoupper(str_replace(' ', '', $jobCard->vehicle_reg_no));
            }
        });
    }
}
