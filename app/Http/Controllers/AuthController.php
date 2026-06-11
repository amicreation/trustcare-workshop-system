<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized. Only administrators can register new users.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|unique:users|max:255',
            'email' => 'nullable|string|email|unique:users|max:255',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,advisor,manager',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        ActivityLogger::log('User Registered', "User {$request->user()->username} registered a new user {$user->username} as {$user->role}.");

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
        ], 201);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Current password does not match.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        ActivityLogger::log('Password Changed', "User {$user->username} changed their password.");

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function getUsers(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized. Only administrators can view user list.'], 403);
        }

        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid username or password.'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLogger::log('User Login', "User {$user->username} logged in successfully.");

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->tokens()->delete();
            ActivityLogger::log('User Logout', "User {$user->username} logged out.");
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
