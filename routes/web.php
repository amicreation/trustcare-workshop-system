<?php

// Webhook Auto-Deployment Trigger Comment

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/deploy/clear-cache', function () {
    try {
        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('view:clear');
        Artisan::call('route:clear');
        return "<pre>Caches cleared successfully:\n\n" . e(Artisan::output()) . "</pre>";
    } catch (\Exception $e) {
        return "Error clearing cache: " . $e->getMessage();
    }
});

Route::get('/deploy/debug-env', function () {
    return response()->json([
        'APP_ENV' => env('APP_ENV'),
        'DEPLOY_SECRET_EXISTS' => !empty(env('DEPLOY_SECRET')),
        'DEPLOY_SECRET_VAL' => env('DEPLOY_SECRET'),
        'DB_CONNECTION' => env('DB_CONNECTION'),
        'env_file_exists' => file_exists(base_path('.env')),
        'env_file_readable' => is_readable(base_path('.env')),
    ]);
});

Route::get('/deploy/migrate/{secret}', function ($secret) {
    $expectedSecret = env('DEPLOY_SECRET');
    
    if (empty($expectedSecret) || $secret !== $expectedSecret) {
        abort(403, 'Unauthorized deployment secret.');
    }

    try {
        Artisan::call('migrate', ['--force' => true]);
        $output = Artisan::output();

        try {
            Artisan::call('storage:link');
            $output .= "\n" . Artisan::output();
        } catch (\Exception $e) {
            // Ignore if link already exists or fails
            $output .= "\nStorage link step: " . $e->getMessage();
        }

        return "<pre>Migrations ran successfully:\n\n" . e($output) . "</pre>";
    } catch (\Exception $e) {
        return response("<pre>Error running migrations:\n\n" . e($e->getMessage()) . "</pre>", 500);
    }
});

Route::fallback(function () {
    return view('welcome');
});
