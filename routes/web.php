<?php

// Webhook Auto-Deployment Trigger Comment

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/deploy/migrate/{secret}', function ($secret) {
    $expectedSecret = env('DEPLOY_SECRET');
    
    if (empty($expectedSecret) || $secret !== $expectedSecret) {
        abort(403, 'Unauthorized deployment secret.');
    }

    try {
        Artisan::call('migrate', ['--force' => true]);
        $output = Artisan::output();
        return "<pre>Migrations ran successfully:\n\n" . e($output) . "</pre>";
    } catch (\Exception $e) {
        return response("<pre>Error running migrations:\n\n" . e($e->getMessage()) . "</pre>", 500);
    }
});

Route::fallback(function () {
    return view('welcome');
});
