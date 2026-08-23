<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\NguoiDung;
use App\Models\LoaiPhong;
use App\Models\Phong;
use App\Models\TienNghi;
use App\Models\DichVu;
use App\Models\KhuyenMai;
use App\Models\DonDatPhong;
use App\Models\ChiTietDatPhong;
use App\Models\HoaDonThanhToan;
use App\Models\ThongTinKhachSan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with production-grade data.
     */
    public function run(): void
    {
        // -------------------------------------------------------------
        // 1. BẢNG: NGUOI_DUNG (Admin, Staffs, and 20 Realistic Customers)
        // -------------------------------------------------------------
        $admin = NguoiDung::create([
            'ho_ten' => 'Nguyễn Anh Tuấn (Admin)',
            'email' => 'admin@hotel.com',
            'mat_khau' => Hash::make('12345678'),
            'so_dien_thoai' => '0901111222',
            'vai_tro' => 'Admin'
        ]);

        $nhanvien1 = NguoiDung::create([
            'ho_ten' => 'Lê Minh Hoàng (Lễ tân)',
            'email' => 'nhanvien@hotel.com',
            'mat_khau' => Hash::make('12345678'),
            'so_dien_thoai' => '0902222333',
            'vai_tro' => 'Le_Tan'
        ]);

        $nhanvien2 = NguoiDung::create([
            'ho_ten' => 'Nguyễn Hữu Toàn (Lễ tân SG)',
            'email' => 'toan.SG@hotel.com',
            'mat_khau' => Hash::make('12345678'),
            'so_dien_thoai' => '0902222444',
            'vai_tro' => 'Le_Tan'
        ]);

        $nhanvien3 = NguoiDung::create([
            'ho_ten' => 'Trần Phương Lan (Lễ tân HN)',
            'email' => 'lan.HN@hotel.com',
            'mat_khau' => Hash::make('12345678'),
            'so_dien_thoai' => '0902222555',
            'vai_tro' => 'Le_Tan'
        ]);

        // 20 Realistic Vietnamese Customers
        $customersData = [
            ['ho_ten' => 'Trần Minh Quân', 'email' => 'quan.tran@gmail.com', 'phone' => '0903001001', 'cccd' => '079200000001', 'dob' => '1990-05-12', 'address' => 'Quận 3, TP.HCM'],
            ['ho_ten' => 'Nguyễn Thị Mai Anh', 'email' => 'maianh.nguyen@gmail.com', 'phone' => '0903001002', 'cccd' => '079200000002', 'dob' => '1993-08-20', 'address' => 'Quận 7, TP.HCM'],
            ['ho_ten' => 'Phạm Hoàng Nam', 'email' => 'nam.pham@yahoo.com', 'phone' => '0903001003', 'cccd' => '079200000003', 'dob' => '1988-11-15', 'address' => 'Quận Hoàn Kiếm, Hà Nội'],
            ['ho_ten' => 'Lê Thanh Sơn', 'email' => 'son.le@gmail.com', 'phone' => '0903001004', 'cccd' => '079200000004', 'dob' => '1995-02-28', 'address' => 'Hải Châu, Đà Nẵng'],
            ['ho_ten' => 'Vũ Thị Hồng Nhung', 'email' => 'nhung.vu@hotmail.com', 'phone' => '0903001005', 'cccd' => '079200000005', 'dob' => '1991-09-05', 'address' => 'Quận 1, TP.HCM'],
            ['ho_ten' => 'Hoàng Đức Trung', 'email' => 'trung.hoang@outlook.com', 'phone' => '0903001006', 'cccd' => '079200000006', 'dob' => '1985-07-14', 'address' => 'Thành phố Vũng Tàu'],
            ['ho_ten' => 'Đỗ Thị Kim Oanh', 'email' => 'oanh.do@gmail.com', 'phone' => '0903001007', 'cccd' => '079200000007', 'dob' => '1994-12-01', 'address' => 'Nha Trang, Khánh Hòa'],
            ['ho_ten' => 'Phan Văn Hải', 'email' => 'hai.phan@gmail.com', 'phone' => '0903001008', 'cccd' => '079200000008', 'dob' => '1992-04-18', 'address' => 'Ninh Kiều, Cần Thơ'],
            ['ho_ten' => 'Bùi Minh Trí', 'email' => 'tri.bui@gmail.com', 'phone' => '0903001009', 'cccd' => '079200000009', 'dob' => '1987-10-30', 'address' => 'Quận Bình Thạnh, TP.HCM'],
            ['ho_ten' => 'Trịnh Thu Trang', 'email' => 'trang.trinh@gmail.com', 'phone' => '0903001010', 'cccd' => '079200000010', 'dob' => '1996-06-25', 'address' => 'Lạc Long Quân, Hà Nội'],
            ['ho_ten' => 'Ngô Quốc Bảo', 'email' => 'bao.ngo@gmail.com', 'phone' => '0903001011', 'cccd' => '079200000011', 'dob' => '1989-01-10', 'address' => 'Thủ Đức, TP.HCM'],
            ['ho_ten' => 'Đặng Minh Châu', 'email' => 'chau.dang@gmail.com', 'phone' => '0903001012', 'cccd' => '079200000012', 'dob' => '1997-03-15', 'address' => 'Biên Hòa, Đồng Nai'],
            ['ho_ten' => 'Dương Khánh Linh', 'email' => 'linh.duong@gmail.com', 'phone' => '0903001013', 'cccd' => '079200000013', 'dob' => '1995-10-22', 'address' => 'Quận 2, TP.HCM'],
            ['ho_ten' => 'Lý Gia Hào', 'email' => 'hao.ly@gmail.com', 'phone' => '0903001014', 'cccd' => '079200000014', 'dob' => '1994-07-08', 'address' => 'Phú Nhuận, TP.HCM'],
            ['ho_ten' => 'Võ Minh Tiến', 'email' => 'tien.vo@gmail.com', 'phone' => '0903001015', 'cccd' => '079200000015', 'dob' => '1986-05-05', 'address' => 'Quận Tân Bình, TP.HCM'],
            ['ho_ten' => 'Đinh Phương Thảo', 'email' => 'thao.dinh@gmail.com', 'phone' => '0903001016', 'cccd' => '079200000016', 'dob' => '1998-12-12', 'address' => 'Đống Đa, Hà Nội'],
            ['ho_ten' => 'Mai Văn Lâm', 'email' => 'lam.mai@gmail.com', 'phone' => '0903001017', 'cccd' => '1990-11-19', 'dob' => '1990-11-19', 'address' => 'Thanh Khê, Đà Nẵng'],
            ['ho_ten' => 'Lương Bảo Ngọc', 'email' => 'ngoc.luong@gmail.com', 'phone' => '0903001018', 'cccd' => '079200000018', 'dob' => '1993-09-09', 'address' => 'Thành phố Huế'],
            ['ho_ten' => 'Hồ Hoàng Long', 'email' => 'long.ho@gmail.com', 'phone' => '0903001019', 'cccd' => '079200000019', 'dob' => '1984-03-24', 'address' => 'Quận 5, TP.HCM'],
            ['ho_ten' => 'Tạ Tuyết Mai', 'email' => 'mai.ta@gmail.com', 'phone' => '0903001020', 'cccd' => '079200000020', 'dob' => '1991-01-30', 'address' => 'Thành phố Quy Nhơn'],
        ];

        $customers = [];
        foreach ($customersData as $c) {
            $customers[] = NguoiDung::create([
                'ho_ten' => $c['ho_ten'],
                'email' => $c['email'],
                'mat_khau' => Hash::make('12345678'),
                'so_dien_thoai' => $c['phone'],
                'cccd' => $c['cccd'],
                'ngay_sinh' => $c['dob'],
                'dia_chi' => $c['address'],
                'vai_tro' => 'Khach_Hang'
            ]);
        }

        // -------------------------------------------------------------
        // 2. BẢNG: LOAI_PHONG (4 JW Marriott Saigon categories)
        // -------------------------------------------------------------
        $lpStandard = LoaiPhong::create([
            'ten_loai_phong' => 'Deluxe City View Room (STD)',
            'gia_theo_dem' => 4800000.00,
            'dien_tich_m2' => 38,
            'so_giuong' => 1,
            'so_khach_toi_da' => 2,
            'mo_ta' => 'Phòng Deluxe thiết kế thanh lịch với cửa sổ sát trần panorama hướng thành phố, bồn tắm nằm đá cẩm thạch và đầy đủ tiện nghi chuẩn 5 sao.'
        ]);

        $lpSuperior = LoaiPhong::create([
            'ten_loai_phong' => 'Club Deluxe Premium View (SUP)',
            'gia_theo_dem' => 6200000.00,
            'dien_tich_m2' => 38,
            'so_giuong' => 1,
            'so_khach_toi_da' => 2,
            'mo_ta' => 'Phòng Club Deluxe tọa lạc tại các tầng cao với tầm nhìn tuyệt đẹp toàn cảnh, đi kèm đặc quyền sử dụng Executive Lounge với nhiều ưu đãi ẩm thực và phòng họp.'
        ]);

        $lpDeluxe = LoaiPhong::create([
            'ten_loai_phong' => 'Executive Studio Suite (DLX)',
            'gia_theo_dem' => 9800000.00,
            'dien_tich_m2' => 76,
            'so_giuong' => 1,
            'so_khach_toi_da' => 3,
            'mo_ta' => 'Phòng Suite thượng hạng với phòng khách và phòng ngủ riêng biệt, bồn tắm nằm đá cẩm thạch sang trọng, view thành phố và đặc quyền Executive Lounge.'
        ]);

        $lpSuite = LoaiPhong::create([
            'ten_loai_phong' => 'Presidential Penthouse Suite (SUT)',
            'gia_theo_dem' => 26000000.00,
            'dien_tich_m2' => 160,
            'so_giuong' => 1,
            'so_khach_toi_da' => 4,
            'mo_ta' => 'Căn hộ Tổng thống thượng hạng tầng cao nhất của khách sạn. Sở hữu phòng ăn riêng cho 8 khách, quầy bar, bồn sục jacuzzi cao cấp và dịch vụ quản gia 24/7.'
        ]);

        $lpFamily = LoaiPhong::create([
            'ten_loai_phong' => 'Family Premium Suite (FAM)',
            'gia_theo_dem' => 15000000.00,
            'dien_tich_m2' => 95,
            'so_giuong' => 2,
            'so_khach_toi_da' => 5,
            'mo_ta' => 'Phòng Suite gia đình cao cấp với không gian rộng lớn, gồm 2 phòng ngủ riêng biệt, phòng khách sang trọng, bếp nhỏ tiện nghi và ban công hướng phố hoặc hướng biển.'
        ]);

        // -------------------------------------------------------------
        // 3. BẢNG: PHONG (4 Locations, each location has 4 floors, 5 rooms per floor = 20 rooms per location)
        // -------------------------------------------------------------
        // Tạo 455 tổ hợp chập 3 của 15 ảnh để gán cho các phòng vật lý khác nhau không trùng lặp
        $combinations = [];
        for ($i = 0; $i < 15; $i++) {
            for ($j = $i + 1; $j < 15; $j++) {
                for ($k = $j + 1; $k < 15; $k++) {
                    $combinations[] = [$i, $j, $k];
                }
            }
        }

        $locationImagePools = [
            'TP. Hồ Chí Minh' => [
                'STD' => [
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1611891487122-207579d67d98?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUP' => [
                    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'
                ],
                'DLX' => [
                    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUT' => [
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80'
                ],
                'FAM' => [
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80'
                ]
            ],
            'Hà Nội' => [
                'STD' => [
                    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUP' => [
                    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1592229505726-ca121723b8ea?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
                ],
                'DLX' => [
                    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUT' => [
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80'
                ],
                'FAM' => [
                    'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=80'
                ]
            ],
            'Đà Nẵng' => [
                'STD' => [
                    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1611891487122-207579d67d98?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUP' => [
                    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'
                ],
                'DLX' => [
                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUT' => [
                    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'
                ],
                'FAM' => [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80'
                ]
            ],
            'Phú Quốc' => [
                'STD' => [
                    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUP' => [
                    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80'
                ],
                'DLX' => [
                    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
                ],
                'SUT' => [
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'
                ],
                'FAM' => [
                    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=80'
                ]
            ]
        ];

        $stdCounter = 0;
        $supCounter = 0;
        $dlxCounter = 0;
        $sutCounter = 0;
        $famCounter = 0;

        $locations = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Phú Quốc'];
        $prefixes = [
            'TP. Hồ Chí Minh' => 'SG',
            'Hà Nội' => 'HN',
            'Đà Nẵng' => 'DN',
            'Phú Quốc' => 'PQ'
        ];

        $layout = [
            1 => [
                1 => $lpStandard,
                2 => $lpStandard,
                3 => $lpStandard,
                4 => $lpSuperior,
                5 => $lpSuperior,
            ],
            2 => [
                1 => $lpStandard,
                2 => $lpStandard,
                3 => $lpSuperior,
                4 => $lpSuperior,
                5 => $lpDeluxe,
            ],
            3 => [
                1 => $lpDeluxe,
                2 => $lpDeluxe,
                3 => $lpFamily,
                4 => $lpFamily,
                5 => $lpFamily,
            ],
            4 => [
                1 => $lpDeluxe,
                2 => $lpDeluxe,
                3 => $lpDeluxe,
                4 => $lpSuite,
                5 => $lpSuite,
            ]
        ];

        foreach ($locations as $viTri) {
            $prefix = $prefixes[$viTri];
            for ($floor = 1; $floor <= 4; $floor++) {
                for ($roomIdx = 1; $roomIdx <= 5; $roomIdx++) {
                    $roomNum = sprintf("%s0%d%02d", $prefix, $floor, $roomIdx);
                    
                    $lp = $layout[$floor][$roomIdx];
                    $typeKey = 'STD';
                    if ($lp->loai_phong_id == $lpSuperior->loai_phong_id) $typeKey = 'SUP';
                    elseif ($lp->loai_phong_id == $lpDeluxe->loai_phong_id) $typeKey = 'DLX';
                    elseif ($lp->loai_phong_id == $lpSuite->loai_phong_id) $typeKey = 'SUT';
                    elseif ($lp->loai_phong_id == $lpFamily->loai_phong_id) $typeKey = 'FAM';

                    $status = 0;
                    if ($roomIdx == 3 && $floor == 2) $status = 1; 
                    elseif ($roomIdx == 5 && $floor == 3) $status = 2; 

                    $locationFeatures = [
                        'TP. Hồ Chí Minh' => [
                            'STD' => [
                                "Deluxe City View Room, Tầng {$floor}, 38m² với cửa kính panorama ôm trọn nhịp sống sầm uất phố Lê Duẩn & trung tâm Q1, bồn tắm cẩm thạch Ý sang trọng.",
                                "Deluxe City View Room, Tầng {$floor}, hướng sảnh chính thoáng đãng, đón ánh sáng tự nhiên, trang bị bàn làm việc cao cấp và tiện nghi phòng tắm 5 sao."
                            ],
                            'SUP' => [
                                "Club Deluxe Landmark View, Tầng {$floor}, tầm nhìn trực diện tuyệt đẹp ra tháp Landmark 81, đi kèm đặc quyền Executive Lounge tầng 19 (tiệc trà chiều & cocktail).",
                                "Club Deluxe River View, Tầng {$floor}, hướng sông Sài Gòn thoáng mát với ban công riêng rộng rãi, máy pha cà phê Espresso và dịch vụ turn-down chu đáo."
                            ],
                            'DLX' => [
                                "Executive Studio Suite, Tầng {$floor}, 76m² với phòng khách biệt lập sang trọng, view Cầu Ba Son & Sông Sài Gòn rực rỡ, bồn sục thư giãn cao cấp.",
                                "Executive Studio Suite, Tầng {$floor}, góc nhìn Panorama 180 độ bao quát toàn cảnh trung tâm TP.HCM, nội thất gỗ tự nhiên kết hợp đá Marble quý giá."
                            ],
                            'SUT' => [
                                "Presidential Penthouse Suite, Tầng {$floor}, 160m² ngắm trọn tháp Landmark 81 & Sông Sài Gòn 360 độ, phòng ăn riêng cho 8 khách và quản gia Butler 24/7.",
                                "Presidential Penthouse Suite, Tầng {$floor}, bồn sục Jacuzzi ngoài trời ngắm cảnh đêm Sài Gòn lung linh, đĩa nhạc vinyl và hầm rượu mini riêng biệt."
                            ],
                            'FAM' => [
                                "Family Premium Suite, Tầng {$floor}, 95m² thiết kế 2 phòng ngủ hướng phố Lê Duẩn & Nhà Hát Thành Phố, phòng khách rộng lớn và gian bếp tiện nghi.",
                                "Family Premium Suite, Tầng {$floor}, view mảng xanh công viên 23/9 rợp bóng, 2 phòng tắm đá cẩm thạch riêng biệt và bàn ăn gia đình 6 chỗ ấm cúng."
                            ]
                        ],
                        'Hà Nội' => [
                            'STD' => [
                                "Deluxe City View Room, Tầng {$floor}, 38m² thanh lịch với góc nhìn thơ mộng ra Phố Cổ Hà Nội rợp bóng cây, kết hợp tinh tế nét đẹp Indochine và bồn tắm cẩm thạch.",
                                "Deluxe City View Room, Tầng {$floor}, hướng đường Thanh Niên thanh bình, trang bị hệ thống lọc không khí tiêu chuẩn cao và trà hoa cúc Hà Nội thượng hạng."
                            ],
                            'SUP' => [
                                "Club Deluxe West Lake View, Tầng {$floor}, đắm chìm trong vẻ đẹp lãng mạn của Hồ Tây, đi kèm đặc quyền Executive Lounge với tiệc trà chiều hoàng hôn.",
                                "Club Deluxe Heritage View, Tầng {$floor}, tầm nhìn di sản hướng Đền Quán Thánh & Hồ Tây rợp sóng, ban công đón gió hồ tự nhiên và đặc quyền thượng lưu."
                            ],
                            'DLX' => [
                                "Executive Studio Suite, Tầng {$floor}, 76m² sở hữu góc nhìn cổ kính ôm trọn mảng xanh Hoàng Thành Thăng Long, phòng khách biệt lập với sofa da cao cấp.",
                                "Executive Studio Suite, Tầng {$floor}, view Quảng trường Ba Đình & Lăng Bác trang nghiêm, cửa cách âm tuyệt đối cùng bộ sưu tập trà chiều thượng hạng."
                            ],
                            'SUT' => [
                                "Presidential Penthouse Suite, Tầng {$floor}, 160m² sở hữu góc nhìn 360 độ bao quát Hồ Tây & Cầu Long Biên lịch sử, quản gia Butler 24/7 và Jacuzzi ngoài trời.",
                                "Presidential Penthouse Suite, Tầng {$floor}, kiệt tác penthouse ngắm trọn hoàng hôn Hồ Tây huyền diệu, trang bị đại piano sang trọng và phòng xông hơi riêng."
                            ],
                            'FAM' => [
                                "Family Premium Suite, Tầng {$floor}, 95m² gồm 2 phòng ngủ hướng Phố Cổ Hà Nội rộn ràng, khu vực bếp nấu hiện đại và bàn ăn gia đình ấm áp.",
                                "Family Premium Suite, Tầng {$floor}, view Khu Ngoại Giao Đoàn yên tĩnh, 2 phòng tắm riêng, tiện nghi em bé và bộ trò chơi gia đình ấm cúng."
                            ]
                        ],
                        'Đà Nẵng' => [
                            'STD' => [
                                "Deluxe Ocean View Room, Tầng {$floor}, 38m² đón ánh nắng bình tĩnh rực rỡ với view ngắm bãi biển Mỹ Khê trong xanh, bồn tắm đá và ban công gió biển tươi mát.",
                                "Deluxe City View Room, Tầng {$floor}, tầm nhìn ôm trọn trung tâm thành phố Đà Nẵng và những cây cầu huyền thoại, trang bị giường King cỡ lớn 5 sao."
                            ],
                            'SUP' => [
                                "Club Deluxe My Khe Beach View, Tầng {$floor}, trực diện bờ cát trắng mịn và nước biển Mỹ Khê xanh ngọc, đi kèm đặc quyền Executive Lounge thưởng thức cocktail.",
                                "Club Deluxe Son Tra View, Tầng {$floor}, hướng nhìn tĩnh lặng về Bán đảo Sơn Trà & Tượng Phật Bà Linh Ứng, cửa kính chạm trần và ban công thư giãn."
                            ],
                            'DLX' => [
                                "Executive Studio Suite, Tầng {$floor}, 76m² với ban công kính tràn viền phóng tầm mắt ra biển Phạm Văn Đồng, phòng khách sang trọng và bồn tắm sục hướng biển.",
                                "Executive Studio Suite, Tầng {$floor}, thưởng thức vẻ đẹp lung linh của Cầu Rồng & Cầu Sông Hàn về đêm, quầy mini-bar phong phú và dịch vụ chuẩn bị phòng."
                            ],
                            'SUT' => [
                                "Presidential Penthouse Suite, Tầng {$floor}, 160m² ngắm trọn đại dương xanh thẫm và bán đảo Sơn Trà 360 độ, phòng ăn riêng 8 chỗ, bể sục Jacuzzi vô cực và Butler 24/7.",
                                "Presidential Penthouse Suite, Tầng {$floor}, vị trí đắc địa thưởng thức màn phun lửa Cầu Rồng cuối tuần, sở hữu sân thượng riêng và quầy pha chế sang trọng."
                            ],
                            'FAM' => [
                                "Family Premium Suite, Tầng {$floor}, 95m² với 2 phòng ngủ ban công rộng hướng Biển Mỹ Khê bao la, bàn ăn gia đình và trang thiết bị đi biển trọn bộ.",
                                "Family Premium Suite, Tầng {$floor}, góc nhìn ngoạn mục hướng về danh thắng Ngũ Hành Sơn kỳ vĩ, gian bếp ấm cúng cùng dàn âm thanh giải trí cao cấp."
                            ]
                        ],
                        'Phú Quốc' => [
                            'STD' => [
                                "Deluxe Garden View Room, Tầng {$floor}, 38m² hòa mình vào khu vườn nhiệt đới xanh mát ngập tràn hương hoa rực rỡ, ban công riêng thư thái với ghế mây và bồn tắm đá cẩm thạch.",
                                "Deluxe Resort View Room, Tầng {$floor}, tận hưởng làn gió biển Đảo Ngọc tươi mát, thiết kế vật liệu mây bamboo tự nhiên ấm cúng và tiện nghi 5 sao."
                            ],
                            'SUP' => [
                                "Club Deluxe Sunset View, Tầng {$floor}, thưởng thức khoảnh khắc hoàng hôn Phú Quốc đẹp nhất thế giới ngay từ ban công, đặc quyền Lounge với cocktail trái cây.",
                                "Club Deluxe Forest View, Tầng {$floor}, tầm nhìn riêng tư hướng về cánh rừng nguyên sinh Đảo Ngọc xanh mút mắt, không gian tĩnh lặng tuyệt đối và tinh dầu thư giãn."
                            ],
                            'DLX' => [
                                "Executive Studio Suite, Tầng {$floor}, 76m² với ban công kính trực diện bãi cát trắng mịn Bãi Dài, phòng khách sang trọng và bồn tắm ngâm mình hướng đại dương.",
                                "Executive Studio Suite, Tầng {$floor}, tầm nhìn tuyệt đẹp hướng ra hồ bơi vô cực ngập nắng và bờ biển Tây, không gian mở giao hòa thiên nhiên cùng hầm rượu mini."
                            ],
                            'SUT' => [
                                "Presidential Penthouse Suite, Tầng {$floor}, 160m² penthouse đỉnh đồi sở hữu hồ bơi vô cực riêng ngắm Biển Phú Quốc 360 độ, lối đi bãi biển riêng và Butler 24/7.",
                                "Presidential Penthouse Suite, Tầng {$floor}, biệt thự penthouse xa xỉ với mái lá kết hợp đá tự nhiên, bồn sục Jacuzzi hướng biển hoàng hôn và bếp riêng cho Chef."
                            ],
                            'FAM' => [
                                "Family Premium Suite, Tầng {$floor}, 95m² thiết kế 2 phòng ngủ lợp mái lá hiện đại hướng hồ bơi trung tâm nhiệt đới, bàn ăn gia đình và khoảng sân vườn riêng.",
                                "Family Premium Suite, Tầng {$floor}, không gian thiên đường rợp bóng dừa mát rượi hướng bờ biển Bãi Dài êm đềm, 2 phòng tắm riêng cùng đồ chơi cát cao cấp."
                            ]
                        ]
                    ];

                    $desc = $locationFeatures[$viTri][$typeKey][($roomIdx % 2 == 0) ? 1 : 0];

                    // Cắt ra 3 ảnh hoàn toàn độc nhất từ Pool tương ứng cho từng phòng (nhảy bước 3 để không trùng bất kỳ ảnh nào giữa các phòng)
                    $assignedImgs = [];
                    $counter = 0;
                    if ($typeKey === 'STD') { $counter = $stdCounter++; }
                    elseif ($typeKey === 'SUP') { $counter = $supCounter++; }
                    elseif ($typeKey === 'DLX') { $counter = $dlxCounter++; }
                    elseif ($typeKey === 'SUT') { $counter = $sutCounter++; }
                    elseif ($typeKey === 'FAM') { $counter = $famCounter++; }

                    $pool = $locationImagePools[$viTri][$typeKey];
                    $poolSize = count($pool);
                    $assignedImgs = [
                        $pool[($counter * 3) % $poolSize],
                        $pool[($counter * 3 + 1) % $poolSize],
                        $pool[($counter * 3 + 2) % $poolSize]
                    ];

                    $phong = Phong::create([
                        'so_phong' => $roomNum,
                        'loai_phong_id' => $lp->loai_phong_id,
                        'tang' => $floor,
                        'trang_thai_hien_tai' => $status,
                        'mo_ta' => $desc,
                        'vi_tri' => $viTri
                    ]);

                    foreach ($assignedImgs as $imgUrl) {
                        DB::table('hinh_anh_phong')->insert([
                            'phong_id' => $phong->phong_id,
                            'url_hinh_anh' => $imgUrl,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 5. BẢNG: TIEN_NGHI (8 Luxury Amenities)
        // -------------------------------------------------------------
        $tnWifi  = TienNghi::create(['ten_tien_nghi' => 'WiFi']);
        $tnTivi  = TienNghi::create(['ten_tien_nghi' => 'TV']);
        $tnBar   = TienNghi::create(['ten_tien_nghi' => 'Minibar']);
        $tnConditioner = TienNghi::create(['ten_tien_nghi' => 'Điều hòa']);
        $tnTub   = TienNghi::create(['ten_tien_nghi' => 'Bồn tắm']);
        $tnSmartTivi = TienNghi::create(['ten_tien_nghi' => 'Smart TV']);
        $tnLounge = TienNghi::create(['ten_tien_nghi' => 'Phòng khách']);
        $tnBalcony = TienNghi::create(['ten_tien_nghi' => 'Ban công']);

        // Gắn tiện nghi mặc định cho phòng (ChiTietTienNghi)
        $allRooms = Phong::all();
        foreach ($allRooms as $rm) {
            // All rooms have WiFi and Conditioner
            DB::table('chi_tiet_tien_nghi')->insert([
                ['tien_nghi_id' => $tnWifi->tien_nghi_id, 'phong_id' => $rm->phong_id],
                ['tien_nghi_id' => $tnConditioner->tien_nghi_id, 'phong_id' => $rm->phong_id],
            ]);
            
            if ($rm->loai_phong_id === $lpStandard->loai_phong_id) {
                DB::table('chi_tiet_tien_nghi')->insert([
                    ['tien_nghi_id' => $tnTivi->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBar->tien_nghi_id, 'phong_id' => $rm->phong_id],
                ]);
            } elseif ($rm->loai_phong_id === $lpSuperior->loai_phong_id) {
                DB::table('chi_tiet_tien_nghi')->insert([
                    ['tien_nghi_id' => $tnTivi->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBar->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBalcony->tien_nghi_id, 'phong_id' => $rm->phong_id],
                ]);
            } elseif ($rm->loai_phong_id === $lpDeluxe->loai_phong_id) {
                DB::table('chi_tiet_tien_nghi')->insert([
                    ['tien_nghi_id' => $tnSmartTivi->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBar->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnTub->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnLounge->tien_nghi_id, 'phong_id' => $rm->phong_id],
                ]);
            } elseif ($rm->loai_phong_id === $lpSuite->loai_phong_id) {
                DB::table('chi_tiet_tien_nghi')->insert([
                    ['tien_nghi_id' => $tnSmartTivi->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBar->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnTub->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnLounge->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBalcony->tien_nghi_id, 'phong_id' => $rm->phong_id],
                ]);
            } elseif ($rm->loai_phong_id === $lpFamily->loai_phong_id) {
                DB::table('chi_tiet_tien_nghi')->insert([
                    ['tien_nghi_id' => $tnSmartTivi->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBar->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnLounge->tien_nghi_id, 'phong_id' => $rm->phong_id],
                    ['tien_nghi_id' => $tnBalcony->tien_nghi_id, 'phong_id' => $rm->phong_id],
                ]);
            }
        }

        // -------------------------------------------------------------
        // 6. BẢNG: DICH_VU (4 Luxury Services)
        // -------------------------------------------------------------
        $dvAnSang  = DichVu::create(['ten_dich_vu' => 'Buffet Ăn Sáng', 'loai_dich_vu' => 'Ẩm thực', 'gia_mac_dinh' => 450000.00, 'mo_ta' => 'Phục vụ ẩm thực Á-Âu chuẩn quốc tế tại nhà hàng Parkview từ 6:00 - 10:30.']);
        $dvGiatUi  = DichVu::create(['ten_dich_vu' => 'Giặt ủi cấp tốc', 'loai_dich_vu' => 'Dịch vụ', 'gia_mac_dinh' => 180000.00, 'mo_ta' => 'Giặt hấp cao cấp lấy nhanh trong vòng 3 giờ.']);
        $dvSanBay  = DichVu::create(['ten_dich_vu' => 'Xe đưa đón sân bay', 'loai_dich_vu' => 'Di chuyển', 'gia_mac_dinh' => 1200000.00, 'mo_ta' => 'Đưa đón hai chiều sân bay Tân Sơn Nhất bằng dòng xe Mercedes-Benz cao cấp.']);
        $dvSpa     = DichVu::create(['ten_dich_vu' => 'Massage & Spa Toàn Thân', 'loai_dich_vu' => 'Thư giãn', 'gia_mac_dinh' => 1500000.00, 'mo_ta' => 'Liệu trình massage 60 phút thải độc tại Spa by JW.']);

        // Dịch vụ kèm theo loại phòng (LoaiPhongDichVu)
        DB::table('loai_phong_dich_vu')->insert([
            ['loai_phong_id' => $lpSuperior->loai_phong_id, 'dich_vu_id' => $dvAnSang->dich_vu_id, 'included' => true],
            ['loai_phong_id' => $lpDeluxe->loai_phong_id, 'dich_vu_id' => $dvAnSang->dich_vu_id, 'included' => true],
            ['loai_phong_id' => $lpSuite->loai_phong_id, 'dich_vu_id' => $dvAnSang->dich_vu_id, 'included' => true],
            ['loai_phong_id' => $lpSuite->loai_phong_id, 'dich_vu_id' => $dvSanBay->dich_vu_id, 'included' => true],
            ['loai_phong_id' => $lpFamily->loai_phong_id, 'dich_vu_id' => $dvAnSang->dich_vu_id, 'included' => true],
            ['loai_phong_id' => $lpFamily->loai_phong_id, 'dich_vu_id' => $dvSanBay->dich_vu_id, 'included' => true],
        ]);

        // -------------------------------------------------------------
        // 7. BẢNG: KHUYEN_MAI (Promo codes)
        // -------------------------------------------------------------
        $kmSummer = KhuyenMai::create(['ma_code' => 'HELLOSUMMER', 'mo_ta' => 'Chào hè rực rỡ giảm giá 10% tối đa 1 triệu đồng', 'phan_tram_giam' => 10, 'so_tien_giam_toi_da' => 1000000.00, 'ngay_bat_dau' => '2026-05-01', 'ngay_ket_thuc' => '2026-12-31']);
        $kmSummer26 = KhuyenMai::create(['ma_code' => 'SUMMER2026', 'mo_ta' => 'Nhập mã SUMMER2026 giảm ngay 100.000đ khi đặt phòng hôm nay!', 'phan_tram_giam' => 0, 'so_tien_giam_toi_da' => 100000.00, 'ngay_bat_dau' => '2026-01-01', 'ngay_ket_thuc' => '2026-12-31']);
        $kmWelcome = KhuyenMai::create(['ma_code' => 'WELCOME', 'mo_ta' => 'Chào mừng thành viên mới - Giảm ngay 50.000đ', 'phan_tram_giam' => 0, 'so_tien_giam_toi_da' => 50000.00, 'ngay_bat_dau' => '2026-01-01', 'ngay_ket_thuc' => '2026-12-31']);
        $kmSuite20 = KhuyenMai::create(['ma_code' => 'SUITE20', 'mo_ta' => 'Ưu đãi đặc biệt phòng Suite - Giảm 200.000đ khi đặt phòng cao cấp', 'phan_tram_giam' => 0, 'so_tien_giam_toi_da' => 200000.00, 'ngay_bat_dau' => '2026-01-01', 'ngay_ket_thuc' => '2026-12-31']);
        $kmVip    = KhuyenMai::create(['ma_code' => 'JWVIP20', 'mo_ta' => 'Ưu đãi tri ân thành viên VIP giảm 20% tiền phòng', 'phan_tram_giam' => 20, 'so_tien_giam_toi_da' => 3000000.00, 'ngay_bat_dau' => '2026-01-01', 'ngay_ket_thuc' => '2026-12-31']);
        $kmBack   = KhuyenMai::create(['ma_code' => 'WELCOMEBACK', 'mo_ta' => 'Ưu đãi khách hàng cũ quay lại giảm 5%', 'phan_tram_giam' => 5, 'so_tien_giam_toi_da' => 500000.00, 'ngay_bat_dau' => '2026-06-01', 'ngay_ket_thuc' => '2026-12-31']);

        // Fetch representative rooms for booking history compatibility
        $p101 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0101')->first();
        $p102 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0102')->first();
        $p201 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0104')->first();
        $p202 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0204')->first();
        $p301 = Phong::where('vi_tri', 'Hà Nội')->where('so_phong', 'HN0301')->first();
        $p302 = Phong::where('vi_tri', 'Hà Nội')->where('so_phong', 'HN0302')->first();
        $p401 = Phong::where('vi_tri', 'Hà Nội')->where('so_phong', 'HN0303')->first();
        $p501 = Phong::where('vi_tri', 'Đà Nẵng')->where('so_phong', 'DN0404')->first();
        $p502 = Phong::where('vi_tri', 'Đà Nẵng')->where('so_phong', 'DN0405')->first();
        $p503 = Phong::where('vi_tri', 'Đà Nẵng')->where('so_phong', 'DN0404')->first();
        $p601 = Phong::where('vi_tri', 'Phú Quốc')->where('so_phong', 'PQ0101')->first();
        $p701 = Phong::where('vi_tri', 'Phú Quốc')->where('so_phong', 'PQ0102')->first();

        // -------------------------------------------------------------
        // 8. BẢNG: DON_DAT_PHONG, CHI_TIET_DAT_PHONG, HOA_DON_THANH_TOAN
        // (Spanning 30+ highly realistic historical bookings from Jan 2026 to present, plus future bookings)
        // -------------------------------------------------------------
        $bookingHistory = [
            // Month 1 (Jan 2026) - Checked Out
            ['cust_idx' => 0, 'room' => $p101, 'in' => '2026-01-05', 'out' => '2026-01-08', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 1, 'room' => $p201, 'in' => '2026-01-10', 'out' => '2026-01-12', 'status' => 'Da_Tra_Phong', 'method' => 'Tien_Mat', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 2, 'room' => $p301, 'in' => '2026-01-15', 'out' => '2026-01-20', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 9800000.00, 'promo' => 'JWVIP20'],
            ['cust_idx' => 3, 'room' => $p102, 'in' => '2026-01-22', 'out' => '2026-01-25', 'status' => 'Da_Tra_Phong', 'method' => 'Vi_Dien_Tu', 'price' => 4800000.00, 'promo' => null],
            
            // Month 2 (Feb 2026) - Checked Out
            ['cust_idx' => 4, 'room' => $p501, 'in' => '2026-02-02', 'out' => '2026-02-05', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 26000000.00, 'promo' => 'JWVIP20'],
            ['cust_idx' => 5, 'room' => $p202, 'in' => '2026-02-10', 'out' => '2026-02-13', 'status' => 'Da_Tra_Phong', 'method' => 'Tien_Mat', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 6, 'room' => $p601, 'in' => '2026-02-14', 'out' => '2026-02-16', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 7, 'room' => $p302, 'in' => '2026-02-20', 'out' => '2026-02-24', 'status' => 'Da_Tra_Phong', 'method' => 'Vi_Dien_Tu', 'price' => 9800000.00, 'promo' => 'WELCOMEBACK'],

            // Month 3 (Mar 2026) - Checked Out
            ['cust_idx' => 8, 'room' => $p101, 'in' => '2026-03-01', 'out' => '2026-03-03', 'status' => 'Da_Tra_Phong', 'method' => 'Tien_Mat', 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 9, 'room' => $p201, 'in' => '2026-03-05', 'out' => '2026-03-08', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 10, 'room' => $p502, 'in' => '2026-03-12', 'out' => '2026-03-15', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 26000000.00, 'promo' => null],
            ['cust_idx' => 11, 'room' => $p701, 'in' => '2026-03-20', 'out' => '2026-03-23', 'status' => 'Da_Tra_Phong', 'method' => 'Vi_Dien_Tu', 'price' => 4800000.00, 'promo' => null],

            // Month 4 (Apr 2026) - Checked Out
            ['cust_idx' => 12, 'room' => $p301, 'in' => '2026-04-05', 'out' => '2026-04-07', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 9800000.00, 'promo' => 'WELCOMEBACK'],
            ['cust_idx' => 13, 'room' => $p102, 'in' => '2026-04-10', 'out' => '2026-04-15', 'status' => 'Da_Tra_Phong', 'method' => 'Tien_Mat', 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 14, 'room' => $p202, 'in' => '2026-04-18', 'out' => '2026-04-20', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 6200000.00, 'promo' => null],

            // Month 5 (May 2026) - Checked Out & Cancelled
            ['cust_idx' => 15, 'room' => $p501, 'in' => '2026-05-02', 'out' => '2026-05-06', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 26000000.00, 'promo' => 'HELLOSUMMER'],
            ['cust_idx' => 16, 'room' => $p601, 'in' => '2026-05-10', 'out' => '2026-05-12', 'status' => 'Da_Tra_Phong', 'method' => 'Vi_Dien_Tu', 'price' => 4800000.00, 'promo' => 'HELLOSUMMER'],
            ['cust_idx' => 17, 'room' => $p302, 'in' => '2026-05-15', 'out' => '2026-05-18', 'status' => 'Da_Huy', 'method' => null, 'price' => 9800000.00, 'promo' => null], // Cancelled

            // Month 6 (Jun 2026) - Checked Out & Swapped
            ['cust_idx' => 18, 'room' => $p101, 'in' => '2026-06-02', 'out' => '2026-06-05', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => 'HELLOSUMMER'],
            ['cust_idx' => 19, 'room' => $p201, 'in' => '2026-06-10', 'out' => '2026-06-12', 'status' => 'Da_Tra_Phong', 'method' => 'Tien_Mat', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 0,  'room' => $p301, 'in' => '2026-06-15', 'out' => '2026-06-18', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 9800000.00, 'promo' => 'WELCOMEBACK'],
            ['cust_idx' => 1,  'room' => $p701, 'in' => '2026-06-20', 'out' => '2026-06-22', 'status' => 'Da_Huy', 'method' => null, 'price' => 4800000.00, 'promo' => null], // Cancelled

            // Month 7 (July 2026) - Checked Out, Cancelled, In-House, and Future
            ['cust_idx' => 2,  'room' => $p102, 'in' => '2026-07-01', 'out' => '2026-07-04', 'status' => 'Da_Tra_Phong', 'method' => 'Vi_Dien_Tu', 'price' => 4800000.00, 'promo' => 'HELLOSUMMER'],
            ['cust_idx' => 3,  'room' => $p202, 'in' => '2026-07-05', 'out' => '2026-07-08', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 4,  'room' => $p302, 'in' => '2026-07-10', 'out' => '2026-07-12', 'status' => 'Da_Tra_Phong', 'method' => 'Tien_Mat', 'price' => 9800000.00, 'promo' => null],
            ['cust_idx' => 5,  'room' => $p601, 'in' => '2026-07-14', 'out' => '2026-07-16', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => null],
            
            // ── CURRENT IN-HOUSE GUESTS (Active Bookings staying 2-3 days as of Aug 17, 2026)
            ['cust_idx' => 6,  'room' => $p201, 'in' => '2026-08-14', 'out' => '2026-08-19', 'status' => 'Dang_O', 'method' => 'Online_Banking', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 7,  'room' => $p301, 'in' => '2026-08-15', 'out' => '2026-08-18', 'status' => 'Dang_O', 'method' => 'Online_Banking', 'price' => 9800000.00, 'promo' => null],
            ['cust_idx' => 8,  'room' => $p501, 'in' => '2026-08-16', 'out' => '2026-08-20', 'status' => 'Dang_O', 'method' => 'Online_Banking', 'price' => 26000000.00, 'promo' => null],
            ['cust_idx' => 0,  'room' => $p101, 'in' => '2026-08-14', 'out' => '2026-08-17', 'status' => 'Da_Tra_Phong', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => null],

            // ── UPCOMING & FUTURE BOOKINGS (Today 17/08/2026 to 5 Days Later 22/08/2026)
            ['cust_idx' => 9,  'room' => $p102, 'in' => '2026-08-17', 'out' => '2026-08-19', 'status' => 'Da_Xac_Nhan', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 10, 'room' => $p601, 'in' => '2026-08-17', 'out' => '2026-08-21', 'status' => 'Cho_Xac_Nhan', 'method' => null, 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 11, 'room' => $p202, 'in' => '2026-08-18', 'out' => '2026-08-20', 'status' => 'Da_Xac_Nhan', 'method' => 'Online_Banking', 'price' => 6200000.00, 'promo' => null],
            ['cust_idx' => 12, 'room' => $p302, 'in' => '2026-08-19', 'out' => '2026-08-22', 'status' => 'Da_Xac_Nhan', 'method' => null, 'price' => 9800000.00, 'promo' => 'HELLOSUMMER'],
            ['cust_idx' => 13, 'room' => $p502, 'in' => '2026-08-20', 'out' => '2026-08-23', 'status' => 'Cho_Xac_Nhan', 'method' => null, 'price' => 26000000.00, 'promo' => 'JWVIP20'],
            ['cust_idx' => 14, 'room' => $p701, 'in' => '2026-08-21', 'out' => '2026-08-24', 'status' => 'Da_Xac_Nhan', 'method' => 'Online_Banking', 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 15, 'room' => $p401, 'in' => '2026-08-22', 'out' => '2026-08-25', 'status' => 'Da_Xac_Nhan', 'method' => null, 'price' => 4800000.00, 'promo' => null],
            ['cust_idx' => 1,  'room' => $p503, 'in' => '2026-08-17', 'out' => '2026-08-19', 'status' => 'Da_Huy', 'method' => null, 'price' => 4800000.00, 'promo' => null],
        ];

        foreach ($bookingHistory as $idx => $b) {
            $cust = $customers[$b['cust_idx']];
            $room = $b['room'];
            $nights = (strtotime($b['out']) - strtotime($b['in'])) / 86400;
            
            $subtotal = $b['price'] * $nights;
            $discount = 0.00;
            
            if ($b['promo'] === 'HELLOSUMMER') {
                $discount = min($subtotal * 0.1, 1000000.00);
            } elseif ($b['promo'] === 'JWVIP20') {
                $discount = min($subtotal * 0.2, 3000000.00);
            } elseif ($b['promo'] === 'WELCOMEBACK') {
                $discount = min($subtotal * 0.05, 500000.00);
            }
            
            $finalTotal = $subtotal - $discount;

            // 1. Insert DonDatPhong
            $don = DonDatPhong::create([
                'khach_hang_id' => $cust->nguoi_dung_id,
                'nguoi_tao_don' => $cust->nguoi_dung_id,
                'nguon_dat' => 'ONLINE',
                'ma_khuyen_mai_id' => $b['promo'],
                'ngay_checkin' => $b['in'],
                'ngay_checkout' => $b['out'],
                'so_nguoi_lon' => $room->loaiPhong->so_khach_toi_da - 1,
                'so_tre_em' => 0,
                'tong_tien_phong' => $subtotal,
                'thanh_tien_cuoi' => $finalTotal,
                'trang_thai_don' => $b['status'],
                'ngay_huy_don' => $b['status'] === 'Da_Huy' ? date('Y-m-d H:i:s', strtotime($b['in'] . ' - 3 days')) : null
            ]);

            // 2. Insert ChiTietDatPhong
            $ctState = 'booked';
            if ($b['status'] === 'Da_Tra_Phong') $ctState = 'checked_out';
            elseif ($b['status'] === 'Dang_O') $ctState = 'checked_in';
            elseif ($b['status'] === 'Da_Huy') $ctState = 'cancelled';

            $ct = ChiTietDatPhong::create([
                'don_dat_id' => $don->don_dat_id,
                'phong_id' => $room->phong_id,
                'gia_ap_dung' => $b['price'],
                'trang_thai' => $ctState
            ]);

            // 3. Insert HoaDonThanhToan (Only for non-cancelled)
            if ($b['status'] !== 'Da_Huy' && $b['method'] !== null) {
                $payDate = ($b['status'] === 'Da_Tra_Phong') ? $b['out'] . ' 10:00:00' : date('Y-m-d H:i:s', strtotime($b['in'] . ' - 1 day'));
                $receptionists = [$nhanvien1->nguoi_dung_id, $nhanvien2->nguoi_dung_id, $nhanvien3->nguoi_dung_id];
                $staffAssigned = $receptionists[$idx % 3];

                HoaDonThanhToan::create([
                    'don_dat_id' => $don->don_dat_id,
                    'nhan_vien_tao_id' => $staffAssigned,
                    'ngay_thanh_toan' => $payDate,
                    'tong_tien_thanh_toan' => $finalTotal,
                    'hinh_thuc_thanh_toan' => in_array($b['method'], ['Online_Banking', 'Vi_Dien_Tu', 'vnpay', 'VNPAY']) ? 'VNPAY' : 'OFFLINE',
                    'ghi_chu' => 'Đã thu đầy đủ tiền phòng và các dịch vụ phát sinh.'
                ]);
            }

            // 4. Seeding Room Swapping Log for realism (For a couple of bookings)
            if ($idx === 10) { // Swap Room 202 to 201 for client
                DB::table('lich_su_doi_phong')->insert([
                    'chi_tiet_dat_phong_id' => $ct->chi_tiet_dat_phong_id,
                    'phong_cu' => $p202->phong_id,
                    'phong_moi' => $p201->phong_id,
                    'thoi_gian' => $b['in'] . ' 14:30:00',
                    'ly_do' => 'Khách muốn chuyển sang phòng view đẹp hơn',
                    'phu_thu_thanh_toan' => 0.00,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // 5. Seeding Cancellation Log (For Da_Huy bookings)
            if ($b['status'] === 'Da_Huy') {
                DB::table('lich_su_huy_don')->insert([
                    'don_dat_id' => $don->don_dat_id,
                    'nguoi_huy_id' => $cust->nguoi_dung_id,
                    'thoi_diem_huy' => date('Y-m-d H:i:s', strtotime($b['in'] . ' - 3 days')),
                    'ly_do' => 'Gặp vấn đề cá nhân nên phải dời lịch công tác.',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        // -------------------------------------------------------------
        // 9. TEST CASE ĐẶC BIỆT: 1 ĐƠN HÀNG ĐẶT 3 PHÒNG
        // (2 phòng nhận ở thực tế, 1 phòng khách không đi - Hủy 1 phòng)
        // -------------------------------------------------------------
        $multiCust = $customers[0]; // Nguyễn Văn An
        $pMulti1 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0101')->first();
        $pMulti2 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0102')->first();
        $pMulti3 = Phong::where('vi_tri', 'TP. Hồ Chí Minh')->where('so_phong', 'SG0104')->first();

        if ($pMulti1 && $pMulti2 && $pMulti3) {
            $multiSubtotal = 4800000.00 * 2 * 3; // 3 phòng x 2 đêm = 28.8M
            $multiTotal = $multiSubtotal;

            $donMulti = DonDatPhong::create([
                'khach_hang_id' => $multiCust->nguoi_dung_id,
                'nguoi_tao_don' => $multiCust->nguoi_dung_id,
                'nguon_dat' => 'ONLINE',
                'ngay_checkin' => '2026-08-17',
                'ngay_checkout' => '2026-08-19',
                'so_nguoi_lon' => 6,
                'so_tre_em' => 0,
                'tong_tien_phong' => $multiSubtotal,
                'thanh_tien_cuoi' => $multiTotal,
                'trang_thai_don' => 'Dang_O',
                'so_tien_da_coc' => 14400000.00,
                'phan_tram_dat_coc' => 50,
                'ghi_chu_dac_biet' => '[Đơn 3 phòng] | SG0101 (Checked-in) | SG0102 (Checked-in) | SG0104 (Khách hủy 1 phòng / No-show)'
            ]);

            // Chi tiết Phòng 1: Đã nhận (checked_in)
            ChiTietDatPhong::create([
                'don_dat_id' => $donMulti->don_dat_id,
                'phong_id' => $pMulti1->phong_id,
                'gia_ap_dung' => 4800000.00,
                'trang_thai' => 'checked_in'
            ]);
            $pMulti1->update(['trang_thai_hien_tai' => 1]);

            // Chi tiết Phòng 2: Đã nhận (checked_in)
            ChiTietDatPhong::create([
                'don_dat_id' => $donMulti->don_dat_id,
                'phong_id' => $pMulti2->phong_id,
                'gia_ap_dung' => 4800000.00,
                'trang_thai' => 'checked_in'
            ]);
            $pMulti2->update(['trang_thai_hien_tai' => 1]);

            // Chi tiết Phòng 3: Hủy riêng phòng này (cancelled)
            ChiTietDatPhong::create([
                'don_dat_id' => $donMulti->don_dat_id,
                'phong_id' => $pMulti3->phong_id,
                'gia_ap_dung' => 4800000.00,
                'trang_thai' => 'cancelled'
            ]);

            // Tạo bản ghi Hóa đơn cọc
            HoaDonThanhToan::create([
                'don_dat_id' => $donMulti->don_dat_id,
                'nhan_vien_tao_id' => $nhanvien1->nguoi_dung_id,
                'ngay_thanh_toan' => '2026-08-16 10:00:00',
                'tong_tien_thanh_toan' => 14400000.00,
                'hinh_thuc_thanh_toan' => 'VNPAY',
                'ghi_chu' => 'Đã cọc 50% đơn 3 phòng. Khách hủy riêng Phòng SG0104.'
            ]);
        }

        // -------------------------------------------------------------
        // 9. BẢNG: DANH_GIA_TRAI_NGHIEM (15 Detailed reviews)
        // -------------------------------------------------------------
        $reviews = [
            ['cust_idx' => 0, 'type' => $lpStandard, 'stars' => 5, 'comment' => 'Phòng Deluxe City View cực kỳ rộng rãi và sang trọng. Dù là hạng cơ bản nhưng vẫn có bồn tắm nằm và view kính ngắm trọn vẹn thành phố rất đẹp.'],
            ['cust_idx' => 1, 'type' => $lpSuperior, 'stars' => 5, 'comment' => 'Đặc quyền Executive Lounge tại tầng 19 rất đáng tiền! Phục vụ ăn sáng ngon, đồ uống tối pha chế chuẩn vị. Nhân viên vô cùng chuyên nghiệp.'],
            ['cust_idx' => 2, 'type' => $lpDeluxe, 'stars' => 5, 'comment' => 'Executive Suite rộng rãi có phòng khách riêng cực tiện để tiếp đối tác. Bồn tắm đá cẩm thạch rất đẹp, đồ ăn phục vụ phòng ngon.'],
            ['cust_idx' => 3, 'type' => $lpStandard, 'stars' => 4, 'comment' => 'Giường rất êm, ngủ ngon giấc. Chỉ tiếc là giờ cao điểm thang máy hơi đông một chút, còn lại mọi dịch vụ đều tuyệt vời.'],
            ['cust_idx' => 4, 'type' => $lpSuite, 'stars' => 5, 'comment' => 'Trải nghiệm đỉnh cao tại Presidential Penthouse! Phòng khách vô cùng lộng lẫy, view ôm trọn cảnh quan tuyệt đẹp. Dịch vụ quản gia phục vụ chu đáo.'],
            ['cust_idx' => 5, 'type' => $lpSuperior, 'stars' => 5, 'comment' => 'Phòng sạch sẽ, view thành phố lung linh về đêm. Dịch vụ giặt hấp quần áo lấy nhanh vô cùng tiện lợi.'],
            ['cust_idx' => 6, 'type' => $lpStandard, 'stars' => 5, 'comment' => 'Địa điểm khách sạn ngay trung tâm đắc địa, đi lại ăn uống vui chơi đều rất tiện lợi. Sẽ quay lại nhiều lần.'],
            ['cust_idx' => 7, 'type' => $lpDeluxe, 'stars' => 4, 'comment' => 'Nội thất gỗ trầm ấm cúng đúng phong cách JW Marriott, bồn tắm rộng rãi. Spa trị liệu ở đây phục vụ kỹ năng rất tốt.'],
            ['cust_idx' => 8, 'type' => $lpStandard, 'stars' => 5, 'comment' => 'Phòng cách âm tốt, yên tĩnh tuyệt đối. Nhân viên sảnh đón tiếp chu đáo nhiệt tình, hỗ trợ checkin sớm.'],
            ['cust_idx' => 9, 'type' => $lpSuperior, 'stars' => 5, 'comment' => 'Buffet ăn sáng tuyệt vời với nhiều lựa chọn phong phú. Thích nhất góc làm việc cạnh cửa sổ sát đất.'],
            ['cust_idx' => 10, 'type' => $lpDeluxe, 'stars' => 5, 'comment' => 'Khách sạn đẳng cấp 5 sao thực sự từ cách phục vụ nhỏ nhất. Suite rộng rãi mát mẻ, dọn phòng rất sạch.'],
            ['cust_idx' => 11, 'type' => $lpStandard, 'stars' => 4, 'comment' => 'Phòng bài trí đẹp mắt, tiện nghi đầy đủ. Chỉ có vòi sen đứng lực nước hơi mạnh quá, còn lại bồn tắm nằm thì rất tuyệt.'],
            ['cust_idx' => 12, 'type' => $lpSuperior, 'stars' => 5, 'comment' => 'Cảm giác thư giãn hoàn toàn. View thành phố ngắm pháo hoa từ ban công là trải nghiệm tuyệt vời nhất.'],
            ['cust_idx' => 13, 'type' => $lpDeluxe, 'stars' => 5, 'comment' => 'Phòng suite thiết kế thông minh, cách chia phòng khách riêng tư rất tốt. Bàn trang điểm và tủ quần áo lớn.'],
            ['cust_idx' => 14, 'type' => $lpStandard, 'stars' => 5, 'comment' => 'Một trong những khách sạn JW Marriott tốt nhất tôi từng ở. Cả phòng ốc lẫn thái độ phục vụ đều đạt điểm tối đa.'],
            ['cust_idx' => 1, 'type' => $lpFamily, 'stars' => 5, 'comment' => 'Phòng Family Premium cực kỳ tiện lợi cho gia đình có con nhỏ. Có 2 phòng ngủ riêng biệt nên bố mẹ và các con đều có không gian riêng tư. Dịch vụ tuyệt vời!'],
            ['cust_idx' => 5, 'type' => $lpFamily, 'stars' => 5, 'comment' => 'Kỳ nghỉ gia đình hoàn hảo. Suite có bếp nhỏ tiện nghi, phòng khách rộng rãi đón ánh sáng tự nhiên. Trẻ em rất thích hồ bơi của khách sạn.'],
        ];

        foreach ($reviews as $rev) {
            DB::table('danh_gia_trai_nghiem')->insert([
                'khach_hang_id' => $customers[$rev['cust_idx']]->nguoi_dung_id,
                'loai_phong_id' => $rev['type']->loai_phong_id,
                'so_sao' => $rev['stars'],
                'binh_luan' => $rev['comment'],
                'ngay_danh_gia' => date('Y-m-d', strtotime('-' . rand(5, 120) . ' days')),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // -------------------------------------------------------------
        // 10. BẢNG: THONG_TIN_KHACH_SAN (Official JW Marriott Profile)
        // -------------------------------------------------------------
        ThongTinKhachSan::create([
            'ten_khach_san' => 'Khách sạn Marriott',
            'dia_chi' => 'Nhiều vị trí đắc địa tại Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Phú Quốc',
            'so_dien_thoai' => '1800 123456',
            'gio_checkin_chuan' => '14:00:00',
            'gio_checkout_chuan' => '12:00:00'
        ]);
    }
}