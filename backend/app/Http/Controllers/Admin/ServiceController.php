<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DichVu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    public function index()
    {
        $services = DichVu::with('loaiPhong')->get();
        
        return response()->json($services->map(function($service) {
            return [
                'id' => $service->dich_vu_id,
                'name' => $service->ten_dich_vu,
                'type' => $service->loai_dich_vu,
                'price' => (float) $service->gia_mac_dinh,
                'description' => $service->mo_ta,
                'room_types' => $service->loaiPhong->map(function($lp) {
                    return [
                        'loai_phong_id' => $lp->loai_phong_id,
                        'ten_loai_phong' => $lp->ten_loai_phong,
                        'included' => (bool) $lp->pivot->included
                    ];
                })
            ];
        }));
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100|unique:dich_vu,ten_dich_vu',
            'type' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'room_types' => 'nullable|array',
            'room_types.*.loai_phong_id' => 'required|integer|exists:loai_phong,loai_phong_id',
            'room_types.*.included' => 'nullable|boolean'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $service = DichVu::create([
            'ten_dich_vu' => $request->name,
            'loai_dich_vu' => $request->type,
            'gia_mac_dinh' => $request->price,
            'mo_ta' => $request->description,
        ]);

        if ($request->has('room_types')) {
            $syncData = [];
            foreach ($request->room_types as $rt) {
                $syncData[$rt['loai_phong_id']] = ['included' => !empty($rt['included']) ? 1 : 0];
            }
            $service->loaiPhong()->sync($syncData);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Thêm dịch vụ thành công',
            'data' => $service
        ]);
    }
    
    public function update(Request $request, $id)
    {
        $service = DichVu::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100|unique:dich_vu,ten_dich_vu,' . $id . ',dich_vu_id',
            'type' => 'nullable|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'room_types' => 'nullable|array',
            'room_types.*.loai_phong_id' => 'required|integer|exists:loai_phong,loai_phong_id',
            'room_types.*.included' => 'nullable|boolean'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $data = [];
        if ($request->has('name')) $data['ten_dich_vu'] = $request->name;
        if ($request->has('type')) $data['loai_dich_vu'] = $request->type;
        if ($request->has('price')) $data['gia_mac_dinh'] = $request->price;
        if ($request->has('description')) $data['mo_ta'] = $request->description;
        
        $service->update($data);

        if ($request->has('room_types')) {
            $syncData = [];
            foreach ($request->room_types as $rt) {
                $syncData[$rt['loai_phong_id']] = ['included' => !empty($rt['included']) ? 1 : 0];
            }
            $service->loaiPhong()->sync($syncData);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật dịch vụ thành công'
        ]);
    }
    
    public function destroy($id)
    {
        $service = DichVu::findOrFail($id);

        if ($service->loaiPhong()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi: Không thể xóa dịch vụ này vì đang được áp dụng cho một số hạng phòng!'
            ], 422);
        }

        $service->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Xóa dịch vụ thành công'
        ]);
    }
}