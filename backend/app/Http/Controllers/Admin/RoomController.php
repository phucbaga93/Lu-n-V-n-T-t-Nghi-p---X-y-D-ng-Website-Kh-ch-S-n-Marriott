<?php

namespace App\Http\Controllers\Admin;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Phong;
use App\Models\LoaiPhong;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index()
    {
        Phong::syncStatuses();
        $rooms = Phong::with(['loaiPhong', 'hinhAnh', 'tienNghi'])->orderBy('so_phong', 'asc')->get();
        return response()->json($rooms, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'so_phong' => [
                'required',
                'string',
                'regex:/^[A-Z]{2}[0-9]{4}$/',
                'unique:phong,so_phong',
                function ($attribute, $value, $fail) {
                    $floor = (int)substr($value, 2, 2);
                    $room = (int)substr($value, 4, 2);
                    if ($floor === 0) {
                        $fail('Số tầng (2 chữ số tiếp theo) không thể là 00.');
                    }
                    if ($room === 0) {
                        $fail('Số phòng (2 chữ số cuối) không thể là 00.');
                    }
                }
            ],
            'loai_phong_id' => 'required|exists:loai_phong,loai_phong_id',
            'mo_ta' => 'nullable|string',
            'trang_thai_hien_tai' => 'required|integer|in:0,1,2,3', // 0: Trong, 1: Dang su dung, 2: Don dep, 3: Bao tri
            'url_hinh_anh' => 'nullable|string|max:2048'
        ], [
            'so_phong.regex' => 'Số phòng phải đúng định dạng mã chi nhánh + 4 chữ số (ví dụ: SG0101, HN0102).',
            'so_phong.unique' => 'Số phòng này đã tồn tại trên hệ thống.',
        ]);

        $data = $request->all();
        $data['tang'] = (int)substr($request->so_phong, 2, 2);
        
        // Tự động suy luận chi nhánh dựa trên mã tiền tố số phòng
        $prefix = substr($request->so_phong, 0, 2);
        if ($prefix === 'SG') $data['vi_tri'] = 'TP. Hồ Chí Minh';
        elseif ($prefix === 'HN') $data['vi_tri'] = 'Hà Nội';
        elseif ($prefix === 'DN') $data['vi_tri'] = 'Đà Nẵng';
        elseif ($prefix === 'PQ') $data['vi_tri'] = 'Phú Quốc';

        $room = Phong::create($data);

        if ($request->has('amenities') && is_array($request->amenities)) {
            $amenityIds = [];
            foreach ($request->amenities as $name) {
                if (!empty($name)) {
                    $amenity = \App\Models\TienNghi::firstOrCreate(['ten_tien_nghi' => $name]);
                    $amenityIds[] = $amenity->tien_nghi_id;
                }
            }
            $room->tienNghi()->sync($amenityIds);
        }

        if ($request->has('images') && is_array($request->images)) {
            $images = $request->images;
            if ($request->filled('url_hinh_anh')) {
                $mainUrl = $request->url_hinh_anh;
                $images = array_values(array_filter($images, function($url) use ($mainUrl) {
                    return $url !== $mainUrl;
                }));
                array_unshift($images, $mainUrl);
            }
            foreach ($images as $url) {
                if (!empty($url)) {
                    $room->hinhAnh()->create(['url_hinh_anh' => $url]);
                }
            }
        } elseif ($request->filled('url_hinh_anh')) {
            $room->hinhAnh()->create([
                'url_hinh_anh' => $request->url_hinh_anh
            ]);
        }

        $room->load(['loaiPhong', 'hinhAnh']);

        return response()->json([
            'message' => 'Thêm phòng mới thành công.',
            'room' => $room
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $room = Phong::find($id);
        if (!$room) {
            return response()->json(['message' => 'Phòng không tồn tại.'], 404);
        }

        $request->validate([
            'so_phong' => [
                'sometimes',
                'required',
                'string',
                'regex:/^[A-Z]{2}[0-9]{4}$/',
                'unique:phong,so_phong,' . $id . ',phong_id',
                function ($attribute, $value, $fail) {
                    $floor = (int)substr($value, 2, 2);
                    $room = (int)substr($value, 4, 2);
                    if ($floor === 0) {
                        $fail('Số tầng (2 chữ số tiếp theo) không thể là 00.');
                    }
                    if ($room === 0) {
                        $fail('Số phòng (2 chữ số cuối) không thể là 00.');
                    }
                }
            ],
            'loai_phong_id' => 'sometimes|required|exists:loai_phong,loai_phong_id',
            'mo_ta' => 'nullable|string',
            'trang_thai_hien_tai' => 'sometimes|required|integer|in:0,1,2,3',
            'url_hinh_anh' => 'nullable|string|max:2048'
        ], [
            'so_phong.regex' => 'Số phòng phải đúng định dạng mã chi nhánh + 4 chữ số (ví dụ: SG0101, HN0102).',
            'so_phong.unique' => 'Số phòng này đã tồn tại trên hệ thống.',
        ]);

        if ($request->has('trang_thai_hien_tai') && $request->trang_thai_hien_tai == 3) {
            $hasFutureBookings = DB::table('chi_tiet_dat_phong')
                ->join('don_dat_phong', 'chi_tiet_dat_phong.don_dat_id', '=', 'don_dat_phong.don_dat_id')
                ->where('chi_tiet_dat_phong.phong_id', $id)
                ->where('don_dat_phong.ngay_checkout', '>=', now()->toDateString())
                ->where('don_dat_phong.trang_thai_don', '!=', 'Da_Huy')
                ->exists();

            if ($hasFutureBookings) {
                return response()->json([
                    'message' => 'Lỗi: Không thể chuyển phòng này sang Bảo trì do đang có đơn đặt lịch hoạt động trong tương lai!'
                ], 422);
            }
        }

        $data = $request->all();
        if ($request->has('so_phong')) {
            $data['tang'] = (int)substr($request->so_phong, 2, 2);
            
            // Tự động suy luận chi nhánh dựa trên mã tiền tố số phòng mới
            $prefix = substr($request->so_phong, 0, 2);
            if ($prefix === 'SG') $data['vi_tri'] = 'TP. Hồ Chí Minh';
            elseif ($prefix === 'HN') $data['vi_tri'] = 'Hà Nội';
            elseif ($prefix === 'DN') $data['vi_tri'] = 'Đà Nẵng';
            elseif ($prefix === 'PQ') $data['vi_tri'] = 'Phú Quốc';
        }

        $room->update($data);

        if ($request->has('amenities') && is_array($request->amenities)) {
            $amenityIds = [];
            foreach ($request->amenities as $name) {
                if (!empty($name)) {
                    $amenity = \App\Models\TienNghi::firstOrCreate(['ten_tien_nghi' => $name]);
                    $amenityIds[] = $amenity->tien_nghi_id;
                }
            }
            $room->tienNghi()->sync($amenityIds);
        }

        if ($request->has('images') && is_array($request->images)) {
            $room->hinhAnh()->delete();
            $images = $request->images;
            if ($request->filled('url_hinh_anh')) {
                $mainUrl = $request->url_hinh_anh;
                $images = array_values(array_filter($images, function($url) use ($mainUrl) {
                    return $url !== $mainUrl;
                }));
                array_unshift($images, $mainUrl);
            }
            foreach ($images as $url) {
                if (!empty($url)) {
                    $room->hinhAnh()->create(['url_hinh_anh' => $url]);
                }
            }
        } elseif ($request->has('url_hinh_anh')) {
            $hinhAnh = $room->hinhAnh()->first();
            if ($hinhAnh) {
                if (empty($request->url_hinh_anh)) {
                    $hinhAnh->delete();
                } else {
                    $hinhAnh->update(['url_hinh_anh' => $request->url_hinh_anh]);
                }
            } elseif (!empty($request->url_hinh_anh)) {
                $room->hinhAnh()->create(['url_hinh_anh' => $request->url_hinh_anh]);
            }
        }

        $room->load(['loaiPhong', 'hinhAnh']);

        return response()->json([
            'message' => 'Cập nhật phòng thành công.',
            'room' => $room
        ], 200);
    }

    public function destroy($id)
    {
        $room = Phong::find($id);
        if (!$room) {
            return response()->json(['message' => 'Phòng không tồn tại.'], 404);
        }

        // Call validation directly matching the SQL trigger tg_prevent_delete_phong
        $hasFutureBookings = DB::table('chi_tiet_dat_phong')
            ->join('don_dat_phong', 'chi_tiet_dat_phong.don_dat_id', '=', 'don_dat_phong.don_dat_id')
            ->where('chi_tiet_dat_phong.phong_id', $room->phong_id)
            ->where('don_dat_phong.ngay_checkout', '>=', now()->toDateString())
            ->where('don_dat_phong.trang_thai_don', '!=', 'Da_Huy')
            ->exists();

        if ($hasFutureBookings) {
            return response()->json([
                'message' => 'Lỗi: Không thể xóa phòng này do đang có đơn đặt lịch hoạt động trong tương lai!'
            ], 422);
        }

        $room->delete();
        return response()->json(['message' => 'Đã xóa số phòng thành công.'], 200);
    }

    public function adminShow($id)
    {
        $room = Phong::with(['loaiPhong', 'hinhAnh'])->find($id);
        if (!$room) {
            return response()->json(['message' => 'Phòng không tồn tại.'], 404);
        }
        return response()->json($room, 200);
    }

    // ================== HẠNG PHÒNG / LOẠI PHÒNG ==================
    public function getRoomTypes()
    {
        $types = LoaiPhong::with('dichVu')->get();
        return response()->json($types, 200);
    }

    public function storeRoomType(Request $request)
    {
        $request->validate([
            'ten_loai_phong' => 'required|string|max:100',
            'gia_theo_dem' => 'required|numeric',
            'dien_tich_m2' => 'nullable|integer',
            'so_giuong' => 'nullable|integer',
            'so_khach_toi_da' => 'nullable|integer',
            'mo_ta' => 'nullable|string'
        ]);

        $type = LoaiPhong::create($request->all());
        return response()->json([
            'message' => 'Tạo hạng phòng mới thành công.',
            'room_type' => $type
        ], 201);
    }

    public function updateRoomType(Request $request, $id)
    {
        $type = LoaiPhong::find($id);
        if (!$type) {
            return response()->json(['message' => 'Hạng phòng không tồn tại.'], 404);
        }

        $type->update($request->all());
        return response()->json([
            'message' => 'Cập nhật hạng phòng thành công.',
            'room_type' => $type
        ], 200);
    }

    public function deleteRoomType($id)
    {
        $type = LoaiPhong::find($id);
        if (!$type) {
            return response()->json(['message' => 'Hạng phòng không tồn tại.'], 404);
        }

        // Check if there are physical rooms linked
        if ($type->phongs()->exists()) {
            return response()->json(['message' => 'Không thể xóa hạng phòng này vì có phòng đang thuộc hạng này.'], 400);
        }

        $type->delete();
        return response()->json(['message' => 'Xóa hạng phòng thành công.'], 200);
    }

    // ================== TIỆN NGHI MANAGEMENT ==================
    public function getAmenities()
    {
        $amenities = \App\Models\TienNghi::all();
        return response()->json($amenities, 200);
    }

    public function storeAmenity(Request $request)
    {
        $request->validate([
            'ten_tien_nghi' => 'required|string|unique:tien_nghi,ten_tien_nghi|max:100'
        ]);

        $amenity = \App\Models\TienNghi::create($request->all());
        return response()->json([
            'message' => 'Tạo tiện nghi thành công.',
            'amenity' => $amenity
        ], 201);
    }

    public function deleteAmenity($id)
    {
        $amenity = \App\Models\TienNghi::find($id);
        if (!$amenity) {
            return response()->json(['message' => 'Tiện nghi không tồn tại.'], 404);
        }

        if ($amenity->phong()->exists()) {
            return response()->json([
                'message' => 'Lỗi: Không thể xóa tiện nghi này vì đang được gán cho một số phòng!'
            ], 422);
        }

        $amenity->delete();
        return response()->json(['message' => 'Xóa tiện nghi thành công.'], 200);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());
            $file->move(public_path('uploads'), $filename);
            
            $url = $request->getSchemeAndHttpHost() . '/uploads/' . $filename;
            return response()->json([
                'url' => $url
            ], 200);
        }

        return response()->json(['message' => 'Tệp không hợp lệ.'], 400);
    }
}
