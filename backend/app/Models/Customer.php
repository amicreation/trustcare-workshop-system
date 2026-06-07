<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name', 'mobile', 'alternate_mobile', 'email', 
        'address_1', 'address_2', 'city', 'state', 'pin', 'gst', 'notes'
    ];

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'customer_id');
    }

    public function jobCards(): HasMany
    {
        return $this->hasMany(JobCard::class, 'customer_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(InvoiceHeader::class, 'customer_id');
    }
}
