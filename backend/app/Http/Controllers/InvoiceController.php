<?php

namespace App\Http\Controllers;

use App\Models\InvoiceHeader;
use App\Models\InvoiceItem;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Vehicle;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    private function generateInvoiceNumber()
    {
        $year = date('Y');
        $prefix = "TCW-{$year}-";

        $count = InvoiceHeader::where('invoice_no', 'like', "{$prefix}%")->count();
        $next = $count + 1;
        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $range = $request->query('range'); // today, week, month, custom
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = InvoiceHeader::with(['customer', 'vehicle']);

        if ($search) {
            $searchClean = strtoupper(str_replace(' ', '', $search));
            $query->where(function($q) use ($search, $searchClean) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhere('vehicle_reg_no', 'like', "%{$searchClean}%")
                  ->orWhere('vehicle_reg_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($c) use ($search) {
                      $c->where('name', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%");
                  });
            });
        }

        if ($status) {
            $query->where('payment_status', $status);
        }

        if ($range === 'today') {
            $query->whereDate('date', date('Y-m-d'));
        } elseif ($range === 'week') {
            $query->whereBetween('date', [now()->startOfWeek()->toDateString(), now()->endOfWeek()->toDateString()]);
        } elseif ($range === 'month') {
            $query->whereMonth('date', date('m'))->whereYear('date', date('Y'));
        } elseif ($range === 'custom' && $startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        }

        return response()->json($query->orderBy('date', 'desc')->orderBy('invoice_no', 'desc')->get());
    }

    public function show($id)
    {
        $invoice = InvoiceHeader::with(['customer', 'vehicle', 'items'])->findOrFail($id);
        return response()->json($invoice);
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
            'inward_date' => 'nullable|date',
            'service_type' => 'required|string',
            'customer_id' => 'required|exists:customers,id',
            'vehicle_reg_no' => 'required|exists:vehicles,registration_no',
            'km_reading' => 'required|integer|min:0',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|string|in:Part,Labour,Service',
            'items.*.description' => 'required|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.rate' => 'required|numeric|min:0',
            'items.*.cost' => 'nullable|numeric|min:0',
            'items.*.tax_percent' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|string|in:Pending,Partially Paid,Paid',
            'payment_mode' => 'nullable|string',
            'paid_amount' => 'nullable|numeric|min:0',
            'residence' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Auto update vehicle km if reading is higher
            $vehicle = Vehicle::where('registration_no', $request->vehicle_reg_no)->first();
            if ($vehicle && $request->km_reading > $vehicle->current_km) {
                $vehicle->current_km = $request->km_reading;
                $vehicle->save();
            }

            // Calculations
            $partsTotal = 0;
            $labourTotal = 0;
            $gstTotal = 0;

            foreach ($request->items as $item) {
                $base = $item['qty'] * $item['rate'];
                $tax = ($base * $item['tax_percent']) / 100;
                $gstTotal += $tax;

                if ($item['type'] === 'Part') {
                    $partsTotal += $base;
                } else {
                    $labourTotal += $base;
                }
            }

            $discount = $request->discount ?? 0;
            $grandTotal = $partsTotal + $labourTotal + $gstTotal - $discount;

            $paidAmount = $request->paid_amount ?? 0;
            $balanceDue = $grandTotal - $paidAmount;

            $paymentStatus = 'Pending';
            if ($balanceDue <= 0) {
                $paymentStatus = 'Paid';
                $balanceDue = 0;
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'Partially Paid';
            }

            $invoiceNo = $this->generateInvoiceNumber();

            $header = InvoiceHeader::create([
                'invoice_no' => $invoiceNo,
                'date' => $request->date,
                'inward_date' => $request->inward_date ?? $request->date,
                'service_type' => $request->service_type,
                'customer_id' => $request->customer_id,
                'vehicle_reg_no' => $request->vehicle_reg_no,
                'km_reading' => $request->km_reading,
                'parts_total' => $partsTotal,
                'labour_total' => $labourTotal,
                'gst_total' => $gstTotal,
                'discount' => $discount,
                'grand_total' => $grandTotal,
                'payment_status' => $paymentStatus,
                'payment_mode' => $request->payment_mode ?? 'Cash',
                'paid_amount' => $paidAmount,
                'balance_due' => $balanceDue,
                'residence' => $request->residence,
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                $base = $item['qty'] * $item['rate'];
                $tax = ($base * $item['tax_percent']) / 100;
                $amount = $base + $tax;

                InvoiceItem::create([
                    'invoice_header_id' => $header->id,
                    'type' => $item['type'],
                    'description' => $item['description'],
                    'qty' => $item['qty'],
                    'rate' => $item['rate'],
                    'cost' => $item['cost'] ?? 0,
                    'tax_percent' => $item['tax_percent'],
                    'amount' => $amount
                ]);

                // Auto inventory stock deduction for Parts matched by description
                if ($item['type'] === 'Part') {
                    $invItem = InventoryItem::where('name', $item['description'])->first();
                    if ($invItem && $invItem->current_stock >= $item['qty']) {
                        $invItem->current_stock -= $item['qty'];
                        $invItem->save();

                        InventoryTransaction::create([
                            'item_id' => $invItem->id,
                            'quantity' => -$item['qty'],
                            'transaction_type' => 'stock_out',
                            'user_id' => Auth::id(),
                            'notes' => "Deducted via Invoice: {$invoiceNo}"
                        ]);
                    }
                }
            }

            DB::commit();

            ActivityLogger::log('Invoice Generated', "Invoice {$invoiceNo} generated for vehicle {$header->vehicle_reg_no}. Amount: ₹{$grandTotal}.");

            return response()->json($header->load('items'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function recordPayment(Request $request, $id)
    {
        $invoice = InvoiceHeader::findOrFail($id);

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_mode' => 'required|string',
        ]);

        $amount = floatval($request->amount);

        if ($amount > $invoice->balance_due) {
            return response()->json(['error' => 'Payment amount exceeds balance due.'], 400);
        }

        $invoice->paid_amount += $amount;
        $invoice->balance_due -= $amount;

        if ($invoice->balance_due <= 0) {
            $invoice->payment_status = 'Paid';
            $invoice->balance_due = 0;
        } else {
            $invoice->payment_status = 'Partially Paid';
        }

        $invoice->payment_mode = $request->payment_mode;
        $invoice->save();

        ActivityLogger::log('Payment Logged', "Payment of ₹{$amount} recorded for Invoice {$invoice->invoice_no}.");

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'invoice' => $invoice
        ]);
    }

    public function generatePDF($id)
    {
        $invoice = InvoiceHeader::with(['customer', 'vehicle', 'items'])->findOrFail($id);
        
        $settingsRaw = DB::table('settings')->get();
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
            'invoice' => $invoice,
            'customer' => $invoice->customer,
            'vehicle' => $invoice->vehicle,
            'items' => $invoice->items,
            'settings' => $settings,
            'logo_data' => $logoData
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data);

        $filename = $invoice->invoice_no . "_" . str_replace(' ', '', $invoice->vehicle_reg_no) . ".pdf";
        $pdfPath = 'invoices/' . $filename;
        Storage::disk('public')->put($pdfPath, $pdf->output());

        $invoice->pdf_path = '/storage/' . $pdfPath;
        $invoice->save();

        return response()->json([
            'message' => 'Invoice PDF generated successfully.',
            'pdf_url' => $invoice->pdf_path
        ]);
    }

    public function update(Request $request, $id)
    {
        $invoice = InvoiceHeader::with('items')->findOrFail($id);

        if ($request->has('vehicle_reg_no')) {
            $request->merge([
                'vehicle_reg_no' => strtoupper(str_replace(' ', '', $request->vehicle_reg_no))
            ]);
        }

        $request->validate([
            'date' => 'required|date',
            'inward_date' => 'nullable|date',
            'service_type' => 'required|string',
            'customer_id' => 'required|exists:customers,id',
            'vehicle_reg_no' => 'required|exists:vehicles,registration_no',
            'km_reading' => 'required|integer|min:0',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|string|in:Part,Labour,Service',
            'items.*.description' => 'required|string',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.rate' => 'required|numeric|min:0',
            'items.*.cost' => 'nullable|numeric|min:0',
            'items.*.tax_percent' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|string|in:Pending,Partially Paid,Paid',
            'payment_mode' => 'nullable|string',
            'paid_amount' => 'nullable|numeric|min:0',
            'residence' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Restore previous inventory stocks
            foreach ($invoice->items as $item) {
                if ($item->type === 'Part') {
                    $invItem = InventoryItem::where('name', $item->description)->first();
                    if ($invItem) {
                        $invItem->current_stock += $item->qty;
                        $invItem->save();
                    }
                }
            }

            // Remove old stock out transactions associated with this invoice
            InventoryTransaction::where('notes', 'like', "%Invoice: {$invoice->invoice_no}%")->delete();

            // Auto update vehicle km if reading is higher
            $vehicle = Vehicle::where('registration_no', $request->vehicle_reg_no)->first();
            if ($vehicle && $request->km_reading > $vehicle->current_km) {
                $vehicle->current_km = $request->km_reading;
                $vehicle->save();
            }

            // Calculations
            $partsTotal = 0;
            $labourTotal = 0;
            $gstTotal = 0;

            foreach ($request->items as $item) {
                $base = $item['qty'] * $item['rate'];
                $tax = ($base * $item['tax_percent']) / 100;
                $gstTotal += $tax;

                if ($item['type'] === 'Part') {
                    $partsTotal += $base;
                } else {
                    $labourTotal += $base;
                }
            }

            $discount = $request->discount ?? 0;
            $grandTotal = $partsTotal + $labourTotal + $gstTotal - $discount;

            $paidAmount = $request->paid_amount ?? 0;
            $balanceDue = $grandTotal - $paidAmount;

            $paymentStatus = 'Pending';
            if ($balanceDue <= 0) {
                $paymentStatus = 'Paid';
                $balanceDue = 0;
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'Partially Paid';
            }

            // Update header
            $invoice->update([
                'date' => $request->date,
                'inward_date' => $request->inward_date ?? $request->date,
                'service_type' => $request->service_type,
                'customer_id' => $request->customer_id,
                'vehicle_reg_no' => $request->vehicle_reg_no,
                'km_reading' => $request->km_reading,
                'parts_total' => $partsTotal,
                'labour_total' => $labourTotal,
                'gst_total' => $gstTotal,
                'discount' => $discount,
                'grand_total' => $grandTotal,
                'payment_status' => $paymentStatus,
                'payment_mode' => $request->payment_mode ?? 'Cash',
                'paid_amount' => $paidAmount,
                'balance_due' => $balanceDue,
                'residence' => $request->residence,
                'notes' => $request->notes,
            ]);

            // Delete existing invoice items
            $invoice->items()->delete();

            // Insert new items and deduct stock
            foreach ($request->items as $item) {
                $base = $item['qty'] * $item['rate'];
                $tax = ($base * $item['tax_percent']) / 100;
                $amount = $base + $tax;

                InvoiceItem::create([
                    'invoice_header_id' => $invoice->id,
                    'type' => $item['type'],
                    'description' => $item['description'],
                    'qty' => $item['qty'],
                    'rate' => $item['rate'],
                    'cost' => $item['cost'] ?? 0,
                    'tax_percent' => $item['tax_percent'],
                    'amount' => $amount
                ]);

                if ($item['type'] === 'Part') {
                    $invItem = InventoryItem::where('name', $item['description'])->first();
                    if ($invItem) {
                        $invItem->current_stock -= $item['qty'];
                        $invItem->save();

                        InventoryTransaction::create([
                            'item_id' => $invItem->id,
                            'quantity' => -$item['qty'],
                            'transaction_type' => 'stock_out',
                            'user_id' => Auth::id(),
                            'notes' => "Deducted via Invoice: {$invoice->invoice_no}"
                        ]);
                    }
                }
            }

            DB::commit();

            ActivityLogger::log('Invoice Updated', "Invoice {$invoice->invoice_no} was updated.");

            // Regenerate PDF automatically
            $this->generatePDF($invoice->id);

            return response()->json($invoice->load('items'), 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $invoice = InvoiceHeader::findOrFail($id);
        $no = $invoice->invoice_no;
        $invoice->delete();

        ActivityLogger::log('Invoice Deleted', "Invoice {$no} was deleted.");

        return response()->json(['message' => 'Invoice deleted successfully.']);
    }
}
