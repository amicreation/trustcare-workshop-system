<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_header_id', 'type', 'description', 'qty', 'rate', 'cost', 'tax_percent', 'amount'
    ];

    public function header(): BelongsTo
    {
        return $this->belongsTo(InvoiceHeader::class, 'invoice_header_id');
    }
}
