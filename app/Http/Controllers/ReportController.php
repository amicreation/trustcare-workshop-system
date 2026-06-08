<?php

namespace App\Http\Controllers;

use App\Models\InvoiceHeader;
use App\Models\InventoryItem;
use App\Models\JobCard;
use App\Models\Customer;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function applyDateFilter($query, $range, $startDate, $endDate, $column = 'date')
    {
        if ($range === 'today') {
            $query->whereDate($column, date('Y-m-d'));
        } elseif ($range === 'week') {
            $query->whereBetween($column, [now()->startOfWeek()->toDateString(), now()->endOfWeek()->toDateString()]);
        } elseif ($range === 'month') {
            $query->whereMonth($column, date('m'))->whereYear($column, date('Y'));
        } elseif ($range === 'custom' && $startDate && $endDate) {
            $query->whereBetween($column, [$startDate, $endDate]);
        }
        return $query;
    }

    public function getSalesReport(Request $request)
    {
        $range = $request->query('range', 'month');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = InvoiceHeader::with(['customer', 'vehicle']);
        $this->applyDateFilter($query, $range, $startDate, $endDate);

        $invoices = $query->orderBy('date', 'desc')->get();

        $summary = [
            'total_sales' => $invoices->sum('grand_total'),
            'total_paid' => $invoices->sum('paid_amount'),
            'total_balance' => $invoices->sum('balance_due'),
            'invoice_count' => $invoices->count()
        ];

        return response()->json([
            'invoices' => $invoices,
            'summary' => $summary
        ]);
    }

    public function getInventoryReport(Request $request)
    {
        $categoryId = $request->query('category_id');
        
        $query = InventoryItem::with('category');
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $items = $query->orderBy('name')->get();

        $summary = [
            'total_items' => $items->count(),
            'total_value_purchase' => $items->reduce(fn($carry, $item) => $carry + ($item->current_stock * $item->purchase_price), 0),
            'total_value_selling' => $items->reduce(fn($carry, $item) => $carry + ($item->current_stock * $item->selling_price), 0),
            'low_stock_items' => $items->filter(fn($item) => $item->current_stock <= $item->minimum_stock)->count()
        ];

        return response()->json([
            'items' => $items,
            'summary' => $summary
        ]);
    }

    public function getJobCardReport(Request $request)
    {
        $range = $request->query('range', 'month');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = JobCard::with(['customer', 'vehicle']);
        $this->applyDateFilter($query, $range, $startDate, $endDate);

        $jobCards = $query->orderBy('date', 'desc')->get();

        $summary = [
            'total_cards' => $jobCards->count(),
            'open_cards' => $jobCards->filter(fn($jc) => in_array($jc->status, ['Open', 'Inspection', 'In Progress', 'Waiting Parts']))->count(),
            'completed' => $jobCards->filter(fn($jc) => $jc->status === 'Completed')->count(),
            'delivered' => $jobCards->filter(fn($jc) => $jc->status === 'Delivered')->count()
        ];

        return response()->json([
            'job_cards' => $jobCards,
            'summary' => $summary
        ]);
    }

    public function getCustomerReport(Request $request)
    {
        $customers = Customer::withCount(['jobCards', 'invoices'])
            ->orderBy('invoices_count', 'desc')
            ->get();

        $summary = [
            'total_customers' => $customers->count(),
            'active_customers' => $customers->filter(fn($c) => $c->invoices_count > 0)->count(),
            'repeat_customers' => $customers->filter(fn($c) => $c->invoices_count > 1)->count()
        ];

        return response()->json([
            'customers' => $customers,
            'summary' => $summary
        ]);
    }
}
