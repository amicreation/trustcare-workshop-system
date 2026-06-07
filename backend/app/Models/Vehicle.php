<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $primaryKey = 'registration_no';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'registration_no', 'customer_id', 'make', 'model', 'year', 'fuel_type',
        'engine_no', 'chassis_no', 'color', 'insurance_company', 'policy_number', 'policy_expiry', 'current_km'
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function jobCards(): HasMany
    {
        return $this->hasMany(JobCard::class, 'vehicle_reg_no', 'registration_no');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(InvoiceHeader::class, 'vehicle_reg_no', 'registration_no');
    }

    protected static function booted()
    {
        static::saving(function ($vehicle) {
            if ($vehicle->registration_no) {
                $vehicle->registration_no = strtoupper(str_replace(' ', '', $vehicle->registration_no));
            }
        });
    }
}
