-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 10, 2026 at 06:53 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel_booking_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_dat_phong`
--

DROP TABLE IF EXISTS `chi_tiet_dat_phong`;
CREATE TABLE IF NOT EXISTS `chi_tiet_dat_phong` (
  `chi_tiet_dat_phong_id` int NOT NULL AUTO_INCREMENT,
  `don_dat_id` int NOT NULL,
  `phong_id` int NOT NULL,
  `gia_ap_dung` decimal(10,2) NOT NULL,
  `phong_id_ban_dau` int DEFAULT NULL,
  `trang_thai` enum('booked','checked_in','checked_out','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'booked',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`chi_tiet_dat_phong_id`),
  UNIQUE KEY `unique_phong_trong_don` (`don_dat_id`,`phong_id`),
  KEY `chi_tiet_dat_phong_phong_id_foreign` (`phong_id`),
  KEY `chi_tiet_dat_phong_phong_id_ban_dau_foreign` (`phong_id_ban_dau`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chi_tiet_dat_phong`
--

INSERT INTO `chi_tiet_dat_phong` (`chi_tiet_dat_phong_id`, `don_dat_id`, `phong_id`, `gia_ap_dung`, `phong_id_ban_dau`, `trang_thai`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 4800000.00, NULL, 'checked_out', NULL, NULL),
(2, 2, 4, 6200000.00, NULL, 'checked_out', NULL, NULL),
(3, 3, 31, 9800000.00, NULL, 'checked_out', NULL, NULL),
(4, 4, 2, 4800000.00, NULL, 'checked_out', NULL, NULL),
(5, 5, 59, 26000000.00, NULL, 'checked_out', NULL, NULL),
(6, 6, 9, 6200000.00, NULL, 'checked_out', NULL, NULL),
(7, 7, 61, 4800000.00, NULL, 'checked_out', NULL, NULL),
(8, 8, 32, 9800000.00, NULL, 'checked_out', NULL, NULL),
(9, 9, 1, 4800000.00, NULL, 'checked_out', NULL, NULL),
(10, 10, 4, 6200000.00, NULL, 'checked_out', NULL, NULL),
(11, 11, 60, 26000000.00, NULL, 'checked_out', NULL, NULL),
(12, 12, 62, 4800000.00, NULL, 'checked_out', NULL, NULL),
(13, 13, 31, 9800000.00, NULL, 'checked_out', NULL, NULL),
(14, 14, 2, 4800000.00, NULL, 'checked_out', NULL, NULL),
(15, 15, 9, 6200000.00, NULL, 'checked_out', NULL, NULL),
(16, 16, 59, 26000000.00, NULL, 'checked_out', NULL, NULL),
(17, 17, 61, 4800000.00, NULL, 'checked_out', NULL, NULL),
(18, 18, 32, 9800000.00, NULL, 'cancelled', NULL, NULL),
(19, 19, 1, 4800000.00, NULL, 'checked_out', NULL, NULL),
(20, 20, 4, 6200000.00, NULL, 'checked_out', NULL, NULL),
(21, 21, 31, 9800000.00, NULL, 'checked_out', NULL, NULL),
(22, 22, 62, 4800000.00, NULL, 'cancelled', NULL, NULL),
(23, 23, 2, 4800000.00, NULL, 'checked_out', NULL, NULL),
(24, 24, 9, 6200000.00, NULL, 'checked_out', NULL, NULL),
(25, 25, 32, 9800000.00, NULL, 'checked_out', NULL, NULL),
(26, 26, 61, 4800000.00, NULL, 'checked_out', NULL, NULL),
(27, 27, 4, 4800000.00, NULL, 'checked_in', NULL, NULL),
(28, 28, 31, 6200000.00, NULL, 'checked_in', NULL, NULL),
(29, 29, 59, 4800000.00, NULL, 'checked_in', NULL, NULL),
(30, 30, 1, 4800000.00, NULL, 'booked', NULL, NULL),
(31, 31, 9, 6200000.00, NULL, 'booked', NULL, NULL),
(32, 32, 32, 9800000.00, NULL, 'booked', NULL, NULL),
(33, 33, 60, 26000000.00, NULL, 'booked', NULL, NULL),
(34, 34, 62, 4800000.00, NULL, 'booked', NULL, NULL),
(35, 39, 18, 9800000.00, NULL, 'booked', NULL, NULL),
(36, 42, 2, 4800000.00, NULL, 'checked_in', NULL, NULL),
(37, 43, 1, 4800000.00, NULL, 'booked', NULL, NULL),
(38, 45, 2, 4800000.00, NULL, 'booked', NULL, NULL),
(39, 47, 3, 4800000.00, NULL, 'booked', NULL, NULL),
(40, 49, 6, 4800000.00, NULL, 'booked', NULL, NULL),
(41, 52, 1, 4800000.00, NULL, 'booked', NULL, NULL),
(42, 55, 2, 4800000.00, NULL, 'booked', NULL, NULL),
(43, 58, 3, 4800000.00, NULL, 'booked', NULL, NULL),
(44, 61, 7, 4800000.00, NULL, 'booked', NULL, NULL),
(45, 64, 21, 4800000.00, NULL, 'booked', NULL, NULL),
(46, 67, 22, 4800000.00, NULL, 'booked', NULL, NULL),
(47, 70, 23, 4800000.00, NULL, 'booked', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_tien_nghi`
--

DROP TABLE IF EXISTS `chi_tiet_tien_nghi`;
CREATE TABLE IF NOT EXISTS `chi_tiet_tien_nghi` (
  `tien_nghi_id` int NOT NULL,
  `phong_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`tien_nghi_id`,`phong_id`),
  KEY `chi_tiet_tien_nghi_phong_id_foreign` (`phong_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chi_tiet_tien_nghi`
--

INSERT INTO `chi_tiet_tien_nghi` (`tien_nghi_id`, `phong_id`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL),
(1, 2, NULL, NULL),
(1, 3, NULL, NULL),
(1, 4, NULL, NULL),
(1, 5, NULL, NULL),
(1, 6, NULL, NULL),
(1, 7, NULL, NULL),
(1, 8, NULL, NULL),
(1, 9, NULL, NULL),
(1, 10, NULL, NULL),
(1, 11, NULL, NULL),
(1, 12, NULL, NULL),
(1, 13, NULL, NULL),
(1, 14, NULL, NULL),
(1, 15, NULL, NULL),
(1, 16, NULL, NULL),
(1, 17, NULL, NULL),
(1, 18, NULL, NULL),
(1, 19, NULL, NULL),
(1, 20, NULL, NULL),
(1, 21, NULL, NULL),
(1, 22, NULL, NULL),
(1, 23, NULL, NULL),
(1, 24, NULL, NULL),
(1, 25, NULL, NULL),
(1, 26, NULL, NULL),
(1, 27, NULL, NULL),
(1, 28, NULL, NULL),
(1, 29, NULL, NULL),
(1, 30, NULL, NULL),
(1, 31, NULL, NULL),
(1, 32, NULL, NULL),
(1, 33, NULL, NULL),
(1, 34, NULL, NULL),
(1, 35, NULL, NULL),
(1, 36, NULL, NULL),
(1, 37, NULL, NULL),
(1, 38, NULL, NULL),
(1, 39, NULL, NULL),
(1, 40, NULL, NULL),
(1, 41, NULL, NULL),
(1, 42, NULL, NULL),
(1, 43, NULL, NULL),
(1, 44, NULL, NULL),
(1, 45, NULL, NULL),
(1, 46, NULL, NULL),
(1, 47, NULL, NULL),
(1, 48, NULL, NULL),
(1, 49, NULL, NULL),
(1, 50, NULL, NULL),
(1, 51, NULL, NULL),
(1, 52, NULL, NULL),
(1, 53, NULL, NULL),
(1, 54, NULL, NULL),
(1, 55, NULL, NULL),
(1, 56, NULL, NULL),
(1, 57, NULL, NULL),
(1, 58, NULL, NULL),
(1, 59, NULL, NULL),
(1, 60, NULL, NULL),
(1, 61, NULL, NULL),
(1, 62, NULL, NULL),
(1, 63, NULL, NULL),
(1, 64, NULL, NULL),
(1, 65, NULL, NULL),
(1, 66, NULL, NULL),
(1, 67, NULL, NULL),
(1, 68, NULL, NULL),
(1, 69, NULL, NULL),
(1, 70, NULL, NULL),
(1, 71, NULL, NULL),
(1, 72, NULL, NULL),
(1, 73, NULL, NULL),
(1, 74, NULL, NULL),
(1, 75, NULL, NULL),
(1, 76, NULL, NULL),
(1, 77, NULL, NULL),
(1, 78, NULL, NULL),
(1, 79, NULL, NULL),
(1, 80, NULL, NULL),
(2, 1, NULL, NULL),
(2, 2, NULL, NULL),
(2, 3, NULL, NULL),
(2, 4, NULL, NULL),
(2, 5, NULL, NULL),
(2, 6, NULL, NULL),
(2, 7, NULL, NULL),
(2, 8, NULL, NULL),
(2, 9, NULL, NULL),
(2, 21, NULL, NULL),
(2, 22, NULL, NULL),
(2, 23, NULL, NULL),
(2, 24, NULL, NULL),
(2, 25, NULL, NULL),
(2, 26, NULL, NULL),
(2, 27, NULL, NULL),
(2, 28, NULL, NULL),
(2, 29, NULL, NULL),
(2, 41, NULL, NULL),
(2, 42, NULL, NULL),
(2, 43, NULL, NULL),
(2, 44, NULL, NULL),
(2, 45, NULL, NULL),
(2, 46, NULL, NULL),
(2, 47, NULL, NULL),
(2, 48, NULL, NULL),
(2, 49, NULL, NULL),
(2, 61, NULL, NULL),
(2, 62, NULL, NULL),
(2, 63, NULL, NULL),
(2, 64, NULL, NULL),
(2, 65, NULL, NULL),
(2, 66, NULL, NULL),
(2, 67, NULL, NULL),
(2, 68, NULL, NULL),
(2, 69, NULL, NULL),
(3, 1, NULL, NULL),
(3, 2, NULL, NULL),
(3, 3, NULL, NULL),
(3, 4, NULL, NULL),
(3, 5, NULL, NULL),
(3, 6, NULL, NULL),
(3, 7, NULL, NULL),
(3, 8, NULL, NULL),
(3, 9, NULL, NULL),
(3, 10, NULL, NULL),
(3, 11, NULL, NULL),
(3, 12, NULL, NULL),
(3, 13, NULL, NULL),
(3, 14, NULL, NULL),
(3, 15, NULL, NULL),
(3, 16, NULL, NULL),
(3, 17, NULL, NULL),
(3, 18, NULL, NULL),
(3, 19, NULL, NULL),
(3, 20, NULL, NULL),
(3, 21, NULL, NULL),
(3, 22, NULL, NULL),
(3, 23, NULL, NULL),
(3, 24, NULL, NULL),
(3, 25, NULL, NULL),
(3, 26, NULL, NULL),
(3, 27, NULL, NULL),
(3, 28, NULL, NULL),
(3, 29, NULL, NULL),
(3, 30, NULL, NULL),
(3, 31, NULL, NULL),
(3, 32, NULL, NULL),
(3, 33, NULL, NULL),
(3, 34, NULL, NULL),
(3, 35, NULL, NULL),
(3, 36, NULL, NULL),
(3, 37, NULL, NULL),
(3, 38, NULL, NULL),
(3, 39, NULL, NULL),
(3, 40, NULL, NULL),
(3, 41, NULL, NULL),
(3, 42, NULL, NULL),
(3, 43, NULL, NULL),
(3, 44, NULL, NULL),
(3, 45, NULL, NULL),
(3, 46, NULL, NULL),
(3, 47, NULL, NULL),
(3, 48, NULL, NULL),
(3, 49, NULL, NULL),
(3, 50, NULL, NULL),
(3, 51, NULL, NULL),
(3, 52, NULL, NULL),
(3, 53, NULL, NULL),
(3, 54, NULL, NULL),
(3, 55, NULL, NULL),
(3, 56, NULL, NULL),
(3, 57, NULL, NULL),
(3, 58, NULL, NULL),
(3, 59, NULL, NULL),
(3, 60, NULL, NULL),
(3, 61, NULL, NULL),
(3, 62, NULL, NULL),
(3, 63, NULL, NULL),
(3, 64, NULL, NULL),
(3, 65, NULL, NULL),
(3, 66, NULL, NULL),
(3, 67, NULL, NULL),
(3, 68, NULL, NULL),
(3, 69, NULL, NULL),
(3, 70, NULL, NULL),
(3, 71, NULL, NULL),
(3, 72, NULL, NULL),
(3, 73, NULL, NULL),
(3, 74, NULL, NULL),
(3, 75, NULL, NULL),
(3, 76, NULL, NULL),
(3, 77, NULL, NULL),
(3, 78, NULL, NULL),
(3, 79, NULL, NULL),
(3, 80, NULL, NULL),
(4, 1, NULL, NULL),
(4, 2, NULL, NULL),
(4, 3, NULL, NULL),
(4, 4, NULL, NULL),
(4, 5, NULL, NULL),
(4, 6, NULL, NULL),
(4, 7, NULL, NULL),
(4, 8, NULL, NULL),
(4, 9, NULL, NULL),
(4, 10, NULL, NULL),
(4, 11, NULL, NULL),
(4, 12, NULL, NULL),
(4, 13, NULL, NULL),
(4, 14, NULL, NULL),
(4, 15, NULL, NULL),
(4, 16, NULL, NULL),
(4, 17, NULL, NULL),
(4, 18, NULL, NULL),
(4, 19, NULL, NULL),
(4, 20, NULL, NULL),
(4, 21, NULL, NULL),
(4, 22, NULL, NULL),
(4, 23, NULL, NULL),
(4, 24, NULL, NULL),
(4, 25, NULL, NULL),
(4, 26, NULL, NULL),
(4, 27, NULL, NULL),
(4, 28, NULL, NULL),
(4, 29, NULL, NULL),
(4, 30, NULL, NULL),
(4, 31, NULL, NULL),
(4, 32, NULL, NULL),
(4, 33, NULL, NULL),
(4, 34, NULL, NULL),
(4, 35, NULL, NULL),
(4, 36, NULL, NULL),
(4, 37, NULL, NULL),
(4, 38, NULL, NULL),
(4, 39, NULL, NULL),
(4, 40, NULL, NULL),
(4, 41, NULL, NULL),
(4, 42, NULL, NULL),
(4, 43, NULL, NULL),
(4, 44, NULL, NULL),
(4, 45, NULL, NULL),
(4, 46, NULL, NULL),
(4, 47, NULL, NULL),
(4, 48, NULL, NULL),
(4, 49, NULL, NULL),
(4, 50, NULL, NULL),
(4, 51, NULL, NULL),
(4, 52, NULL, NULL),
(4, 53, NULL, NULL),
(4, 54, NULL, NULL),
(4, 55, NULL, NULL),
(4, 56, NULL, NULL),
(4, 57, NULL, NULL),
(4, 58, NULL, NULL),
(4, 59, NULL, NULL),
(4, 60, NULL, NULL),
(4, 61, NULL, NULL),
(4, 62, NULL, NULL),
(4, 63, NULL, NULL),
(4, 64, NULL, NULL),
(4, 65, NULL, NULL),
(4, 66, NULL, NULL),
(4, 67, NULL, NULL),
(4, 68, NULL, NULL),
(4, 69, NULL, NULL),
(4, 70, NULL, NULL),
(4, 71, NULL, NULL),
(4, 72, NULL, NULL),
(4, 73, NULL, NULL),
(4, 74, NULL, NULL),
(4, 75, NULL, NULL),
(4, 76, NULL, NULL),
(4, 77, NULL, NULL),
(4, 78, NULL, NULL),
(4, 79, NULL, NULL),
(4, 80, NULL, NULL),
(5, 10, NULL, NULL),
(5, 11, NULL, NULL),
(5, 12, NULL, NULL),
(5, 16, NULL, NULL),
(5, 17, NULL, NULL),
(5, 18, NULL, NULL),
(5, 19, NULL, NULL),
(5, 20, NULL, NULL),
(5, 30, NULL, NULL),
(5, 31, NULL, NULL),
(5, 32, NULL, NULL),
(5, 36, NULL, NULL),
(5, 37, NULL, NULL),
(5, 38, NULL, NULL),
(5, 39, NULL, NULL),
(5, 40, NULL, NULL),
(5, 50, NULL, NULL),
(5, 51, NULL, NULL),
(5, 52, NULL, NULL),
(5, 56, NULL, NULL),
(5, 57, NULL, NULL),
(5, 58, NULL, NULL),
(5, 59, NULL, NULL),
(5, 60, NULL, NULL),
(5, 70, NULL, NULL),
(5, 71, NULL, NULL),
(5, 72, NULL, NULL),
(5, 76, NULL, NULL),
(5, 77, NULL, NULL),
(5, 78, NULL, NULL),
(5, 79, NULL, NULL),
(5, 80, NULL, NULL),
(6, 10, NULL, NULL),
(6, 11, NULL, NULL),
(6, 12, NULL, NULL),
(6, 13, NULL, NULL),
(6, 14, NULL, NULL),
(6, 15, NULL, NULL),
(6, 16, NULL, NULL),
(6, 17, NULL, NULL),
(6, 18, NULL, NULL),
(6, 19, NULL, NULL),
(6, 20, NULL, NULL),
(6, 30, NULL, NULL),
(6, 31, NULL, NULL),
(6, 32, NULL, NULL),
(6, 33, NULL, NULL),
(6, 34, NULL, NULL),
(6, 35, NULL, NULL),
(6, 36, NULL, NULL),
(6, 37, NULL, NULL),
(6, 38, NULL, NULL),
(6, 39, NULL, NULL),
(6, 40, NULL, NULL),
(6, 50, NULL, NULL),
(6, 51, NULL, NULL),
(6, 52, NULL, NULL),
(6, 53, NULL, NULL),
(6, 54, NULL, NULL),
(6, 55, NULL, NULL),
(6, 56, NULL, NULL),
(6, 57, NULL, NULL),
(6, 58, NULL, NULL),
(6, 59, NULL, NULL),
(6, 60, NULL, NULL),
(6, 70, NULL, NULL),
(6, 71, NULL, NULL),
(6, 72, NULL, NULL),
(6, 73, NULL, NULL),
(6, 74, NULL, NULL),
(6, 75, NULL, NULL),
(6, 76, NULL, NULL),
(6, 77, NULL, NULL),
(6, 78, NULL, NULL),
(6, 79, NULL, NULL),
(6, 80, NULL, NULL),
(7, 10, NULL, NULL),
(7, 11, NULL, NULL),
(7, 12, NULL, NULL),
(7, 13, NULL, NULL),
(7, 14, NULL, NULL),
(7, 15, NULL, NULL),
(7, 16, NULL, NULL),
(7, 17, NULL, NULL),
(7, 18, NULL, NULL),
(7, 19, NULL, NULL),
(7, 20, NULL, NULL),
(7, 30, NULL, NULL),
(7, 31, NULL, NULL),
(7, 32, NULL, NULL),
(7, 33, NULL, NULL),
(7, 34, NULL, NULL),
(7, 35, NULL, NULL),
(7, 36, NULL, NULL),
(7, 37, NULL, NULL),
(7, 38, NULL, NULL),
(7, 39, NULL, NULL),
(7, 40, NULL, NULL),
(7, 50, NULL, NULL),
(7, 51, NULL, NULL),
(7, 52, NULL, NULL),
(7, 53, NULL, NULL),
(7, 54, NULL, NULL),
(7, 55, NULL, NULL),
(7, 56, NULL, NULL),
(7, 57, NULL, NULL),
(7, 58, NULL, NULL),
(7, 59, NULL, NULL),
(7, 60, NULL, NULL),
(7, 70, NULL, NULL),
(7, 71, NULL, NULL),
(7, 72, NULL, NULL),
(7, 73, NULL, NULL),
(7, 74, NULL, NULL),
(7, 75, NULL, NULL),
(7, 76, NULL, NULL),
(7, 77, NULL, NULL),
(7, 78, NULL, NULL),
(7, 79, NULL, NULL),
(7, 80, NULL, NULL),
(8, 4, NULL, NULL),
(8, 5, NULL, NULL),
(8, 8, NULL, NULL),
(8, 9, NULL, NULL),
(8, 13, NULL, NULL),
(8, 14, NULL, NULL),
(8, 15, NULL, NULL),
(8, 19, NULL, NULL),
(8, 20, NULL, NULL),
(8, 24, NULL, NULL),
(8, 25, NULL, NULL),
(8, 28, NULL, NULL),
(8, 29, NULL, NULL),
(8, 33, NULL, NULL),
(8, 34, NULL, NULL),
(8, 35, NULL, NULL),
(8, 39, NULL, NULL),
(8, 40, NULL, NULL),
(8, 44, NULL, NULL),
(8, 45, NULL, NULL),
(8, 48, NULL, NULL),
(8, 49, NULL, NULL),
(8, 53, NULL, NULL),
(8, 54, NULL, NULL),
(8, 55, NULL, NULL),
(8, 59, NULL, NULL),
(8, 60, NULL, NULL),
(8, 64, NULL, NULL),
(8, 65, NULL, NULL),
(8, 68, NULL, NULL),
(8, 69, NULL, NULL),
(8, 73, NULL, NULL),
(8, 74, NULL, NULL),
(8, 75, NULL, NULL),
(8, 79, NULL, NULL),
(8, 80, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `danh_gia_trai_nghiem`
--

DROP TABLE IF EXISTS `danh_gia_trai_nghiem`;
CREATE TABLE IF NOT EXISTS `danh_gia_trai_nghiem` (
  `danh_gia_id` int NOT NULL AUTO_INCREMENT,
  `khach_hang_id` int NOT NULL,
  `loai_phong_id` int NOT NULL,
  `so_sao` int NOT NULL,
  `binh_luan` text COLLATE utf8mb4_unicode_ci,
  `ngay_danh_gia` date NOT NULL DEFAULT (curdate()),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`danh_gia_id`),
  KEY `danh_gia_trai_nghiem_khach_hang_id_foreign` (`khach_hang_id`),
  KEY `danh_gia_trai_nghiem_loai_phong_id_foreign` (`loai_phong_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `danh_gia_trai_nghiem`
--

INSERT INTO `danh_gia_trai_nghiem` (`danh_gia_id`, `khach_hang_id`, `loai_phong_id`, `so_sao`, `binh_luan`, `ngay_danh_gia`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 5, 'Phòng Deluxe City View cực kỳ rộng rãi và sang trọng. Dù là hạng cơ bản nhưng vẫn có bồn tắm nằm và view kính ngắm trọn vẹn thành phố rất đẹp.', '2026-06-05', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(2, 6, 2, 5, 'Đặc quyền Executive Lounge tại tầng 19 rất đáng tiền! Phục vụ ăn sáng ngon, đồ uống tối pha chế chuẩn vị. Nhân viên vô cùng chuyên nghiệp.', '2026-05-16', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(3, 7, 3, 5, 'Executive Suite rộng rãi có phòng khách riêng cực tiện để tiếp đối tác. Bồn tắm đá cẩm thạch rất đẹp, đồ ăn phục vụ phòng ngon.', '2026-06-02', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(4, 8, 1, 4, 'Giường rất êm, ngủ ngon giấc. Chỉ tiếc là giờ cao điểm thang máy hơi đông một chút, còn lại mọi dịch vụ đều tuyệt vời.', '2026-05-03', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(5, 9, 4, 5, 'Trải nghiệm đỉnh cao tại Presidential Penthouse! Phòng khách vô cùng lộng lẫy, view ôm trọn cảnh quan tuyệt đẹp. Dịch vụ quản gia phục vụ chu đáo.', '2026-07-31', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(6, 10, 2, 5, 'Phòng sạch sẽ, view thành phố lung linh về đêm. Dịch vụ giặt hấp quần áo lấy nhanh vô cùng tiện lợi.', '2026-06-22', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(7, 11, 1, 5, 'Địa điểm khách sạn ngay trung tâm đắc địa, đi lại ăn uống vui chơi đều rất tiện lợi. Sẽ quay lại nhiều lần.', '2026-05-16', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(8, 12, 3, 4, 'Nội thất gỗ trầm ấm cúng đúng phong cách JW Marriott, bồn tắm rộng rãi. Spa trị liệu ở đây phục vụ kỹ năng rất tốt.', '2026-04-24', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(9, 13, 1, 5, 'Phòng cách âm tốt, yên tĩnh tuyệt đối. Nhân viên sảnh đón tiếp chu đáo nhiệt tình, hỗ trợ checkin sớm.', '2026-07-26', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(10, 14, 2, 5, 'Buffet ăn sáng tuyệt vời với nhiều lựa chọn phong phú. Thích nhất góc làm việc cạnh cửa sổ sát đất.', '2026-07-18', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(11, 15, 3, 5, 'Khách sạn đẳng cấp 5 sao thực sự từ cách phục vụ nhỏ nhất. Suite rộng rãi mát mẻ, dọn phòng rất sạch.', '2026-05-27', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(12, 16, 1, 4, 'Phòng bài trí đẹp mắt, tiện nghi đầy đủ. Chỉ có vòi sen đứng lực nước hơi mạnh quá, còn lại bồn tắm nằm thì rất tuyệt.', '2026-08-02', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(13, 17, 2, 5, 'Cảm giác thư giãn hoàn toàn. View thành phố ngắm pháo hoa từ ban công là trải nghiệm tuyệt vời nhất.', '2026-06-15', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(14, 18, 3, 5, 'Phòng suite thiết kế thông minh, cách chia phòng khách riêng tư rất tốt. Bàn trang điểm và tủ quần áo lớn.', '2026-04-20', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(15, 19, 1, 5, 'Một trong những khách sạn JW Marriott tốt nhất tôi từng ở. Cả phòng ốc lẫn thái độ phục vụ đều đạt điểm tối đa.', '2026-07-25', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(16, 6, 5, 5, 'Phòng Family Premium cực kỳ tiện lợi cho gia đình có con nhỏ. Có 2 phòng ngủ riêng biệt nên bố mẹ và các con đều có không gian riêng tư. Dịch vụ tuyệt vời!', '2026-04-14', '2026-08-08 16:45:01', '2026-08-08 16:45:01'),
(17, 10, 5, 5, 'Kỳ nghỉ gia đình hoàn hảo. Suite có bếp nhỏ tiện nghi, phòng khách rộng rãi đón ánh sáng tự nhiên. Trẻ em rất thích hồ bơi của khách sạn.', '2026-04-28', '2026-08-08 16:45:01', '2026-08-08 16:45:01');

-- --------------------------------------------------------

--
-- Table structure for table `dich_vu`
--

DROP TABLE IF EXISTS `dich_vu`;
CREATE TABLE IF NOT EXISTS `dich_vu` (
  `dich_vu_id` int NOT NULL AUTO_INCREMENT,
  `ten_dich_vu` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_dich_vu` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_mac_dinh` decimal(10,2) NOT NULL DEFAULT '0.00',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`dich_vu_id`),
  UNIQUE KEY `dich_vu_ten_dich_vu_unique` (`ten_dich_vu`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dich_vu`
--

INSERT INTO `dich_vu` (`dich_vu_id`, `ten_dich_vu`, `loai_dich_vu`, `gia_mac_dinh`, `mo_ta`, `created_at`, `updated_at`) VALUES
(1, 'Buffet Ăn Sáng', 'Ẩm thực', 450000.00, 'Phục vụ ẩm thực Á-Âu chuẩn quốc tế tại nhà hàng Parkview từ 6:00 - 10:30.', NULL, NULL),
(2, 'Giặt ủi cấp tốc', 'Dịch vụ', 180000.00, 'Giặt hấp cao cấp lấy nhanh trong vòng 3 giờ.', NULL, NULL),
(3, 'Xe đưa đón sân bay', 'Di chuyển', 1200000.00, 'Đưa đón hai chiều sân bay Tân Sơn Nhất bằng dòng xe Mercedes-Benz cao cấp.', NULL, NULL),
(4, 'Massage & Spa Toàn Thân', 'Thư giãn', 1500000.00, 'Liệu trình massage 60 phút thải độc tại Spa by JW.', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `don_dat_phong`
--

DROP TABLE IF EXISTS `don_dat_phong`;
CREATE TABLE IF NOT EXISTS `don_dat_phong` (
  `don_dat_id` int NOT NULL AUTO_INCREMENT,
  `khach_hang_id` int NOT NULL,
  `nguoi_tao_don` int NOT NULL,
  `nguon_dat` enum('ONLINE','OFFLINE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_khuyen_mai_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_dat_don` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_checkin` date NOT NULL,
  `ngay_checkout` date NOT NULL,
  `so_nguoi_lon` int NOT NULL DEFAULT '1',
  `so_tre_em` int NOT NULL DEFAULT '0',
  `tong_tien_phong` decimal(12,2) NOT NULL DEFAULT '0.00',
  `thanh_tien_cuoi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `phan_tram_dat_coc` int NOT NULL DEFAULT '100',
  `so_tien_da_coc` decimal(12,2) NOT NULL DEFAULT '0.00',
  `trang_thai_don` enum('Cho_Xac_Nhan','Da_Xac_Nhan','Da_Thanh_Toan','Dang_O','Da_Tra_Phong','Da_Huy','No_Show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cho_Xac_Nhan',
  `ngay_huy_don` timestamp NULL DEFAULT NULL,
  `ghi_chu_dac_biet` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`don_dat_id`),
  KEY `don_dat_phong_khach_hang_id_foreign` (`khach_hang_id`),
  KEY `don_dat_phong_nguoi_tao_don_foreign` (`nguoi_tao_don`),
  KEY `don_dat_phong_ma_khuyen_mai_id_foreign` (`ma_khuyen_mai_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `don_dat_phong`
--

INSERT INTO `don_dat_phong` (`don_dat_id`, `khach_hang_id`, `nguoi_tao_don`, `nguon_dat`, `ma_khuyen_mai_id`, `ngay_dat_don`, `ngay_checkin`, `ngay_checkout`, `so_nguoi_lon`, `so_tre_em`, `tong_tien_phong`, `thanh_tien_cuoi`, `phan_tram_dat_coc`, `so_tien_da_coc`, `trang_thai_don`, `ngay_huy_don`, `ghi_chu_dac_biet`, `created_at`, `updated_at`) VALUES
(1, 5, 5, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-01-05', '2026-01-08', 1, 0, 14400000.00, 14400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(2, 6, 6, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-01-10', '2026-01-12', 1, 0, 12400000.00, 12400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(3, 7, 7, 'ONLINE', 'JWVIP20', '2026-08-08 16:45:01', '2026-01-15', '2026-01-20', 2, 0, 49000000.00, 46000000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(4, 8, 8, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-01-22', '2026-01-25', 1, 0, 14400000.00, 14400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(5, 9, 9, 'ONLINE', 'JWVIP20', '2026-08-08 16:45:01', '2026-02-02', '2026-02-05', 3, 0, 78000000.00, 75000000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(6, 10, 10, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-02-10', '2026-02-13', 1, 0, 18600000.00, 18600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(7, 11, 11, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-02-14', '2026-02-16', 1, 0, 9600000.00, 9600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(8, 12, 12, 'ONLINE', 'WELCOMEBACK', '2026-08-08 16:45:01', '2026-02-20', '2026-02-24', 2, 0, 39200000.00, 38700000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(9, 13, 13, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-03-01', '2026-03-03', 1, 0, 9600000.00, 9600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(10, 14, 14, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-03-05', '2026-03-08', 1, 0, 18600000.00, 18600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(11, 15, 15, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-03-12', '2026-03-15', 3, 0, 78000000.00, 78000000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(12, 16, 16, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-03-20', '2026-03-23', 1, 0, 14400000.00, 14400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(13, 17, 17, 'ONLINE', 'WELCOMEBACK', '2026-08-08 16:45:01', '2026-04-05', '2026-04-07', 2, 0, 19600000.00, 19100000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(14, 18, 18, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-04-10', '2026-04-15', 1, 0, 24000000.00, 24000000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(15, 19, 19, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-04-18', '2026-04-20', 1, 0, 12400000.00, 12400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(16, 20, 20, 'ONLINE', 'HELLOSUMMER', '2026-08-08 16:45:01', '2026-05-02', '2026-05-06', 3, 0, 104000000.00, 103000000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(17, 21, 21, 'ONLINE', 'HELLOSUMMER', '2026-08-08 16:45:01', '2026-05-10', '2026-05-12', 1, 0, 9600000.00, 8640000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(18, 22, 22, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-05-15', '2026-05-18', 2, 0, 29400000.00, 29400000.00, 100, 0.00, 'Da_Huy', '2026-05-11 17:00:00', NULL, NULL, NULL),
(19, 23, 23, 'ONLINE', 'HELLOSUMMER', '2026-08-08 16:45:01', '2026-06-02', '2026-06-05', 1, 0, 14400000.00, 13400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(20, 24, 24, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-06-10', '2026-06-12', 1, 0, 12400000.00, 12400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(21, 5, 5, 'ONLINE', 'WELCOMEBACK', '2026-08-08 16:45:01', '2026-06-15', '2026-06-18', 2, 0, 29400000.00, 28900000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(22, 6, 6, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-06-20', '2026-06-22', 1, 0, 9600000.00, 9600000.00, 100, 0.00, 'Da_Huy', '2026-06-16 17:00:00', NULL, NULL, NULL),
(23, 7, 7, 'ONLINE', 'HELLOSUMMER', '2026-08-08 16:45:01', '2026-07-01', '2026-07-04', 1, 0, 14400000.00, 13400000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(24, 8, 8, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-07-05', '2026-07-08', 1, 0, 18600000.00, 18600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(25, 9, 9, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-07-10', '2026-07-12', 2, 0, 19600000.00, 19600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(26, 10, 10, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-07-14', '2026-07-16', 1, 0, 9600000.00, 9600000.00, 100, 0.00, 'Da_Tra_Phong', NULL, NULL, NULL, NULL),
(27, 11, 11, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-07-27', '2026-08-08', 1, 0, 57600000.00, 57600000.00, 100, 0.00, 'Dang_O', NULL, NULL, NULL, NULL),
(28, 12, 12, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-07-25', '2026-08-08', 2, 0, 86800000.00, 86800000.00, 100, 0.00, 'Dang_O', NULL, NULL, NULL, NULL),
(29, 13, 13, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-07-29', '2026-08-08', 3, 0, 48000000.00, 48000000.00, 100, 0.00, 'Dang_O', NULL, NULL, NULL, NULL),
(30, 14, 14, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-08-01', '2026-08-03', 1, 0, 9600000.00, 9600000.00, 100, 0.00, 'Da_Xac_Nhan', NULL, NULL, NULL, NULL),
(31, 15, 15, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-08-05', '2026-08-07', 1, 0, 12400000.00, 12400000.00, 100, 0.00, 'Da_Xac_Nhan', NULL, NULL, NULL, NULL),
(32, 16, 16, 'ONLINE', 'HELLOSUMMER', '2026-08-08 16:45:01', '2026-08-10', '2026-08-14', 2, 0, 39200000.00, 38200000.00, 100, 0.00, 'Da_Huy', NULL, NULL, NULL, NULL),
(33, 17, 17, 'ONLINE', 'JWVIP20', '2026-08-08 16:45:01', '2026-08-20', '2026-08-25', 3, 0, 130000000.00, 127000000.00, 100, 0.00, 'Da_Xac_Nhan', NULL, NULL, NULL, NULL),
(34, 18, 18, 'ONLINE', NULL, '2026-08-08 16:45:01', '2026-09-01', '2026-09-04', 1, 0, 14400000.00, 14400000.00, 100, 0.00, 'Da_Huy', NULL, NULL, NULL, NULL),
(39, 29, 2, 'OFFLINE', NULL, '2026-08-08 17:20:24', '2026-08-10', '2026-08-12', 2, 0, 19600000.00, 19600000.00, 100, 0.00, 'Da_Xac_Nhan', NULL, '[Walk-in] Đặt phòng trực tiếp tại quầy lễ tân', NULL, NULL),
(42, 5, 5, 'ONLINE', 'WELCOMEBACK', '2026-08-09 19:01:20', '2026-08-10', '2026-08-11', 1, 0, 4800000.00, 5010000.00, 70, 3507000.00, 'Dang_O', NULL, 'Dịch vụ thêm: Buffet Ăn Sáng (450.000 ₫) | [Tiền cọc: 1000000đ (VNPAY)] | [Tiền phòng đã thu: 5010000đ (VNPAY)]', NULL, NULL),
(43, 31, 31, 'ONLINE', NULL, '2026-08-10 05:36:22', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(44, 1, 1, 'ONLINE', NULL, '2026-08-10 05:36:22', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 05:36:22', NULL, NULL, NULL),
(45, 32, 32, 'ONLINE', NULL, '2026-08-10 05:36:43', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(46, 1, 1, 'ONLINE', NULL, '2026-08-10 05:36:43', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 05:36:43', NULL, NULL, NULL),
(47, 33, 33, 'ONLINE', NULL, '2026-08-10 05:36:53', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(48, 1, 1, 'ONLINE', NULL, '2026-08-10 05:36:53', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 05:36:53', NULL, NULL, NULL),
(49, 34, 34, 'ONLINE', NULL, '2026-08-10 06:05:38', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(50, 1, 1, 'ONLINE', NULL, '2026-08-10 06:05:39', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:05:39', NULL, NULL, NULL),
(51, 1, 1, 'ONLINE', NULL, '2026-08-10 06:05:39', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:05:39', NULL, NULL, NULL),
(52, 36, 36, 'ONLINE', NULL, '2026-08-10 06:09:31', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(53, 1, 1, 'ONLINE', NULL, '2026-08-10 06:09:31', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:09:31', NULL, NULL, NULL),
(54, 1, 1, 'ONLINE', NULL, '2026-08-10 01:09:31', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:09:31', NULL, NULL, NULL),
(55, 38, 38, 'ONLINE', NULL, '2026-08-10 06:10:33', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(56, 1, 1, 'ONLINE', NULL, '2026-08-10 06:10:33', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:10:33', NULL, NULL, NULL),
(57, 1, 1, 'ONLINE', NULL, '2026-08-10 01:10:33', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:10:33', NULL, '2026-08-10 01:10:33', NULL),
(58, 40, 40, 'ONLINE', NULL, '2026-08-10 06:11:00', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(59, 1, 1, 'ONLINE', NULL, '2026-08-10 06:11:00', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:11:00', NULL, NULL, NULL),
(60, 1, 1, 'ONLINE', NULL, '2026-08-10 01:11:00', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:11:00', NULL, '2026-08-10 01:11:00', NULL),
(61, 42, 42, 'ONLINE', NULL, '2026-08-10 06:11:18', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(62, 1, 1, 'ONLINE', NULL, '2026-08-10 06:11:18', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:11:18', NULL, NULL, NULL),
(63, 1, 1, 'ONLINE', NULL, '2026-08-10 01:11:18', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:11:18', NULL, NULL, NULL),
(64, 44, 44, 'ONLINE', NULL, '2026-08-10 06:11:30', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(65, 1, 1, 'ONLINE', NULL, '2026-08-10 06:11:30', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:11:30', NULL, NULL, NULL),
(66, 1, 1, 'ONLINE', NULL, '2026-08-10 01:11:30', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:11:30', NULL, NULL, NULL),
(67, 46, 46, 'ONLINE', NULL, '2026-08-10 06:11:47', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(68, 1, 1, 'ONLINE', NULL, '2026-08-10 06:11:47', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:11:47', NULL, NULL, NULL),
(69, 1, 1, 'ONLINE', NULL, '2026-08-10 01:11:47', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:11:47', NULL, '2026-08-10 01:11:47', NULL),
(70, 48, 48, 'ONLINE', NULL, '2026-08-10 06:14:03', '2026-11-10', '2026-11-12', 2, 0, 9600000.00, 9600000.00, 100, 9600000.00, 'Da_Huy', NULL, 'Đặt phòng trực tuyến nhanh', NULL, NULL),
(71, 1, 1, 'ONLINE', NULL, '2026-08-10 06:14:04', '2026-12-20', '2026-12-22', 2, 0, 3000000.00, 3000000.00, 50, 1500000.00, 'Da_Huy', '2026-08-10 06:14:04', NULL, NULL, NULL),
(72, 1, 1, 'ONLINE', NULL, '2026-08-10 01:14:04', '2026-08-10', '2026-08-12', 2, 0, 2000000.00, 2000000.00, 50, 1000000.00, 'Da_Huy', '2026-08-10 06:14:04', NULL, '2026-08-10 01:14:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `hinh_anh_phong`
--

DROP TABLE IF EXISTS `hinh_anh_phong`;
CREATE TABLE IF NOT EXISTS `hinh_anh_phong` (
  `hinh_anh_id` int NOT NULL AUTO_INCREMENT,
  `phong_id` int NOT NULL,
  `url_hinh_anh` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`hinh_anh_id`),
  KEY `hinh_anh_phong_phong_id_foreign` (`phong_id`)
) ENGINE=InnoDB AUTO_INCREMENT=250 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hoa_don_thanh_toan`
--

DROP TABLE IF EXISTS `hoa_don_thanh_toan`;
CREATE TABLE IF NOT EXISTS `hoa_don_thanh_toan` (
  `hoa_don_id` int NOT NULL AUTO_INCREMENT,
  `don_dat_id` int NOT NULL,
  `nhan_vien_tao_id` int DEFAULT NULL,
  `ngay_thanh_toan` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tong_tien_thanh_toan` decimal(12,2) NOT NULL,
  `hinh_thuc_thanh_toan` enum('VNPAY','OFFLINE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFLINE',
  `ghi_chu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`hoa_don_id`),
  UNIQUE KEY `hoa_don_thanh_toan_don_dat_id_unique` (`don_dat_id`),
  KEY `hoa_don_thanh_toan_nhan_vien_tao_id_foreign` (`nhan_vien_tao_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
CREATE TABLE IF NOT EXISTS `khuyen_mai` (
  `ma_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `phan_tram_giam` int NOT NULL,
  `so_tien_giam_toi_da` decimal(12,2) NOT NULL DEFAULT '0.00',
  `don_hang_toi_thieu` decimal(12,2) NOT NULL DEFAULT '0.00',
  `so_luong_gioi_han` int NOT NULL DEFAULT '100',
  `so_lan_da_su_dung` int NOT NULL DEFAULT '0',
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `ngay_checkin_tu` date DEFAULT NULL,
  `ngay_checkin_den` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ma_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loai_phong`
--

DROP TABLE IF EXISTS `loai_phong`;
CREATE TABLE IF NOT EXISTS `loai_phong` (
  `loai_phong_id` int NOT NULL AUTO_INCREMENT,
  `ten_loai_phong` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gia_theo_dem` decimal(12,2) NOT NULL,
  `dien_tich_m2` int DEFAULT NULL,
  `so_giuong` int NOT NULL DEFAULT '1',
  `so_khach_toi_da` int NOT NULL DEFAULT '2',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`loai_phong_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
CREATE TABLE IF NOT EXISTS `nguoi_dung` (
  `nguoi_dung_id` int NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cccd` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vai_tro` enum('Admin','Le_Tan','Khach_Hang') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Khach_Hang',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`nguoi_dung_id`),
  UNIQUE KEY `nguoi_dung_email_unique` (`email`),
  UNIQUE KEY `nguoi_dung_so_dien_thoai_unique` (`so_dien_thoai`),
  UNIQUE KEY `nguoi_dung_cccd_unique` (`cccd`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phong`
--

DROP TABLE IF EXISTS `phong`;
CREATE TABLE IF NOT EXISTS `phong` (
  `phong_id` int NOT NULL AUTO_INCREMENT,
  `so_phong` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_phong_id` int NOT NULL,
  `tang` int DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `trang_thai_hien_tai` tinyint NOT NULL DEFAULT '0' COMMENT '0: Trong, 1: Dang su dung, 2: Don dep, 3: Bao tri',
  `vi_tri` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`phong_id`),
  UNIQUE KEY `phong_so_phong_unique` (`so_phong`),
  KEY `phong_loai_phong_id_foreign` (`loai_phong_id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thong_tin_khach_san`
--

DROP TABLE IF EXISTS `thong_tin_khach_san`;
CREATE TABLE IF NOT EXISTS `thong_tin_khach_san` (
  `thong_tin_id` int NOT NULL AUTO_INCREMENT,
  `ten_khach_san` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gio_checkin_chuan` time NOT NULL DEFAULT '14:00:00',
  `gio_checkout_chuan` time NOT NULL DEFAULT '12:00:00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`thong_tin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tien_nghi`
--

DROP TABLE IF EXISTS `tien_nghi`;
CREATE TABLE IF NOT EXISTS `tien_nghi` (
  `tien_nghi_id` int NOT NULL AUTO_INCREMENT,
  `ten_tien_nghi` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`tien_nghi_id`),
  UNIQUE KEY `tien_nghi_ten_tien_nghi_unique` (`ten_tien_nghi`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
