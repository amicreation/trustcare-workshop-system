<?php

namespace App\Http\Controllers;

use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    // --- Categories ---
    public function getCategories()
    {
        return response()->json(InventoryCategory::orderBy('name')->get());
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:inventory_categories|max:255',
            'description' => 'nullable|string',
        ]);

        $category = InventoryCategory::create($request->all());

        ActivityLogger::log('Inventory Category Created', "Category {$category->name} was added.");

        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = InventoryCategory::findOrFail($id);
        $request->validate([
            'name' => 'required|string|unique:inventory_categories,name,' . $id . '|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($request->all());

        ActivityLogger::log('Inventory Category Updated', "Category {$category->name} was updated.");

        return response()->json($category);
    }

    public function destroyCategory($id)
    {
        $category = InventoryCategory::findOrFail($id);
        if ($category->items()->count() > 0) {
            return response()->json(['error' => 'Cannot delete category that contains items.'], 400);
        }
        $name = $category->name;
        $category->delete();

        ActivityLogger::log('Inventory Category Deleted', "Category {$name} was deleted.");

        return response()->json(['message' => 'Category deleted successfully.']);
    }

    // --- Items ---
    public function getItems(Request $request)
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id');
        $lowStock = $request->query('low_stock');

        $query = InventoryItem::with('category');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($lowStock === 'true') {
            $query->whereColumn('current_stock', '<=', 'minimum_stock');
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function storeItem(Request $request)
    {
        $request->validate([
            'sku' => 'required|string|unique:inventory_items|max:255',
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:inventory_categories,id',
            'unit' => 'required|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'gst_percent' => 'required|numeric|min:0',
            'current_stock' => 'nullable|integer|min:0',
            'minimum_stock' => 'nullable|integer|min:0',
        ]);

        $item = InventoryItem::create($request->all());

        // Create transaction log for initial stock
        if ($item->current_stock > 0) {
            InventoryTransaction::create([
                'item_id' => $item->id,
                'quantity' => $item->current_stock,
                'transaction_type' => 'stock_in',
                'user_id' => Auth::id(),
                'notes' => 'Initial stock addition'
            ]);
        }

        ActivityLogger::log('Inventory Item Created', "Item {$item->name} (SKU: {$item->sku}) was added.");

        return response()->json($item, 201);
    }

    public function updateItem(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $request->validate([
            'sku' => 'required|string|unique:inventory_items,sku,' . $id . '|max:255',
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:inventory_categories,id',
            'unit' => 'required|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'gst_percent' => 'required|numeric|min:0',
            'minimum_stock' => 'nullable|integer|min:0',
        ]);

        $item->update($request->all());

        ActivityLogger::log('Inventory Item Updated', "Item {$item->name} was updated.");

        return response()->json($item);
    }

    public function destroyItem($id)
    {
        $item = InventoryItem::findOrFail($id);
        $name = $item->name;
        $item->delete();

        ActivityLogger::log('Inventory Item Deleted', "Item {$name} was deleted.");

        return response()->json(['message' => 'Item deleted successfully.']);
    }

    // --- Stock Log Operations ---
    public function logTransaction(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'transaction_type' => 'required|string|in:stock_in,stock_out,adjustment',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::findOrFail($request->item_id);
        $qty = intval($request->quantity);

        if ($request->transaction_type === 'stock_in') {
            $item->current_stock += $qty;
        } elseif ($request->transaction_type === 'stock_out') {
            if ($item->current_stock < $qty) {
                return response()->json(['error' => 'Insufficient stock for this transaction.'], 400);
            }
            $item->current_stock -= $qty;
        } elseif ($request->transaction_type === 'adjustment') {
            $diff = $qty - $item->current_stock;
            $item->current_stock = $qty;
            $qty = $diff;
        }

        $item->save();

        $transaction = InventoryTransaction::create([
            'item_id' => $item->id,
            'quantity' => $qty,
            'transaction_type' => $request->transaction_type,
            'user_id' => Auth::id(),
            'notes' => $request->notes
        ]);

        ActivityLogger::log('Stock Transaction', "Item {$item->name} stock updated via {$request->transaction_type}. Quantity change: {$qty}. New Stock: {$item->current_stock}.");

        return response()->json([
            'message' => 'Stock updated successfully.',
            'item' => $item,
            'transaction' => $transaction
        ]);
    }

    public function getTransactionsLog(Request $request)
    {
        $limit = $request->query('limit', 50);
        $logs = InventoryTransaction::with(['item', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($logs);
    }
}
