<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceHeader extends Model
{
    protected $fillable = [
        'invoice_no', 'date', 'inward_date', 'service_type', 'customer_id', 'vehicle_reg_no', 'km_reading',
        'parts_total', 'labour_total', 'gst_total', 'discount', 'grand_total',
        'payment_status', 'payment_mode', 'paid_amount', 'balance_due', 'residence', 'notes', 'pdf_path'
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_reg_no', 'registration_no');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_header_id');
    }

    protected static function booted()
    {
        static::saving(function ($invoice) {
            if ($invoice->vehicle_reg_no) {
                $invoice->vehicle_reg_no = strtoupper(str_replace(' ', '', $invoice->vehicle_reg_no));
            }
        });
    }
}
