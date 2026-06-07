<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\InvoiceHeader;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats()
    {
        $today = date('Y-m-d');
        $startOfMonth = date('Y-m-01');

        $totalVehiclesToday = JobCard::whereDate('date', $today)->count();
        $openJobCards = JobCard::whereIn('status', ['Open', 'Inspection', 'In Progress', 'Waiting Parts'])->count();
        $completedJobs = JobCard::where('status', 'Completed')->count();
        
        $inventoryAlerts = InventoryItem::whereColumn('current_stock', '<=', 'minimum_stock')->count();
        $pendingDeliveries = JobCard::where('status', 'Completed')->count();

        $dailyRevenue = InvoiceHeader::whereDate('date', $today)->sum('grand_total');
        $monthlyRevenue = InvoiceHeader::whereDate('date', '>=', $startOfMonth)->sum('grand_total');

        $statusDistribution = JobCard::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $statuses = ['Open', 'Inspection', 'In Progress', 'Waiting Parts', 'Completed', 'Delivered'];
        $formattedDistribution = [];
        foreach ($statuses as $status) {
            $formattedDistribution[$status] = $statusDistribution[$status] ?? 0;
        }

        $trends = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $displayDate = date('j M', strtotime("-{$i} days"));

            $rev = InvoiceHeader::whereDate('date', $date)->sum('grand_total');
            $veh = JobCard::whereDate('date', $date)->count();

            $trends[] = [
                'date' => $date,
                'label' => $displayDate,
                'revenue' => floatval($rev),
                'vehicles' => intval($veh)
            ];
        }

        return response()->json([
            'stats' => [
                'total_vehicles_today' => $totalVehiclesToday,
                'open_job_cards' => $openJobCards,
                'completed_jobs' => $completedJobs,
                'inventory_alerts' => $inventoryAlerts,
                'pending_deliveries' => $pendingDeliveries,
                'daily_revenue' => floatval($dailyRevenue),
                'monthly_revenue' => floatval($monthlyRevenue)
            ],
            'status_distribution' => $formattedDistribution,
            'trends' => $trends
        ]);
    }
}
