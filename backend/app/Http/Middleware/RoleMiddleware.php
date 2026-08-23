<?php

namespace App\Http\Middleware;
use Illuminate\Support\Facades\Auth;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập'
            ], 401);
        }

        $userRole = Auth::user()->vai_tro;
        
        // =====================================================================
        // PHÂN QUYỀN 3 CẤP:
        //   Admin      → 'admin'   (toàn quyền quản trị)
        //   Le_Tan     → 'staff'   (lễ tân: phòng, checkin/out, đặt offline)
        //   Khach_Hang → 'customer' (khách đặt phòng trực tuyến)
        // =====================================================================
        $roleMap = [
            'Admin'      => 'admin',
            'Le_Tan'     => 'staff',
            'Khach_Hang' => 'customer'
        ];
        
        $userRoleForUI = $roleMap[$userRole] ?? 'customer';
        
        if (!in_array($userRoleForUI, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập'
            ], 403);
        }

        return $next($request);
    }
}