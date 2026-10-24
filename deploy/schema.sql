-- Source: sorosoroseoul live schema, no rows or credentials. Existing tables are preserved.
/*M!999999\- enable the sandbox mode */
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: 127.0.0.1    Database: kapp_s001
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `a2_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `a2_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `imageUrl` text NOT NULL,
  `mobileImageUrl` text DEFAULT NULL,
  `linkUrl` text DEFAULT NULL,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `a2_exhibition_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `a2_exhibition_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exhibition_id` int(11) NOT NULL,
  `it_id` varchar(20) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ex` (`exhibition_id`,`sortOrder`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `a2_exhibitions`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `a2_exhibitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(255) NOT NULL DEFAULT '',
  `isActive` int(11) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `a2_login_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `a2_login_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `imageUrl` text NOT NULL,
  `linkUrl` text DEFAULT NULL,
  `isActive` int(11) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `a2_siteSettings`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `a2_siteSettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `settingKey` varchar(100) NOT NULL,
  `settingValue` text NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `settingKey` (`settingKey`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_b2b_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_b2b_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `img_pc` varchar(1000) DEFAULT '',
  `img_mobile` varchar(1000) DEFAULT '',
  `title` varchar(200) DEFAULT '',
  `link_url` varchar(500) DEFAULT '',
  `is_new_window` tinyint(4) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `banner_type` varchar(10) DEFAULT 'image',
  `bg_color` varchar(200) DEFAULT '#1D8A5A',
  `text_title` varchar(300) DEFAULT '',
  `text_sub` varchar(500) DEFAULT '',
  `text_cta` varchar(100) DEFAULT '',
  `text_cta_color` varchar(50) DEFAULT '#ffffff',
  `text_cta_bg` varchar(50) DEFAULT '#1D8A5A',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_url` varchar(500) NOT NULL,
  `link_url` varchar(500) DEFAULT '',
  `title` varchar(200) DEFAULT '',
  `subtitle` varchar(300) DEFAULT '',
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pc_img` varchar(500) DEFAULT '',
  `mo_img` varchar(500) DEFAULT '',
  `app_img` varchar(500) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_category_images`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_category_images` (
  `ca_id` varchar(10) NOT NULL,
  `image_url` varchar(1000) NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ca_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_claims`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_claims` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `od_id` varchar(30) NOT NULL DEFAULT '',
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `claim_type` varchar(10) NOT NULL DEFAULT '',
  `reason` text NOT NULL DEFAULT '',
  `status` varchar(10) NOT NULL DEFAULT '접수',
  `admin_memo` text NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_od_id` (`od_id`),
  KEY `idx_mb_id` (`mb_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_first_purchase_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_first_purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `custom_name` varchar(300) DEFAULT NULL,
  `custom_price` int(11) DEFAULT 100,
  `custom_img` varchar(500) DEFAULT NULL,
  `is_visible` tinyint(4) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fp_it_id` (`it_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_categories`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `icon` varchar(20) DEFAULT '',
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_category_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_category_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cat_id` int(11) NOT NULL,
  `it_id` varchar(100) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gift_item` (`cat_id`,`it_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_order_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `it_id` varchar(30) NOT NULL,
  `it_name` varchar(200) NOT NULL,
  `it_img1` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_orders`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `sender_mb_id` varchar(20) DEFAULT NULL,
  `set_ca_id` varchar(10) NOT NULL,
  `set_name` varchar(100) NOT NULL,
  `slot_count` int(11) NOT NULL DEFAULT 1,
  `recipient_name` varchar(50) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `recipient_postcode` varchar(10) DEFAULT NULL,
  `recipient_address` varchar(200) DEFAULT NULL,
  `recipient_address_detail` varchar(200) DEFAULT NULL,
  `sender_message` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `address_filled_at` datetime DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `admin_memo` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_sender` (`sender_mb_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_package_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_package_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) NOT NULL,
  `it_id` varchar(30) NOT NULL,
  `it_name` varchar(200) NOT NULL,
  `it_img1` varchar(500) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_package` (`package_id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_packages`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` int(11) NOT NULL DEFAULT 0,
  `thumb_img` varchar(500) DEFAULT NULL,
  `ca_id` varchar(10) NOT NULL,
  `item_count` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_set_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_set_config` (
  `ca_id` varchar(10) NOT NULL,
  `slot_count` int(11) NOT NULL DEFAULT 1,
  `price` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`ca_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_gift_set_products`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_gift_set_products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `set_ca_id` varchar(10) NOT NULL,
  `it_id` varchar(30) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_set_item` (`set_ca_id`,`it_id`),
  KEY `idx_set_ca` (`set_ca_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37471 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_image_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_image_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT '',
  `pc_image_url` varchar(1000) DEFAULT '',
  `mobile_image_url` varchar(1000) DEFAULT '',
  `link_url` varchar(500) DEFAULT '',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `banner_type` varchar(10) DEFAULT 'image',
  `bg_color` varchar(200) DEFAULT '#1D8A5A',
  `text_title` varchar(300) DEFAULT '',
  `text_sub` varchar(500) DEFAULT '',
  `text_cta` varchar(100) DEFAULT '',
  `text_cta_color` varchar(50) DEFAULT '#ffffff',
  `text_cta_bg` varchar(50) DEFAULT '#1D8A5A',
  `is_new_window` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_image_source`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_image_source` (
  `it_id` varchar(50) NOT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'original',
  `source_url` text DEFAULT NULL,
  `fetched_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`it_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_inicis_pending`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_inicis_pending` (
  `pending_id` varchar(64) NOT NULL,
  `mb_id` varchar(40) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `price_krw` bigint(20) NOT NULL,
  `payload_json` longtext NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ready',
  `tid` varchar(80) DEFAULT NULL,
  `result_json` longtext DEFAULT NULL,
  `fail_msg` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`pending_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_kcp_pending`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_kcp_pending` (
  `pending_id` varchar(64) NOT NULL,
  `mb_id` varchar(20) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `payload_json` longtext NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ready',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`pending_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_order_events`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_order_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `od_id` varchar(20) NOT NULL,
  `event` varchar(30) NOT NULL,
  `from_status` varchar(20) NOT NULL DEFAULT '',
  `to_status` varchar(20) NOT NULL DEFAULT '',
  `actor` varchar(60) NOT NULL DEFAULT '',
  `refund_amount` int(11) NOT NULL DEFAULT 0,
  `detail` text DEFAULT NULL,
  `created_at_utc` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_od` (`od_id`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_order_shipments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_order_shipments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `od_id` varchar(20) NOT NULL,
  `carrier_code` varchar(20) NOT NULL,
  `carrier_label` varchar(80) NOT NULL,
  `tracking_no` varchar(40) NOT NULL,
  `ct_ids` varchar(255) NOT NULL DEFAULT '',
  `note` varchar(255) NOT NULL DEFAULT '',
  `shipped_at_utc` datetime NOT NULL,
  `notify_state` varchar(10) NOT NULL DEFAULT 'none',
  `notified_at_utc` datetime DEFAULT NULL,
  `notify_to` varchar(254) NOT NULL DEFAULT '',
  `created_by` varchar(60) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_od_tracking` (`od_id`,`tracking_no`),
  KEY `idx_tracking` (`tracking_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_partnership`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_partnership` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) NOT NULL DEFAULT '',
  `contact_name` varchar(50) NOT NULL DEFAULT '',
  `phone` varchar(30) NOT NULL DEFAULT '',
  `email` varchar(100) NOT NULL DEFAULT '',
  `inquiry_type` varchar(20) NOT NULL DEFAULT '광고',
  `subject` varchar(200) NOT NULL DEFAULT '',
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_reviews`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(100) DEFAULT NULL,
  `it_name` varchar(300) DEFAULT NULL,
  `mb_id` varchar(50) DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `rating` int(11) DEFAULT 5,
  `content` text DEFAULT NULL,
  `is_visible` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_section_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_section_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_type` varchar(50) NOT NULL,
  `it_id` varchar(100) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_section_item` (`section_type`,`it_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_settings`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` varchar(500) NOT NULL DEFAULT '',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_shorts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_shorts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` enum('youtube','instagram') NOT NULL,
  `url` varchar(500) NOT NULL,
  `video_id` varchar(100) DEFAULT NULL,
  `title` varchar(300) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_visible` tinyint(4) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_stripe_pending`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_stripe_pending` (
  `pending_id` varchar(64) NOT NULL,
  `mb_id` varchar(20) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `payload_json` longtext NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ready',
  `stripe_session_id` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`pending_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allddaom_temp_pw`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `allddaom_temp_pw` (
  `mb_id` varchar(20) NOT NULL,
  `temp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`mb_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `b2b_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `b2b_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT '',
  `link_url` varchar(500) DEFAULT '',
  `is_new_window` tinyint(4) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `img_pc` varchar(600) DEFAULT '',
  `img_mobile` varchar(600) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `editor_images`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `editor_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `filename` varchar(200) NOT NULL,
  `mimetype` varchar(100) NOT NULL DEFAULT 'image/jpeg',
  `data` longblob NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_filename` (`filename`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `electric_vehicles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `electric_vehicles` (
  `slug` varchar(50) NOT NULL,
  `maker` varchar(50) NOT NULL,
  `maker_kr` varchar(50) NOT NULL,
  `model` varchar(100) NOT NULL,
  `model_kr` varchar(100) NOT NULL,
  `battery` varchar(100) DEFAULT '',
  `range_info` varchar(100) DEFAULT '',
  `price_info` varchar(100) DEFAULT '',
  `power_info` varchar(150) DEFAULT '',
  `accel_info` varchar(150) DEFAULT '',
  `charge_info` varchar(150) DEFAULT '',
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_verify_codes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `email_verify_codes` (
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_auth`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_auth` (
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `au_menu` varchar(20) NOT NULL DEFAULT '',
  `au_auth` set('r','w','d') NOT NULL DEFAULT '',
  PRIMARY KEY (`mb_id`,`au_menu`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_autosave`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_autosave` (
  `as_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL,
  `as_uid` bigint(20) unsigned NOT NULL,
  `as_subject` varchar(255) NOT NULL,
  `as_content` text NOT NULL,
  `as_datetime` datetime NOT NULL,
  PRIMARY KEY (`as_id`),
  UNIQUE KEY `as_uid` (`as_uid`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_board`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_board` (
  `bo_table` varchar(20) NOT NULL DEFAULT '',
  `gr_id` varchar(255) NOT NULL DEFAULT '',
  `bo_subject` varchar(255) NOT NULL DEFAULT '',
  `bo_mobile_subject` varchar(255) NOT NULL DEFAULT '',
  `bo_device` enum('both','pc','mobile') NOT NULL DEFAULT 'both',
  `bo_admin` varchar(255) NOT NULL DEFAULT '',
  `bo_list_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_read_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_write_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_reply_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_comment_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_upload_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_download_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_html_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_link_level` tinyint(4) NOT NULL DEFAULT 0,
  `bo_count_delete` tinyint(4) NOT NULL DEFAULT 0,
  `bo_count_modify` tinyint(4) NOT NULL DEFAULT 0,
  `bo_read_point` int(11) NOT NULL DEFAULT 0,
  `bo_write_point` int(11) NOT NULL DEFAULT 0,
  `bo_comment_point` int(11) NOT NULL DEFAULT 0,
  `bo_download_point` int(11) NOT NULL DEFAULT 0,
  `bo_use_category` tinyint(4) NOT NULL DEFAULT 0,
  `bo_category_list` text NOT NULL,
  `bo_use_sideview` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_file_content` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_secret` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_dhtml_editor` tinyint(4) NOT NULL DEFAULT 0,
  `bo_select_editor` varchar(50) NOT NULL DEFAULT '',
  `bo_use_rss_view` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_good` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_nogood` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_name` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_signature` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_ip_view` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_list_view` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_list_file` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_list_content` tinyint(4) NOT NULL DEFAULT 0,
  `bo_table_width` int(11) NOT NULL DEFAULT 0,
  `bo_subject_len` int(11) NOT NULL DEFAULT 0,
  `bo_mobile_subject_len` int(11) NOT NULL DEFAULT 0,
  `bo_page_rows` int(11) NOT NULL DEFAULT 0,
  `bo_mobile_page_rows` int(11) NOT NULL DEFAULT 0,
  `bo_new` int(11) NOT NULL DEFAULT 0,
  `bo_hot` int(11) NOT NULL DEFAULT 0,
  `bo_image_width` int(11) NOT NULL DEFAULT 0,
  `bo_skin` varchar(255) NOT NULL DEFAULT '',
  `bo_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `bo_include_head` varchar(255) NOT NULL DEFAULT '',
  `bo_include_tail` varchar(255) NOT NULL DEFAULT '',
  `bo_content_head` text NOT NULL,
  `bo_mobile_content_head` text NOT NULL,
  `bo_content_tail` text NOT NULL,
  `bo_mobile_content_tail` text NOT NULL,
  `bo_insert_content` text NOT NULL,
  `bo_gallery_cols` int(11) NOT NULL DEFAULT 0,
  `bo_gallery_width` int(11) NOT NULL DEFAULT 0,
  `bo_gallery_height` int(11) NOT NULL DEFAULT 0,
  `bo_mobile_gallery_width` int(11) NOT NULL DEFAULT 0,
  `bo_mobile_gallery_height` int(11) NOT NULL DEFAULT 0,
  `bo_upload_size` int(11) NOT NULL DEFAULT 0,
  `bo_reply_order` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_search` tinyint(4) DEFAULT 0,
  `bo_order` int(11) NOT NULL DEFAULT 0,
  `bo_count_write` int(11) NOT NULL DEFAULT 0,
  `bo_count_comment` int(11) NOT NULL DEFAULT 0,
  `bo_write_min` int(11) NOT NULL DEFAULT 0,
  `bo_write_max` int(11) NOT NULL DEFAULT 0,
  `bo_comment_min` int(11) NOT NULL DEFAULT 0,
  `bo_comment_max` int(11) NOT NULL DEFAULT 0,
  `bo_notice` text NOT NULL,
  `bo_upload_count` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_email` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_cert` enum('','cert','adult','hp-cert','hp-adult') NOT NULL DEFAULT '',
  `bo_use_sns` tinyint(4) NOT NULL DEFAULT 0,
  `bo_use_captcha` tinyint(4) NOT NULL DEFAULT 0,
  `bo_sort_field` varchar(255) NOT NULL DEFAULT '',
  `bo_1_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_2_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_3_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_4_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_5_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_6_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_7_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_8_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_9_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_10_subj` varchar(255) NOT NULL DEFAULT '',
  `bo_1` varchar(255) NOT NULL DEFAULT '',
  `bo_2` varchar(255) NOT NULL DEFAULT '',
  `bo_3` varchar(255) NOT NULL DEFAULT '',
  `bo_4` varchar(255) NOT NULL DEFAULT '',
  `bo_5` varchar(255) NOT NULL DEFAULT '',
  `bo_6` varchar(255) NOT NULL DEFAULT '',
  `bo_7` varchar(255) NOT NULL DEFAULT '',
  `bo_8` varchar(255) NOT NULL DEFAULT '',
  `bo_9` varchar(255) NOT NULL DEFAULT '',
  `bo_10` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`bo_table`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_board_file`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_board_file` (
  `bo_table` varchar(20) NOT NULL DEFAULT '',
  `wr_id` int(11) NOT NULL DEFAULT 0,
  `bf_no` int(11) NOT NULL DEFAULT 0,
  `bf_source` varchar(255) NOT NULL DEFAULT '',
  `bf_file` varchar(255) NOT NULL DEFAULT '',
  `bf_download` int(11) NOT NULL,
  `bf_content` text NOT NULL,
  `bf_fileurl` varchar(255) NOT NULL DEFAULT '',
  `bf_thumburl` varchar(255) NOT NULL DEFAULT '',
  `bf_storage` varchar(50) NOT NULL DEFAULT '',
  `bf_filesize` int(11) NOT NULL DEFAULT 0,
  `bf_width` int(11) NOT NULL DEFAULT 0,
  `bf_height` smallint(6) NOT NULL DEFAULT 0,
  `bf_type` tinyint(4) NOT NULL DEFAULT 0,
  `bf_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`bo_table`,`wr_id`,`bf_no`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_board_good`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_board_good` (
  `bg_id` int(11) NOT NULL AUTO_INCREMENT,
  `bo_table` varchar(20) NOT NULL DEFAULT '',
  `wr_id` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `bg_flag` varchar(255) NOT NULL DEFAULT '',
  `bg_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`bg_id`),
  UNIQUE KEY `fkey1` (`bo_table`,`wr_id`,`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_board_hit`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_board_hit` (
  `ht_id` int(11) NOT NULL AUTO_INCREMENT,
  `ht_date` date NOT NULL DEFAULT '0000-00-00',
  `ht_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `gr_id` varchar(30) NOT NULL DEFAULT '',
  `bo_table` varchar(30) NOT NULL DEFAULT '',
  `wr_id` int(11) NOT NULL,
  `hit` int(11) NOT NULL,
  `mb_id` text NOT NULL,
  `ip_list` text NOT NULL,
  PRIMARY KEY (`ht_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_board_new`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_board_new` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bo_table` varchar(20) NOT NULL DEFAULT '',
  `wr_id` int(11) NOT NULL DEFAULT 0,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `bn_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`bn_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=335 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_board_recommend`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_board_recommend` (
  `re_id` int(11) NOT NULL AUTO_INCREMENT,
  `re_date` date NOT NULL DEFAULT '0000-00-00',
  `re_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `gr_id` varchar(30) NOT NULL DEFAULT '',
  `bo_table` varchar(30) NOT NULL DEFAULT '',
  `wr_id` int(11) NOT NULL,
  `hit` int(11) NOT NULL,
  `mb_id` text NOT NULL,
  `ip_list` text NOT NULL,
  PRIMARY KEY (`re_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_cert_history`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_cert_history` (
  `cr_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `cr_company` varchar(255) NOT NULL DEFAULT '',
  `cr_method` varchar(255) NOT NULL DEFAULT '',
  `cr_ip` varchar(255) NOT NULL DEFAULT '',
  `cr_date` date NOT NULL DEFAULT '0000-00-00',
  `cr_time` time NOT NULL DEFAULT '00:00:00',
  PRIMARY KEY (`cr_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_config` (
  `cf_title` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_theme` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_admin` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_admin_email` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_admin_email_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_active_key` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_siteup_key` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_siteup_date` date NOT NULL DEFAULT '0000-00-00',
  `cf_add_script` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_use_point` tinyint(4) NOT NULL DEFAULT 0,
  `cf_point_term` int(11) NOT NULL DEFAULT 0,
  `cf_use_copy_log` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_email_certify` tinyint(4) NOT NULL DEFAULT 0,
  `cf_login_point` int(11) NOT NULL DEFAULT 0,
  `cf_cut_name` tinyint(4) NOT NULL DEFAULT 0,
  `cf_nick_modify` int(11) NOT NULL DEFAULT 0,
  `cf_new_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_new_rows` int(11) NOT NULL DEFAULT 0,
  `cf_search_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_connect_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_faq_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_read_point` int(11) NOT NULL DEFAULT 0,
  `cf_write_point` int(11) NOT NULL DEFAULT 0,
  `cf_comment_point` int(11) NOT NULL DEFAULT 0,
  `cf_download_point` int(11) NOT NULL DEFAULT 0,
  `cf_write_pages` int(11) NOT NULL DEFAULT 0,
  `cf_mobile_pages` int(11) NOT NULL DEFAULT 0,
  `cf_link_target` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_bbs_rewrite` tinyint(4) DEFAULT 0,
  `cf_delay_sec` int(11) DEFAULT 0,
  `cf_filter` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_possible_ip` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_intercept_ip` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_analytics` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_add_meta` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_syndi_token` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_syndi_except` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_member_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_use_homepage` tinyint(4) NOT NULL DEFAULT 0,
  `cf_req_homepage` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_tel` tinyint(4) NOT NULL DEFAULT 0,
  `cf_req_tel` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_hp` tinyint(4) NOT NULL DEFAULT 0,
  `cf_req_hp` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_addr` tinyint(4) NOT NULL DEFAULT 0,
  `cf_req_addr` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_signature` tinyint(4) NOT NULL DEFAULT 0,
  `cf_req_signature` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_profile` tinyint(4) NOT NULL DEFAULT 0,
  `cf_req_profile` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_calendar` int(4) NOT NULL DEFAULT 0,
  `cf_req_calendar` int(4) NOT NULL DEFAULT 0,
  `cf_use_biz` int(4) NOT NULL DEFAULT 0,
  `cf_register_level` tinyint(4) NOT NULL DEFAULT 0,
  `cf_register_point` int(11) NOT NULL DEFAULT 0,
  `cf_icon_level` tinyint(4) NOT NULL DEFAULT 0,
  `cf_use_recommend` tinyint(4) NOT NULL DEFAULT 0,
  `cf_recommend_point` int(11) NOT NULL DEFAULT 0,
  `cf_leave_day` int(11) NOT NULL DEFAULT 0,
  `cf_search_part` int(11) NOT NULL DEFAULT 0,
  `cf_email_use` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_wr_super_admin` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_wr_group_admin` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_wr_board_admin` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_wr_write` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_wr_comment_all` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_mb_super_admin` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_mb_member` tinyint(4) NOT NULL DEFAULT 0,
  `cf_email_po_super_admin` tinyint(4) NOT NULL DEFAULT 0,
  `cf_prohibit_id` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_prohibit_email` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_new_del` int(11) NOT NULL DEFAULT 0,
  `cf_memo_del` int(11) NOT NULL DEFAULT 0,
  `cf_visit_del` int(11) NOT NULL DEFAULT 0,
  `cf_popular_del` int(11) NOT NULL DEFAULT 0,
  `cf_optimize_date` date NOT NULL DEFAULT '0000-00-00',
  `cf_use_member_icon` tinyint(4) NOT NULL DEFAULT 0,
  `cf_member_icon_size` int(11) NOT NULL DEFAULT 0,
  `cf_member_icon_width` int(11) NOT NULL DEFAULT 0,
  `cf_member_icon_height` int(11) NOT NULL DEFAULT 0,
  `cf_member_img_size` int(11) NOT NULL DEFAULT 0,
  `cf_member_img_width` int(11) NOT NULL DEFAULT 0,
  `cf_member_img_height` int(11) NOT NULL DEFAULT 0,
  `cf_login_minutes` int(11) NOT NULL DEFAULT 0,
  `cf_image_extension` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_flash_extension` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_movie_extension` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_formmail_is_member` tinyint(4) NOT NULL DEFAULT 0,
  `cf_page_rows` int(11) NOT NULL DEFAULT 0,
  `cf_mobile_page_rows` int(11) NOT NULL DEFAULT 0,
  `cf_visit` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_max_po_id` int(11) NOT NULL DEFAULT 0,
  `cf_stipulation` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_privacy` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_open_modify` int(11) NOT NULL DEFAULT 0,
  `cf_memo_send_point` int(11) NOT NULL DEFAULT 0,
  `cf_mobile_new_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_mobile_search_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_mobile_connect_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_mobile_faq_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_mobile_member_skin` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_captcha_mp3` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_editor` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_meta_author` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_meta_description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_meta_keyword` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_meta_use_basic` int(11) NOT NULL DEFAULT 1,
  `cf_meta_use_board` int(11) NOT NULL DEFAULT 1,
  `cf_meta_use_content` int(11) NOT NULL DEFAULT 1,
  `cf_meta_use_item` int(11) NOT NULL DEFAULT 1,
  `cf_cert_use` tinyint(4) NOT NULL DEFAULT 0,
  `cf_cert_find` tinyint(4) NOT NULL DEFAULT 0,
  `cf_cert_ipin` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_hp` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_simple` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_kg_cd` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_kg_mid` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_kcb_cd` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_kcp_cd` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_lg_mid` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_lg_mert_key` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_cert_limit` int(11) NOT NULL DEFAULT 0,
  `cf_cert_req` tinyint(4) NOT NULL DEFAULT 0,
  `cf_sms_use` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_sms_type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_icode_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_icode_pw` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_icode_server_ip` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_icode_server_port` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_icode_token_key` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_googl_shorturl_apikey` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_social_login_use` tinyint(4) NOT NULL DEFAULT 0,
  `cf_social_servicelist` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_payco_clientid` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_payco_secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_facebook_appid` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_facebook_secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_twitter_key` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_twitter_secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_google_clientid` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_google_secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_naver_clientid` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_naver_secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_kakao_rest_key` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_kakao_client_secret` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_kakao_js_apikey` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `cf_captcha` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_recaptcha_site_key` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_recaptcha_secret_key` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_main_choice` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_sitemap` int(11) NOT NULL DEFAULT 1,
  `cf_1_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_2_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_3_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_4_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_5_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_6_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_7_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_8_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_9_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_10_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_1` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_2` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_3` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_4` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_5` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_6` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_7` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_8` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_9` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `cf_10` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `lev_cf_1` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '비회원',
  `lev_cf_2` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_3` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_4` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_5` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_6` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_7` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_8` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_9` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `lev_cf_10` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '최고관리자',
  `cf_ban_it_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_ban_it_stx_name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cf_cert_use_seed` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `열 185` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_config2`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_config2` (
  `cf2_id` int(11) NOT NULL AUTO_INCREMENT,
  `cf2_approval_code` varchar(255) NOT NULL DEFAULT '0',
  `cf2_admin_config` varchar(255) NOT NULL DEFAULT '',
  `cf2_panel_config` varchar(255) NOT NULL DEFAULT '',
  `cf2_quick_config` varchar(255) NOT NULL DEFAULT '',
  `cf2_theme_config` varchar(255) NOT NULL DEFAULT '',
  `cf2_theme_design` varchar(255) NOT NULL DEFAULT '',
  `cf2_shop_banner_config` varchar(255) NOT NULL DEFAULT '',
  `cf2_banner_config` varchar(255) NOT NULL DEFAULT '',
  `cf2_review_point` int(11) NOT NULL DEFAULT 0,
  `cf2_photoreview_point` int(11) NOT NULL DEFAULT 0,
  `cf2_vodreview_point` int(11) NOT NULL DEFAULT 0,
  `cf2_snsreview_point` int(11) NOT NULL DEFAULT 0,
  `cf2_opt_price` int(4) NOT NULL DEFAULT 0,
  `cf2_opt_img` int(4) NOT NULL DEFAULT 0,
  `cf2_item_config` varchar(255) NOT NULL DEFAULT '0',
  `cf2_talk_cs_use` int(4) NOT NULL DEFAULT 0,
  `cf2_talk_cs_plugin_key` varchar(255) NOT NULL DEFAULT '',
  `cf2_talk_cs_secret` varchar(255) NOT NULL DEFAULT '',
  `cf2_talk_team_use` int(4) NOT NULL DEFAULT 0,
  `cf2_talk_team_plugin_key` varchar(255) NOT NULL DEFAULT '',
  `cf2_talk_team_secret` varchar(255) NOT NULL DEFAULT '',
  `cf2_talk_1` varchar(255) NOT NULL DEFAULT '',
  `cream_theme_color_basic` varchar(10) NOT NULL DEFAULT '',
  `cream_theme_color_basicover` varchar(10) NOT NULL DEFAULT '',
  `cream_theme_color_basicmenu` varchar(10) NOT NULL DEFAULT '',
  `cream_theme_color_basictopmenufont` varchar(10) NOT NULL DEFAULT '',
  `cream_theme_color_basictopmenubg` varchar(10) NOT NULL DEFAULT '',
  `cream_theme_color_basichighlight` varchar(10) NOT NULL DEFAULT '',
  `cream_theme_foot_notice` varchar(255) NOT NULL DEFAULT '',
  `cream_theme_cstime` varchar(255) NOT NULL DEFAULT '',
  `cream_install_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `cream_install_ip` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`cf2_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_content`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_content` (
  `co_id` varchar(20) NOT NULL DEFAULT '',
  `co_html` tinyint(4) NOT NULL DEFAULT 0,
  `co_subject` varchar(255) NOT NULL DEFAULT '',
  `co_content` longtext NOT NULL,
  `co_seo_title` varchar(255) NOT NULL DEFAULT '',
  `co_mobile_content` longtext NOT NULL,
  `co_skin` varchar(255) NOT NULL DEFAULT '',
  `co_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `co_tag_filter_use` tinyint(4) NOT NULL DEFAULT 0,
  `co_hit` int(11) NOT NULL DEFAULT 0,
  `co_include_head` varchar(255) NOT NULL,
  `co_include_tail` varchar(255) NOT NULL,
  `co_gubun` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`co_id`),
  KEY `co_seo_title` (`co_seo_title`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_faq`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_faq` (
  `fa_id` int(11) NOT NULL AUTO_INCREMENT,
  `fm_id` int(11) NOT NULL DEFAULT 0,
  `fa_subject` text NOT NULL,
  `fa_content` text NOT NULL,
  `fa_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`fa_id`),
  KEY `fm_id` (`fm_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_faq_master`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_faq_master` (
  `fm_id` int(11) NOT NULL AUTO_INCREMENT,
  `fm_subject` varchar(255) NOT NULL DEFAULT '',
  `fm_head_html` text NOT NULL,
  `fm_tail_html` text NOT NULL,
  `fm_mobile_head_html` text NOT NULL,
  `fm_mobile_tail_html` text NOT NULL,
  `fm_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`fm_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_giftMsg`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_giftMsg` (
  `od_id` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `tel` varchar(20) NOT NULL,
  `giftMsg` text NOT NULL,
  PRIMARY KEY (`od_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_group`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_group` (
  `gr_id` varchar(10) NOT NULL DEFAULT '',
  `gr_subject` varchar(255) NOT NULL DEFAULT '',
  `gr_device` enum('both','pc','mobile') NOT NULL DEFAULT 'both',
  `gr_admin` varchar(255) NOT NULL DEFAULT '',
  `gr_use_access` tinyint(4) NOT NULL DEFAULT 0,
  `gr_order` int(11) NOT NULL DEFAULT 0,
  `gr_1_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_2_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_3_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_4_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_5_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_6_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_7_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_8_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_9_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_10_subj` varchar(255) NOT NULL DEFAULT '',
  `gr_1` varchar(255) NOT NULL DEFAULT '',
  `gr_2` varchar(255) NOT NULL DEFAULT '',
  `gr_3` varchar(255) NOT NULL DEFAULT '',
  `gr_4` varchar(255) NOT NULL DEFAULT '',
  `gr_5` varchar(255) NOT NULL DEFAULT '',
  `gr_6` varchar(255) NOT NULL DEFAULT '',
  `gr_7` varchar(255) NOT NULL DEFAULT '',
  `gr_8` varchar(255) NOT NULL DEFAULT '',
  `gr_9` varchar(255) NOT NULL DEFAULT '',
  `gr_10` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`gr_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_group_member`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_group_member` (
  `gm_id` int(11) NOT NULL AUTO_INCREMENT,
  `gr_id` varchar(255) NOT NULL DEFAULT '',
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `gm_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`gm_id`),
  KEY `gr_id` (`gr_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_icecream`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_icecream` (
  `ice_id` int(11) NOT NULL AUTO_INCREMENT,
  `ice_config` varchar(255) NOT NULL DEFAULT '',
  `ice_charge_card` varchar(10) NOT NULL DEFAULT '3.2',
  `ice_charge_vbank` varchar(10) NOT NULL DEFAULT '300',
  `ice_charge_iche` varchar(10) NOT NULL DEFAULT '1.8',
  `ice_charge_kakaopay` varchar(10) NOT NULL DEFAULT '3.5',
  `ice_charge_samsungpay` varchar(10) NOT NULL DEFAULT '3.2',
  `ice_charge_naverpay` varchar(10) NOT NULL DEFAULT '3.5',
  `ice_charge_hp` varchar(10) NOT NULL DEFAULT '9.0',
  `ice_charge_account` varchar(10) NOT NULL DEFAULT '0',
  `ice_charge_etc` varchar(10) NOT NULL DEFAULT '0',
  `ice_charge_default` varchar(10) NOT NULL DEFAULT '0',
  `ice_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`ice_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_krw_jpy_setting`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_krw_jpy_setting` (
  `id` int(11) NOT NULL,
  `rate` decimal(10,4) NOT NULL DEFAULT 0.1500,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_login`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_login` (
  `lo_ip` varchar(100) NOT NULL DEFAULT '',
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `lo_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `lo_location` text NOT NULL,
  `lo_url` text NOT NULL,
  PRIMARY KEY (`lo_ip`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_mail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_mail` (
  `ma_id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_subject` varchar(255) NOT NULL DEFAULT '',
  `ma_content` mediumtext NOT NULL,
  `ma_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ma_ip` varchar(255) NOT NULL DEFAULT '',
  `ma_last_option` text NOT NULL,
  PRIMARY KEY (`ma_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_member`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_member` (
  `mb_no` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `mb_password` varchar(255) NOT NULL DEFAULT '',
  `store_mb_id` varchar(50) NOT NULL,
  `mb_name` varchar(255) NOT NULL DEFAULT '',
  `mb_nick` varchar(255) NOT NULL DEFAULT '',
  `mb_nick_date` date NOT NULL DEFAULT '0000-00-00',
  `mb_email` varchar(255) NOT NULL DEFAULT '',
  `mb_homepage` varchar(255) NOT NULL DEFAULT '',
  `mb_level` tinyint(4) NOT NULL DEFAULT 0,
  `mb_sex` char(1) NOT NULL DEFAULT '',
  `mb_birth` varchar(255) NOT NULL DEFAULT '',
  `mb_tel` varchar(255) NOT NULL DEFAULT '',
  `mb_hp` varchar(255) NOT NULL DEFAULT '',
  `mb_certify` varchar(20) NOT NULL DEFAULT '',
  `mb_adult` tinyint(4) NOT NULL DEFAULT 0,
  `mb_dupinfo` varchar(255) NOT NULL DEFAULT '',
  `mb_zip1` char(3) NOT NULL DEFAULT '',
  `mb_zip2` char(3) NOT NULL DEFAULT '',
  `mb_addr1` varchar(255) NOT NULL DEFAULT '',
  `mb_addr2` varchar(255) NOT NULL DEFAULT '',
  `mb_addr3` varchar(255) NOT NULL DEFAULT '',
  `mb_addr_jibeon` varchar(255) NOT NULL DEFAULT '',
  `mb_signature` text NOT NULL,
  `mb_recommend` varchar(255) NOT NULL DEFAULT '',
  `mb_point` int(11) NOT NULL DEFAULT 0,
  `mb_today_login` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `mb_login_ip` varchar(255) NOT NULL DEFAULT '',
  `mb_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `mb_ip` varchar(255) NOT NULL DEFAULT '',
  `mb_leave_date` varchar(19) DEFAULT NULL,
  `mb_intercept_date` varchar(19) DEFAULT NULL,
  `mb_email_certify` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `mb_email_certify2` varchar(255) NOT NULL DEFAULT '',
  `mb_memo` text NOT NULL,
  `mb_lost_certify` varchar(255) NOT NULL,
  `mb_mailling` tinyint(4) NOT NULL DEFAULT 0,
  `mb_sms` tinyint(4) NOT NULL DEFAULT 0,
  `mb_open` tinyint(4) NOT NULL DEFAULT 0,
  `mb_open_date` date NOT NULL DEFAULT '0000-00-00',
  `mb_profile` text NOT NULL,
  `mb_memo_call` varchar(255) NOT NULL DEFAULT '',
  `mb_premium` varchar(20) NOT NULL DEFAULT '',
  `mb_premium_term` varchar(20) NOT NULL DEFAULT '',
  `mb_premium_start` date NOT NULL DEFAULT '0000-00-00',
  `mb_premium_end` date NOT NULL DEFAULT '0000-00-00',
  `mb_cash` varchar(20) NOT NULL DEFAULT '',
  `mb_shop` varchar(20) NOT NULL DEFAULT '',
  `mb_memo_cnt` int(11) NOT NULL DEFAULT 0,
  `mb_scrap_cnt` int(11) NOT NULL DEFAULT 0,
  `mb_biz_name` varchar(20) NOT NULL DEFAULT '',
  `mb_biz_ceo` varchar(20) NOT NULL DEFAULT '',
  `mb_biz_number` varchar(50) NOT NULL DEFAULT '',
  `mb_biz_conumber` varchar(50) NOT NULL DEFAULT '',
  `mb_biz_phone` varchar(30) NOT NULL DEFAULT '',
  `mb_biz_status` varchar(50) NOT NULL DEFAULT '',
  `mb_biz_industry` varchar(255) NOT NULL DEFAULT '',
  `mb_biz_taxpayer` varchar(50) NOT NULL DEFAULT '',
  `mb_biz_1` varchar(255) NOT NULL DEFAULT '',
  `mb_biz_2` varchar(255) NOT NULL DEFAULT '',
  `mb_biz_3` varchar(255) NOT NULL DEFAULT '',
  `mb_google_calendar` text NOT NULL DEFAULT '',
  `mb_1` varchar(255) NOT NULL DEFAULT '',
  `mb_2` varchar(255) NOT NULL DEFAULT '',
  `mb_3` varchar(255) NOT NULL DEFAULT '',
  `mb_4` varchar(255) NOT NULL DEFAULT '',
  `mb_5` varchar(255) NOT NULL DEFAULT '',
  `mb_6` varchar(255) NOT NULL DEFAULT '',
  `mb_7` varchar(255) NOT NULL DEFAULT '',
  `mb_8` varchar(255) NOT NULL DEFAULT '',
  `mb_9` varchar(255) NOT NULL DEFAULT '',
  `mb_10` varchar(255) NOT NULL DEFAULT '',
  `mb_device` varchar(255) NOT NULL DEFAULT '',
  `mb_personal_fees1` varchar(255) NOT NULL DEFAULT '',
  `mb_personal_fees2` varchar(255) NOT NULL DEFAULT '',
  `mb_personal_fees3` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`mb_no`),
  UNIQUE KEY `mb_id` (`mb_id`),
  KEY `mb_today_login` (`mb_today_login`),
  KEY `mb_datetime` (`mb_datetime`)
) ENGINE=MyISAM AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_member_address`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_member_address` (
  `ma_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `ma_name` varchar(50) NOT NULL DEFAULT '',
  `ma_hp` varchar(20) NOT NULL DEFAULT '',
  `ma_zip1` varchar(10) NOT NULL DEFAULT '',
  `ma_zip2` varchar(10) NOT NULL DEFAULT '',
  `ma_addr1` varchar(200) NOT NULL DEFAULT '',
  `ma_addr2` varchar(200) NOT NULL DEFAULT '',
  `ma_addr3` varchar(200) NOT NULL DEFAULT '',
  `ma_default` char(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ma_id`),
  KEY `idx_mb_id` (`mb_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_member_cert_history`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_member_cert_history` (
  `ch_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `ch_name` varchar(255) NOT NULL DEFAULT '',
  `ch_hp` varchar(255) NOT NULL DEFAULT '',
  `ch_birth` varchar(255) NOT NULL DEFAULT '',
  `ch_type` varchar(20) NOT NULL DEFAULT '',
  `ch_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`ch_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_member_social_profiles`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_member_social_profiles` (
  `mp_no` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `provider` varchar(50) NOT NULL DEFAULT '',
  `object_sha` varchar(45) NOT NULL DEFAULT '',
  `identifier` varchar(255) NOT NULL DEFAULT '',
  `profileurl` varchar(255) NOT NULL DEFAULT '',
  `photourl` varchar(255) NOT NULL DEFAULT '',
  `displayname` varchar(150) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `mp_register_day` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `mp_latest_day` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  UNIQUE KEY `mp_no` (`mp_no`),
  KEY `mb_id` (`mb_id`),
  KEY `provider` (`provider`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_memo`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_memo` (
  `me_id` int(11) NOT NULL AUTO_INCREMENT,
  `me_recv_mb_id` varchar(20) NOT NULL DEFAULT '',
  `me_send_mb_id` varchar(20) NOT NULL DEFAULT '',
  `me_send_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `me_read_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `me_memo` text NOT NULL,
  `me_send_id` int(11) NOT NULL DEFAULT 0,
  `me_type` enum('send','recv') NOT NULL DEFAULT 'recv',
  `me_send_ip` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`me_id`),
  KEY `me_recv_mb_id` (`me_recv_mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_menu`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_menu` (
  `me_id` int(11) NOT NULL AUTO_INCREMENT,
  `me_code` varchar(255) NOT NULL DEFAULT '',
  `me_name` varchar(255) NOT NULL DEFAULT '',
  `me_link` varchar(255) NOT NULL DEFAULT '',
  `me_target` varchar(255) NOT NULL DEFAULT '',
  `me_order` int(11) NOT NULL DEFAULT 0,
  `me_use` tinyint(4) NOT NULL DEFAULT 0,
  `me_mobile_use` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`me_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_new_win`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_new_win` (
  `nw_id` int(11) NOT NULL AUTO_INCREMENT,
  `nw_division` varchar(10) NOT NULL DEFAULT 'both',
  `nw_device` varchar(10) NOT NULL DEFAULT 'both',
  `nw_begin_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `nw_end_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `nw_disable_hours` int(11) NOT NULL DEFAULT 0,
  `nw_left` int(11) NOT NULL DEFAULT 0,
  `nw_top` int(11) NOT NULL DEFAULT 0,
  `nw_height` int(11) NOT NULL DEFAULT 0,
  `nw_width` int(11) NOT NULL DEFAULT 0,
  `nw_padding` int(11) NOT NULL DEFAULT 0,
  `nw_subject` text NOT NULL,
  `nw_content` text NOT NULL,
  `nw_content_html` tinyint(4) NOT NULL DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`nw_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_performans_pick`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_performans_pick` (
  `pp_idx` int(11) NOT NULL AUTO_INCREMENT,
  `pp_title` varchar(255) NOT NULL DEFAULT '',
  `pp_sub_title` varchar(100) DEFAULT NULL,
  `pp_tag` varchar(100) DEFAULT NULL,
  `pp_position` varchar(255) NOT NULL DEFAULT '',
  `pp_show` int(11) NOT NULL DEFAULT 1,
  `pp_count` int(11) NOT NULL DEFAULT 0,
  `pp_start_datetime` datetime NOT NULL,
  `pp_end_datetime` datetime NOT NULL,
  `pp_datetime` datetime NOT NULL,
  `listtype` int(1) DEFAULT NULL,
  PRIMARY KEY (`pp_idx`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_performans_pick_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_performans_pick_item` (
  `pi_idx` int(11) NOT NULL AUTO_INCREMENT,
  `pp_idx` int(11) NOT NULL DEFAULT 0,
  `it_id` varchar(50) NOT NULL DEFAULT '',
  `pi_order` int(11) NOT NULL DEFAULT 0,
  `pi_datetime` datetime NOT NULL,
  PRIMARY KEY (`pi_idx`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_point`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_point` (
  `po_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `po_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `po_content` varchar(255) NOT NULL DEFAULT '',
  `po_point` int(11) NOT NULL DEFAULT 0,
  `po_use_point` int(11) NOT NULL DEFAULT 0,
  `po_expired` tinyint(4) NOT NULL DEFAULT 0,
  `po_expire_date` date NOT NULL DEFAULT '0000-00-00',
  `po_mb_point` int(11) NOT NULL DEFAULT 0,
  `po_rel_table` varchar(20) NOT NULL DEFAULT '',
  `po_rel_id` varchar(20) NOT NULL DEFAULT '',
  `po_rel_action` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`po_id`),
  KEY `index1` (`mb_id`,`po_rel_table`,`po_rel_id`,`po_rel_action`),
  KEY `index2` (`po_expire_date`)
) ENGINE=MyISAM AUTO_INCREMENT=188 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_poll`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_poll` (
  `po_id` int(11) NOT NULL AUTO_INCREMENT,
  `po_subject` varchar(255) NOT NULL DEFAULT '',
  `po_poll1` varchar(255) NOT NULL DEFAULT '',
  `po_poll2` varchar(255) NOT NULL DEFAULT '',
  `po_poll3` varchar(255) NOT NULL DEFAULT '',
  `po_poll4` varchar(255) NOT NULL DEFAULT '',
  `po_poll5` varchar(255) NOT NULL DEFAULT '',
  `po_poll6` varchar(255) NOT NULL DEFAULT '',
  `po_poll7` varchar(255) NOT NULL DEFAULT '',
  `po_poll8` varchar(255) NOT NULL DEFAULT '',
  `po_poll9` varchar(255) NOT NULL DEFAULT '',
  `po_cnt1` int(11) NOT NULL DEFAULT 0,
  `po_cnt2` int(11) NOT NULL DEFAULT 0,
  `po_cnt3` int(11) NOT NULL DEFAULT 0,
  `po_cnt4` int(11) NOT NULL DEFAULT 0,
  `po_cnt5` int(11) NOT NULL DEFAULT 0,
  `po_cnt6` int(11) NOT NULL DEFAULT 0,
  `po_cnt7` int(11) NOT NULL DEFAULT 0,
  `po_cnt8` int(11) NOT NULL DEFAULT 0,
  `po_cnt9` int(11) NOT NULL DEFAULT 0,
  `po_etc` varchar(255) NOT NULL DEFAULT '',
  `po_level` tinyint(4) NOT NULL DEFAULT 0,
  `po_point` int(11) NOT NULL DEFAULT 0,
  `po_date` date NOT NULL DEFAULT '0000-00-00',
  `po_ips` mediumtext NOT NULL,
  `mb_ids` text NOT NULL,
  `po_use` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`po_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_poll_etc`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_poll_etc` (
  `pc_id` int(11) NOT NULL DEFAULT 0,
  `po_id` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `pc_name` varchar(255) NOT NULL DEFAULT '',
  `pc_idea` varchar(255) NOT NULL DEFAULT '',
  `pc_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`pc_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_popular`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_popular` (
  `pp_id` int(11) NOT NULL AUTO_INCREMENT,
  `pp_word` varchar(50) NOT NULL DEFAULT '',
  `pp_date` date NOT NULL DEFAULT '0000-00-00',
  `pp_ip` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`pp_id`),
  UNIQUE KEY `index1` (`pp_date`,`pp_word`,`pp_ip`)
) ENGINE=MyISAM AUTO_INCREMENT=1760 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_qa_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_qa_config` (
  `qa_title` varchar(255) NOT NULL DEFAULT '',
  `qa_category` varchar(255) NOT NULL DEFAULT '',
  `qa_skin` varchar(255) NOT NULL DEFAULT '',
  `qa_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `qa_use_email` tinyint(4) NOT NULL DEFAULT 0,
  `qa_req_email` tinyint(4) NOT NULL DEFAULT 0,
  `qa_use_hp` tinyint(4) NOT NULL DEFAULT 0,
  `qa_req_hp` tinyint(4) NOT NULL DEFAULT 0,
  `qa_use_sms` tinyint(4) NOT NULL DEFAULT 0,
  `qa_send_number` varchar(255) NOT NULL DEFAULT '0',
  `qa_admin_hp` varchar(255) NOT NULL DEFAULT '',
  `qa_admin_email` varchar(255) NOT NULL DEFAULT '',
  `qa_use_editor` tinyint(4) NOT NULL DEFAULT 0,
  `qa_subject_len` int(11) NOT NULL DEFAULT 0,
  `qa_mobile_subject_len` int(11) NOT NULL DEFAULT 0,
  `qa_page_rows` int(11) NOT NULL DEFAULT 0,
  `qa_mobile_page_rows` int(11) NOT NULL DEFAULT 0,
  `qa_image_width` int(11) NOT NULL DEFAULT 0,
  `qa_upload_size` int(11) NOT NULL DEFAULT 0,
  `qa_insert_content` text NOT NULL,
  `qa_include_head` varchar(255) NOT NULL DEFAULT '',
  `qa_include_tail` varchar(255) NOT NULL DEFAULT '',
  `qa_content_head` text NOT NULL,
  `qa_content_tail` text NOT NULL,
  `qa_mobile_content_head` text NOT NULL,
  `qa_mobile_content_tail` text NOT NULL,
  `qa_1_subj` varchar(255) NOT NULL DEFAULT '',
  `qa_2_subj` varchar(255) NOT NULL DEFAULT '',
  `qa_3_subj` varchar(255) NOT NULL DEFAULT '',
  `qa_4_subj` varchar(255) NOT NULL DEFAULT '',
  `qa_5_subj` varchar(255) NOT NULL DEFAULT '',
  `qa_1` varchar(255) NOT NULL DEFAULT '',
  `qa_2` varchar(255) NOT NULL DEFAULT '',
  `qa_3` varchar(255) NOT NULL DEFAULT '',
  `qa_4` varchar(255) NOT NULL DEFAULT '',
  `qa_5` varchar(255) NOT NULL DEFAULT ''
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_qa_content`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_qa_content` (
  `qa_id` int(11) NOT NULL AUTO_INCREMENT,
  `qa_num` int(11) NOT NULL DEFAULT 0,
  `qa_parent` int(11) NOT NULL DEFAULT 0,
  `qa_related` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `qa_name` varchar(255) NOT NULL DEFAULT '',
  `qa_email` varchar(255) NOT NULL DEFAULT '',
  `qa_hp` varchar(255) NOT NULL DEFAULT '',
  `qa_type` tinyint(4) NOT NULL DEFAULT 0,
  `qa_category` varchar(255) NOT NULL DEFAULT '',
  `qa_email_recv` tinyint(4) NOT NULL DEFAULT 0,
  `qa_sms_recv` tinyint(4) NOT NULL DEFAULT 0,
  `qa_html` tinyint(4) NOT NULL DEFAULT 0,
  `qa_subject` varchar(255) NOT NULL DEFAULT '',
  `qa_content` text NOT NULL,
  `qa_status` tinyint(4) NOT NULL DEFAULT 0,
  `qa_file1` varchar(255) NOT NULL DEFAULT '',
  `qa_source1` varchar(255) NOT NULL DEFAULT '',
  `qa_file2` varchar(255) NOT NULL DEFAULT '',
  `qa_source2` varchar(255) NOT NULL DEFAULT '',
  `qa_ip` varchar(255) NOT NULL DEFAULT '',
  `qa_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `qa_1` varchar(255) NOT NULL DEFAULT '',
  `qa_2` varchar(255) NOT NULL DEFAULT '',
  `qa_3` varchar(255) NOT NULL DEFAULT '',
  `qa_4` varchar(255) NOT NULL DEFAULT '',
  `qa_5` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`qa_id`),
  KEY `qa_num_parent` (`qa_num`,`qa_parent`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_scrap`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_scrap` (
  `ms_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `bo_table` varchar(20) NOT NULL DEFAULT '',
  `wr_id` varchar(15) NOT NULL DEFAULT '',
  `ms_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ms_scrap` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`ms_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_admtp`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_admtp` (
  `adm_tp_id` int(11) NOT NULL AUTO_INCREMENT,
  `tp1_subject` varchar(50) NOT NULL DEFAULT '',
  `tp1_explan` varchar(255) NOT NULL DEFAULT '',
  `tp1_item` text NOT NULL,
  `tp1_link` varchar(255) NOT NULL DEFAULT '',
  `tp1_admid` varchar(20) NOT NULL DEFAULT '',
  `tp1_date` date NOT NULL DEFAULT '0000-00-00',
  `tp1_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `tp1_use` int(4) NOT NULL,
  `tp1_etc1` varchar(255) NOT NULL DEFAULT '',
  `tp1_etc2` varchar(255) NOT NULL DEFAULT '',
  `tp1_etc3` varchar(255) NOT NULL DEFAULT '',
  `tp2_subject` varchar(50) NOT NULL DEFAULT '',
  `tp2_explan` varchar(255) NOT NULL DEFAULT '',
  `tp2_item` text NOT NULL,
  `tp2_link` varchar(255) NOT NULL DEFAULT '',
  `tp2_admid` varchar(20) NOT NULL DEFAULT '',
  `tp2_date` date NOT NULL DEFAULT '0000-00-00',
  `tp2_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `tp2_use` int(4) NOT NULL,
  `tp2_etc1` varchar(255) NOT NULL DEFAULT '',
  `tp2_etc2` varchar(255) NOT NULL DEFAULT '',
  `tp2_etc3` varchar(255) NOT NULL DEFAULT '',
  `tp3_subject` varchar(50) NOT NULL DEFAULT '',
  `tp3_explan` varchar(255) NOT NULL DEFAULT '',
  `tp3_item` text NOT NULL,
  `tp3_link` varchar(255) NOT NULL DEFAULT '',
  `tp3_admid` varchar(20) NOT NULL DEFAULT '',
  `tp3_date` date NOT NULL DEFAULT '0000-00-00',
  `tp3_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `tp3_use` int(4) NOT NULL,
  `tp3_etc1` varchar(255) NOT NULL DEFAULT '',
  `tp3_etc2` varchar(255) NOT NULL DEFAULT '',
  `tp3_etc3` varchar(255) NOT NULL DEFAULT '',
  `tp4_subject` varchar(50) NOT NULL DEFAULT '',
  `tp4_explan` varchar(255) NOT NULL DEFAULT '',
  `tp4_item` text NOT NULL,
  `tp4_link` varchar(255) NOT NULL DEFAULT '',
  `tp4_admid` varchar(20) NOT NULL DEFAULT '',
  `tp4_date` date NOT NULL DEFAULT '0000-00-00',
  `tp4_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `tp4_use` int(4) NOT NULL,
  `tp4_etc1` varchar(255) NOT NULL DEFAULT '',
  `tp4_etc2` varchar(255) NOT NULL DEFAULT '',
  `tp4_etc3` varchar(255) NOT NULL DEFAULT '',
  `tp5_subject` varchar(50) NOT NULL DEFAULT '',
  `tp5_explan` varchar(255) NOT NULL DEFAULT '',
  `tp5_item` text NOT NULL,
  `tp5_link` varchar(255) NOT NULL DEFAULT '',
  `tp5_admid` varchar(20) NOT NULL DEFAULT '',
  `tp5_date` date NOT NULL DEFAULT '0000-00-00',
  `tp5_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `tp5_use` int(4) NOT NULL,
  `tp5_etc1` varchar(255) NOT NULL DEFAULT '',
  `tp5_etc2` varchar(255) NOT NULL DEFAULT '',
  `tp5_etc3` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`adm_tp_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` tinyint(4) NOT NULL DEFAULT 0,
  `bn_bgcolor` varchar(10) NOT NULL,
  `bn_new_win` tinyint(4) NOT NULL DEFAULT 0,
  `bn_begin_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_end_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bn_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_cart`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_cart` (
  `ct_id` int(11) NOT NULL AUTO_INCREMENT,
  `od_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_sc_type` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_method` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `ct_status` varchar(255) NOT NULL DEFAULT '' COMMENT '주문,입금,준비,배송,완료,반품,취소,취소요청',
  `ct_cancel_status` varchar(1) DEFAULT NULL COMMENT '1:취소요청,2:취소승인,3:취소반려',
  `ct_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `exchange_ct_id` varchar(50) DEFAULT NULL,
  `exchange_it_id` varchar(50) DEFAULT NULL,
  `exchange_it_name` varchar(255) DEFAULT NULL,
  `exchange_ct_option` varchar(255) DEFAULT NULL,
  `ct_price` int(11) NOT NULL DEFAULT 0,
  `ct_point` int(11) NOT NULL DEFAULT 0,
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `ct_point_use` varchar(3) NOT NULL DEFAULT '0',
  `ct_stock_use` varchar(3) NOT NULL DEFAULT '0',
  `ct_option` varchar(255) DEFAULT '',
  `ct_qty` int(11) NOT NULL DEFAULT 0,
  `ct_notax` varchar(3) NOT NULL DEFAULT '0',
  `io_id` varchar(255) DEFAULT '',
  `io_type` varchar(3) NOT NULL DEFAULT '0',
  `io_price` int(11) NOT NULL DEFAULT 0,
  `ct_time` varchar(20) DEFAULT NULL,
  `ct_ip` varchar(25) DEFAULT '',
  `ct_send_cost` varchar(10) DEFAULT '0',
  `ct_direct` varchar(3) NOT NULL DEFAULT '0',
  `ct_select` varchar(3) NOT NULL DEFAULT '0',
  `ct_select_time` varchar(40) DEFAULT NULL,
  `ct_confirm_date` varchar(20) DEFAULT NULL COMMENT '구매확정일',
  `pt_sale` int(11) NOT NULL DEFAULT 0,
  `pt_commission` int(11) NOT NULL DEFAULT 0,
  `pt_point` int(11) NOT NULL DEFAULT 0,
  `pt_incentive` int(11) NOT NULL DEFAULT 0,
  `pt_net` int(11) NOT NULL DEFAULT 0,
  `pt_commission_rate` varchar(3) NOT NULL DEFAULT '0',
  `pt_incentive_rate` varchar(3) NOT NULL DEFAULT '0',
  `pt_it` varchar(3) NOT NULL DEFAULT '1',
  `pt_id` varchar(255) DEFAULT '',
  `pt_send` varchar(255) DEFAULT '',
  `pt_send_num` varchar(255) DEFAULT '',
  `pt_datetime` varchar(20) DEFAULT NULL,
  `pt_msg1` varchar(255) DEFAULT '',
  `pt_msg2` varchar(255) DEFAULT '',
  `pt_msg3` varchar(255) DEFAULT '',
  `mk_id` varchar(255) DEFAULT '',
  `mk_profit` int(11) NOT NULL DEFAULT 0,
  `mk_benefit` int(11) NOT NULL DEFAULT 0,
  `mk_profit_rate` int(11) NOT NULL DEFAULT 0,
  `mk_benefit_rate` int(11) NOT NULL DEFAULT 0,
  `ct_seq` int(11) NOT NULL DEFAULT 1,
  `od_invoice` varchar(255) DEFAULT NULL,
  `od_delivery_company` varchar(100) DEFAULT NULL,
  `od_delivery_company_money` varchar(100) DEFAULT NULL,
  `od_delivery_company2` varchar(100) DEFAULT NULL,
  `od_delivery_company_money2` varchar(100) DEFAULT NULL,
  `od_invoice_time` varchar(20) DEFAULT NULL,
  `it_use_check` varchar(3) NOT NULL DEFAULT '0',
  `celeb_id` varchar(255) NOT NULL DEFAULT '',
  `cType` varchar(2) DEFAULT '',
  `dCompany` varchar(100) DEFAULT '',
  `address_kakao` varchar(255) DEFAULT '',
  `address_detail` varchar(255) DEFAULT '',
  `cancel_type` varchar(2) DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `order_cancel_date` varchar(20) DEFAULT NULL COMMENT '취소요청일자',
  `order_cancel_approve_date` varchar(20) DEFAULT NULL COMMENT '취소승인일자',
  `order_cancel_out_date` varchar(20) DEFAULT NULL COMMENT '취소반려일자',
  `order_refund_date` varchar(20) DEFAULT NULL,
  `order_refund_approve_date` varchar(20) DEFAULT NULL COMMENT '환불승인일자',
  `order_refund_kind` varchar(20) DEFAULT NULL COMMENT '환불신청사유',
  `order_refund_reason` varchar(255) DEFAULT NULL COMMENT '환불신청사유 직접입력',
  `order_refund_changed_price` varchar(20) DEFAULT NULL COMMENT '변경된 환불금액',
  `order_refund_changed_price_reason` varchar(255) DEFAULT NULL COMMENT '변경된 환불금액 사유',
  `order_refund_account` varchar(100) DEFAULT NULL COMMENT '환불대상계좌(환불수단|은행|계좌번호|예금주|사유)',
  `order_exchange_date` varchar(20) DEFAULT NULL COMMENT '교환신청일자',
  `order_exchange_approve_date` varchar(20) DEFAULT NULL COMMENT '교환승인일자',
  `order_exchange_item_io_no` int(11) DEFAULT NULL,
  `order_exchange_item_io_id` varchar(255) DEFAULT NULL,
  `order_exchange_item_option` varchar(20) DEFAULT NULL COMMENT '교환 옵션',
  `order_exchange_kind` varchar(20) DEFAULT NULL COMMENT '교환신청사유',
  `order_exchange_reason` varchar(255) DEFAULT NULL COMMENT '교환신청사유 직접입력',
  `order_exchange_complete_expected_time` varchar(20) DEFAULT NULL COMMENT '교환완료 예상일자',
  `order_exchange_delivery_money_kind` varchar(50) DEFAULT NULL COMMENT '교환배송비 지불형태',
  `order_exchange_delivery_money` int(11) DEFAULT NULL COMMENT '교환배송비 금액',
  `order_exchange_delivery_money_in` int(11) DEFAULT NULL COMMENT '교환배송비 금액(동봉)',
  `order_exchange_delivery_memo` varchar(255) DEFAULT NULL COMMENT '교환 메모',
  `order_return_flag` varchar(3) DEFAULT NULL COMMENT '1:반품/환불,2:교환',
  `order_return_status` varchar(3) DEFAULT NULL COMMENT '상태(1:신청, 2;승인)',
  `order_return_way` varchar(1) DEFAULT NULL COMMENT '반품물품 수거방법',
  `order_return_date` varchar(20) DEFAULT NULL COMMENT '반품신청일자',
  `order_return_approve_date` varchar(20) DEFAULT NULL COMMENT '반품승인일자',
  `order_return_kind` varchar(20) DEFAULT NULL COMMENT '반품신청사유',
  `order_return_reason` varchar(255) DEFAULT NULL COMMENT '반품 신청사유 직접입력',
  `order_return_complete_expected_time` varchar(20) DEFAULT NULL COMMENT '반품완료 예상일자',
  `order_return_post` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 주소 우편번호',
  `order_return_address1` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 주소1',
  `order_return_address2` varchar(50) DEFAULT NULL COMMENT '반품 물품 수거 주소2',
  `order_return_address3` varchar(50) DEFAULT NULL COMMENT '반품 물품 수거 주소3',
  `order_return_invoice` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 송장번호',
  `order_return_delivery_company` varchar(100) DEFAULT NULL,
  `order_return_delivery_money` varchar(100) DEFAULT NULL,
  `ct_memo` varchar(255) DEFAULT NULL,
  `change_flag` int(11) DEFAULT 0,
  `return_flag` int(11) DEFAULT 0,
  `change_refer_ct_id` int(11) DEFAULT 0,
  `change_refer_parent_ct_id` int(11) DEFAULT 0,
  `change_refer_flag` varchar(1) DEFAULT 'N',
  `returnYN` varchar(5) DEFAULT 'N',
  `ProductOrderID` varchar(20) NOT NULL DEFAULT '',
  `ClaimType` varchar(30) NOT NULL DEFAULT '',
  `ClaimStatus` varchar(30) NOT NULL DEFAULT '',
  `PlaceOrderStatus` varchar(30) NOT NULL DEFAULT '',
  `DelayedDispatchReason` varchar(30) NOT NULL DEFAULT '',
  `od_naver_orderid` varchar(20) NOT NULL DEFAULT '',
  `ct_buycost_price` bigint(20) NOT NULL DEFAULT 0,
  `store_mb_id` varchar(64) DEFAULT NULL,
  `type` varchar(64) DEFAULT NULL,
  `diy_ca_id` varchar(64) DEFAULT '',
  `diy_price` int(11) DEFAULT 0,
  `box_qty` int(11) DEFAULT 0,
  `unit_qty` int(11) DEFAULT 0,
  `ct_kind` varchar(20) DEFAULT '',
  PRIMARY KEY (`ct_id`) USING BTREE,
  KEY `od_id` (`od_id`) USING BTREE,
  KEY `it_id` (`it_id`) USING BTREE,
  KEY `ct_status` (`ct_status`) USING BTREE,
  KEY `ProductOrderID` (`ProductOrderID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1189 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_cart_refund`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_cart_refund` (
  `rf_id` int(11) NOT NULL AUTO_INCREMENT,
  `ct_id` varchar(25) NOT NULL,
  `od_id` varchar(25) NOT NULL,
  `mb_id` varchar(255) NOT NULL,
  `mb_name` varchar(25) NOT NULL,
  `store_mb_id` varchar(25) NOT NULL,
  `it_id` varchar(25) NOT NULL,
  `it_name` varchar(255) NOT NULL,
  `ct_option` varchar(255) NOT NULL,
  `ct_price` int(11) NOT NULL,
  `ct_status` varchar(255) NOT NULL,
  `rf_excuse` varchar(255) NOT NULL,
  `rf_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `rf_confirmtime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `rf_ip` varchar(25) NOT NULL,
  `rf_confirm` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`rf_id`),
  KEY `index1` (`ct_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_category` (
  `ca_id` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '0',
  `ca_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_name_tmp` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_order` int(11) NOT NULL DEFAULT 0,
  `ca_skin_dir` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_mobile_skin_dir` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_skin` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_mobile_skin` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_img_width` int(11) NOT NULL DEFAULT 0,
  `ca_img_height` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_img_width` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_img_height` int(11) NOT NULL DEFAULT 0,
  `ca_sell_email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_use` tinyint(4) NOT NULL DEFAULT 0,
  `ca_stock_qty` int(11) NOT NULL DEFAULT 0,
  `ca_explan_html` tinyint(4) NOT NULL DEFAULT 0,
  `ca_head_html` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ca_tail_html` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ca_mobile_head_html` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ca_mobile_tail_html` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ca_list_mod` int(11) NOT NULL DEFAULT 0,
  `ca_list_row` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_list_mod` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_list_row` int(11) NOT NULL DEFAULT 0,
  `ca_include_head` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_include_tail` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_mb_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_cert_use` tinyint(4) NOT NULL DEFAULT 0,
  `ca_adult_use` tinyint(4) NOT NULL DEFAULT 0,
  `ca_nocoupon` tinyint(4) NOT NULL DEFAULT 0,
  `ca_1_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_2_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_3_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_4_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_5_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_6_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_7_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_8_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_9_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_10_subj` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_1` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_2` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_3` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_4` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_5` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_6` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_7` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_8` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_9` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_10` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `ca_exhibit` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '',
  `ca_exhibit_detail` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '',
  `it_type1` varchar(50) NOT NULL DEFAULT '0' COMMENT '메인 분류 값',
  `it_type2` varchar(50) NOT NULL DEFAULT '0',
  `it_type3` varchar(50) NOT NULL DEFAULT '0',
  `it_type4` varchar(50) NOT NULL DEFAULT '0',
  `it_type5` varchar(50) NOT NULL DEFAULT '0',
  `it_type6` varchar(50) NOT NULL DEFAULT '0',
  `it_type7` varchar(50) NOT NULL DEFAULT '0',
  `ca_device_pc` int(4) NOT NULL DEFAULT 0,
  `ca_device_m` int(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`ca_id`),
  KEY `ca_order` (`ca_order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_category2`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_category2` (
  `ca_id` varchar(10) NOT NULL DEFAULT '0',
  `ca_name` varchar(255) NOT NULL DEFAULT '',
  `ca_order` int(11) NOT NULL DEFAULT 0,
  `ca_skin_dir` varchar(255) NOT NULL DEFAULT '',
  `ca_mobile_skin_dir` varchar(255) NOT NULL DEFAULT '',
  `ca_skin` varchar(255) NOT NULL DEFAULT '',
  `ca_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `ca_img_width` int(11) NOT NULL DEFAULT 0,
  `ca_img_height` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_img_width` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_img_height` int(11) NOT NULL DEFAULT 0,
  `ca_sell_email` varchar(255) NOT NULL DEFAULT '',
  `ca_use` tinyint(4) NOT NULL DEFAULT 0,
  `ca_stock_qty` int(11) NOT NULL DEFAULT 0,
  `ca_explan_html` tinyint(4) NOT NULL DEFAULT 0,
  `ca_head_html` text NOT NULL,
  `ca_tail_html` text NOT NULL,
  `ca_mobile_head_html` text NOT NULL,
  `ca_mobile_tail_html` text NOT NULL,
  `ca_list_mod` int(11) NOT NULL DEFAULT 0,
  `ca_list_row` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_list_mod` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_list_row` int(11) NOT NULL DEFAULT 0,
  `ca_include_head` varchar(255) NOT NULL DEFAULT '',
  `ca_include_tail` varchar(255) NOT NULL DEFAULT '',
  `ca_mb_id` varchar(255) NOT NULL DEFAULT '',
  `ca_cert_use` tinyint(4) NOT NULL DEFAULT 0,
  `ca_adult_use` tinyint(4) NOT NULL DEFAULT 0,
  `ca_nocoupon` tinyint(4) NOT NULL DEFAULT 0,
  `ca_1_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_2_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_3_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_4_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_5_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_6_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_7_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_8_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_9_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_10_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_1` varchar(255) NOT NULL DEFAULT '',
  `ca_2` varchar(255) NOT NULL DEFAULT '',
  `ca_3` varchar(255) NOT NULL DEFAULT '',
  `ca_4` varchar(255) NOT NULL DEFAULT '',
  `ca_5` varchar(255) NOT NULL DEFAULT '',
  `ca_6` varchar(255) NOT NULL DEFAULT '',
  `ca_7` varchar(255) NOT NULL DEFAULT '',
  `ca_8` varchar(255) NOT NULL DEFAULT '',
  `ca_9` varchar(255) NOT NULL DEFAULT '',
  `ca_10` varchar(255) NOT NULL DEFAULT '',
  `ca_exhibit` varchar(255) DEFAULT '',
  `ca_exhibit_detail` varchar(255) DEFAULT '',
  `it_type1` int(11) DEFAULT NULL,
  `it_type2` int(11) DEFAULT NULL,
  `it_type3` int(11) DEFAULT NULL,
  `it_type4` int(11) DEFAULT NULL,
  `it_type5` int(11) DEFAULT NULL,
  `it_type6` int(11) DEFAULT NULL,
  `it_type7` int(11) DEFAULT NULL,
  `max_cnt` int(11) DEFAULT NULL,
  `ca_price` int(11) DEFAULT NULL COMMENT '세트가격',
  PRIMARY KEY (`ca_id`) USING BTREE,
  KEY `ca_order` (`ca_order`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_coupon`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_coupon` (
  `cp_no` int(11) NOT NULL AUTO_INCREMENT,
  `cp_id` varchar(100) NOT NULL DEFAULT '',
  `cp_subject` varchar(255) NOT NULL DEFAULT '',
  `cp_method` tinyint(4) NOT NULL DEFAULT 0,
  `cp_target` varchar(255) NOT NULL DEFAULT '',
  `mb_id` varchar(255) DEFAULT '',
  `cz_id` int(11) NOT NULL DEFAULT 0,
  `cp_start` date NOT NULL DEFAULT '0000-00-00',
  `cp_end` date NOT NULL DEFAULT '0000-00-00',
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `cp_type` tinyint(4) NOT NULL DEFAULT 0,
  `cp_trunc` int(11) NOT NULL DEFAULT 0,
  `cp_minimum` int(11) NOT NULL DEFAULT 0,
  `cp_maximum` int(11) NOT NULL DEFAULT 0,
  `cp_register` int(4) NOT NULL DEFAULT 0,
  `od_id` bigint(20) DEFAULT NULL,
  `store_mb_id` varchar(50) DEFAULT NULL,
  `cp_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `cp_regist` varchar(50) DEFAULT NULL,
  `cp_vastyle_rate` int(11) DEFAULT NULL,
  `cp_brand_rate` int(11) DEFAULT NULL,
  PRIMARY KEY (`cp_no`),
  UNIQUE KEY `cp_id` (`cp_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_coupon_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_coupon_log` (
  `cl_id` int(11) NOT NULL AUTO_INCREMENT,
  `cp_id` varchar(100) NOT NULL DEFAULT '',
  `mb_id` varchar(100) NOT NULL DEFAULT '',
  `od_id` bigint(20) NOT NULL,
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `cl_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`cl_id`),
  KEY `mb_id` (`mb_id`),
  KEY `od_id` (`od_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_coupon_zone`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_coupon_zone` (
  `cz_id` int(11) NOT NULL AUTO_INCREMENT,
  `cz_type` tinyint(4) NOT NULL DEFAULT 0,
  `cz_subject` varchar(255) NOT NULL DEFAULT '',
  `cz_limit` int(4) DEFAULT NULL,
  `cz_period_date` date NOT NULL DEFAULT '0000-00-00',
  `cz_start` date NOT NULL DEFAULT '0000-00-00',
  `cz_end` date NOT NULL DEFAULT '0000-00-00',
  `cz_file` varchar(255) NOT NULL DEFAULT '',
  `cz_period` int(11) NOT NULL DEFAULT 0,
  `cz_point` int(11) NOT NULL DEFAULT 0,
  `cp_method` tinyint(4) NOT NULL DEFAULT 0,
  `cp_target` varchar(255) NOT NULL DEFAULT '',
  `cp_target2` varchar(255) NOT NULL DEFAULT '',
  `mb_level` int(4) DEFAULT NULL,
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `cp_type` tinyint(4) NOT NULL DEFAULT 0,
  `cp_trunc` int(11) NOT NULL DEFAULT 0,
  `cp_minimum` int(11) NOT NULL DEFAULT 0,
  `cp_maximum` int(11) NOT NULL DEFAULT 0,
  `cz_download` int(11) NOT NULL DEFAULT 0,
  `store_mb_id` varchar(50) DEFAULT NULL,
  `cz_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `cp_vastyle_rate` int(11) DEFAULT NULL,
  `cp_brand_rate` int(11) DEFAULT NULL,
  `cz_link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cz_id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_default`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_default` (
  `de_admin_company_owner` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_name` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_saupja_no` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_tel` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_fax` varchar(255) NOT NULL DEFAULT '',
  `de_admin_tongsin_no` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_zip` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_addr` varchar(255) NOT NULL DEFAULT '',
  `de_admin_info_name` varchar(255) NOT NULL DEFAULT '',
  `de_admin_info_email` varchar(255) NOT NULL DEFAULT '',
  `de_admin_open_day` varchar(255) NOT NULL DEFAULT '월-금 am 09:00 - pm 5:00',
  `de_admin_open_weekend` varchar(255) NOT NULL DEFAULT '',
  `de_admin_open_lunch` varchar(255) NOT NULL DEFAULT 'pm 12:00 - pm 2:00',
  `de_admin_open_info` varchar(255) NOT NULL DEFAULT '주말/휴일/공휴일/국경일은 업무를 하지않으며 배송업무도 쉽니다',
  `de_admin_return_zip` varchar(255) NOT NULL DEFAULT '',
  `de_admin_return_addr` varchar(255) NOT NULL DEFAULT '',
  `de_admin_return_onefee` varchar(20) NOT NULL DEFAULT '3000',
  `de_admin_return_twofee` varchar(20) NOT NULL DEFAULT '6000',
  `de_shop_skin` varchar(255) NOT NULL DEFAULT '',
  `de_shop_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type1_title` varchar(255) NOT NULL DEFAULT '히트상품',
  `de_type2_title` varchar(255) NOT NULL DEFAULT '추천상품',
  `de_type3_title` varchar(255) NOT NULL DEFAULT '최신상품',
  `de_type4_title` varchar(255) NOT NULL DEFAULT '인기상품',
  `de_type5_title` varchar(255) NOT NULL DEFAULT '할인상품',
  `de_type1_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_type1_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type1_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type1_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type1_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type1_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type2_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_type2_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type2_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type2_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type2_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type2_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type3_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_type3_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type3_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type3_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type3_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type3_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type4_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_type4_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type4_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type4_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type4_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type4_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type5_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_type5_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type5_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type5_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type5_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type5_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_title` varchar(255) NOT NULL DEFAULT '히트상품',
  `de_mobile_type2_title` varchar(255) NOT NULL DEFAULT '추천상품',
  `de_mobile_type3_title` varchar(255) NOT NULL DEFAULT '최신상품',
  `de_mobile_type4_title` varchar(255) NOT NULL DEFAULT '인기상품',
  `de_mobile_type5_title` varchar(255) NOT NULL DEFAULT '할인상품',
  `de_mobile_type1_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_mobile_type1_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type1_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_mobile_type2_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type2_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_mobile_type3_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type3_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_mobile_type4_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type4_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_mobile_type5_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type5_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_img_height` int(11) NOT NULL DEFAULT 0,
  `de_rel_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_rel_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_rel_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_rel_img_width` int(11) NOT NULL DEFAULT 0,
  `de_rel_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_rel_list_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_mobile_rel_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_rel_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_rel_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_rel_img_height` int(11) NOT NULL DEFAULT 0,
  `de_search_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_search_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_search_list_row` int(11) NOT NULL DEFAULT 0,
  `de_search_img_width` int(11) NOT NULL DEFAULT 0,
  `de_search_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_search_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_img_height` int(11) NOT NULL DEFAULT 0,
  `de_listtype_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_listtype_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_listtype_list_row` int(11) NOT NULL DEFAULT 0,
  `de_listtype_img_width` int(11) NOT NULL DEFAULT 0,
  `de_listtype_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_listtype_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_img_height` int(11) NOT NULL DEFAULT 0,
  `de_bank_use` int(11) NOT NULL DEFAULT 0,
  `de_bank_account` text NOT NULL,
  `de_card_test` int(11) NOT NULL DEFAULT 0,
  `de_card_use` int(11) NOT NULL DEFAULT 0,
  `de_card_noint_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_card_point` int(11) NOT NULL DEFAULT 0,
  `de_settle_min_point` int(11) NOT NULL DEFAULT 0,
  `de_settle_max_point` int(11) NOT NULL DEFAULT 0,
  `de_settle_point_unit` int(11) NOT NULL DEFAULT 0,
  `de_level_sell` int(11) NOT NULL DEFAULT 0,
  `de_delivery_company` varchar(255) NOT NULL DEFAULT '',
  `de_send_cost_case` varchar(255) NOT NULL DEFAULT '',
  `de_send_cost_limit` varchar(255) NOT NULL DEFAULT '',
  `de_send_cost_list` varchar(255) NOT NULL DEFAULT '',
  `de_hope_date_use` int(11) NOT NULL DEFAULT 0,
  `de_hope_date_after` int(11) NOT NULL DEFAULT 0,
  `de_baesong_content` text NOT NULL,
  `de_change_content` text NOT NULL,
  `de_cancel_content` text NOT NULL,
  `de_point_days` int(11) NOT NULL DEFAULT 0,
  `de_simg_width` int(11) NOT NULL DEFAULT 0,
  `de_simg_height` int(11) NOT NULL DEFAULT 0,
  `de_mimg_width` int(11) NOT NULL DEFAULT 0,
  `de_mimg_height` int(11) NOT NULL DEFAULT 0,
  `de_sms_cont1` text NOT NULL,
  `de_sms_cont2` text NOT NULL,
  `de_sms_cont3` text NOT NULL,
  `de_sms_cont4` text NOT NULL,
  `de_sms_cont5` text NOT NULL,
  `de_sms_use1` tinyint(4) NOT NULL DEFAULT 0,
  `de_sms_use2` tinyint(4) NOT NULL DEFAULT 0,
  `de_sms_use3` tinyint(4) NOT NULL DEFAULT 0,
  `de_sms_use4` tinyint(4) NOT NULL DEFAULT 0,
  `de_sms_use5` tinyint(4) NOT NULL DEFAULT 0,
  `de_sms_hp` varchar(255) NOT NULL DEFAULT '',
  `de_pg_service` varchar(255) NOT NULL DEFAULT '',
  `de_kcp_mid` varchar(255) NOT NULL DEFAULT '',
  `de_kcp_site_key` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_mid` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_admin_key` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_sign_key` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_iniapi_key` varchar(30) NOT NULL DEFAULT '',
  `de_inicis_iniapi_iv` varchar(30) NOT NULL DEFAULT '',
  `de_iche_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_easy_pay_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_easy_pay_services` varchar(255) NOT NULL DEFAULT '',
  `de_samsung_pay_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_inicis_lpay_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_inicis_kakaopay_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_inicis_cartpoint_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_nicepay_mid` varchar(20) NOT NULL DEFAULT '',
  `de_nicepay_key` varchar(150) NOT NULL DEFAULT '',
  `de_item_use_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_item_use_write` tinyint(4) NOT NULL DEFAULT 0,
  `de_code_dup_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_cart_keep_term` int(11) NOT NULL DEFAULT 0,
  `de_guest_cart_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_admin_buga_no` varchar(255) NOT NULL DEFAULT '',
  `de_vbank_use` varchar(255) NOT NULL DEFAULT '',
  `de_taxsave_use` tinyint(4) NOT NULL,
  `de_taxsave_types` set('account','vbank','transfer') NOT NULL DEFAULT 'account',
  `de_guest_privacy` text NOT NULL,
  `de_hp_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_escrow_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_tax_flag_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_kakaopay_mid` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_key` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_enckey` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_hashkey` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_cancelpwd` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_mid` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_cert_key` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_button_key` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_test` tinyint(4) NOT NULL DEFAULT 0,
  `de_naverpay_mb_id` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_sendcost` varchar(255) NOT NULL DEFAULT '',
  `de_member_reg_coupon_use` tinyint(4) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_term` int(11) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_price` int(11) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_minimum` int(11) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_method` int(4) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_type` int(4) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_trunc` int(11) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_register` int(4) NOT NULL DEFAULT 0,
  `ch_link_baro_use` tinyint(4) NOT NULL,
  `ch_link_tel_number` varchar(255) NOT NULL,
  `ch_link_kakaoplus_url` varchar(255) NOT NULL,
  `ch_link_market_name1` varchar(255) NOT NULL,
  `ch_link_market_name2` varchar(255) NOT NULL,
  `ch_link_market_name3` varchar(255) NOT NULL,
  `ch_link_market_name4` varchar(255) NOT NULL,
  `ch_link_market_name5` varchar(255) NOT NULL,
  `ch_link_market_name6` varchar(255) NOT NULL,
  `ch_link_market_name7` varchar(255) NOT NULL,
  `ch_link_market_name8` varchar(255) NOT NULL,
  `ch_link_market_name9` varchar(255) NOT NULL,
  `ch_link_market_name10` varchar(255) NOT NULL,
  `apibox_use` tinyint(4) NOT NULL,
  `apibox_id` varchar(30) NOT NULL,
  `de_refund_date` int(11) NOT NULL DEFAULT 7,
  `de_change_date` int(11) NOT NULL DEFAULT 7,
  `de_delivery_days` int(4) NOT NULL DEFAULT 0,
  `de_finish_days` int(4) NOT NULL DEFAULT 0,
  `de_naverpayorder_AccessLicense` varchar(100) NOT NULL DEFAULT '',
  `de_naverpayorder_SecretKey` varchar(100) NOT NULL DEFAULT '',
  `de_naverpayorder_test` tinyint(4) NOT NULL DEFAULT 0,
  `de_naverpayorder_test_mb_id` varchar(20) NOT NULL DEFAULT ''
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_event`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_event` (
  `ev_id` int(11) NOT NULL AUTO_INCREMENT,
  `ev_skin` varchar(255) NOT NULL DEFAULT '',
  `ev_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `ev_img_width` int(11) NOT NULL DEFAULT 0,
  `ev_img_height` int(11) NOT NULL DEFAULT 0,
  `ev_list_mod` int(11) NOT NULL DEFAULT 0,
  `ev_list_row` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_img_width` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_img_height` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_list_mod` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_list_row` int(11) NOT NULL DEFAULT 0,
  `ev_subject` varchar(255) NOT NULL DEFAULT '',
  `ev_subject_strong` tinyint(4) NOT NULL DEFAULT 0,
  `ev_head_html` text NOT NULL,
  `ev_tail_html` text NOT NULL,
  `ev_start` date NOT NULL DEFAULT '0000-00-00',
  `ev_end` date NOT NULL DEFAULT '0000-00-00',
  `ev_use` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`ev_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_event_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_event_item` (
  `ev_id` int(11) NOT NULL DEFAULT 0,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`ev_id`,`it_id`),
  KEY `it_id` (`it_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_inicis_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_inicis_log` (
  `oid` bigint(20) unsigned NOT NULL,
  `P_TID` varchar(255) NOT NULL DEFAULT '',
  `P_MID` varchar(255) NOT NULL DEFAULT '',
  `P_AUTH_DT` varchar(255) NOT NULL DEFAULT '',
  `P_STATUS` varchar(255) NOT NULL DEFAULT '',
  `P_TYPE` varchar(255) NOT NULL DEFAULT '',
  `P_OID` varchar(255) NOT NULL DEFAULT '',
  `P_FN_NM` varchar(255) NOT NULL DEFAULT '',
  `P_AUTH_NO` varchar(255) NOT NULL DEFAULT '',
  `P_AMT` int(11) NOT NULL DEFAULT 0,
  `P_RMESG1` varchar(255) NOT NULL DEFAULT '',
  `post_data` text NOT NULL,
  `is_mail_send` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`oid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item` (
  `idx` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `filter1` varchar(10) DEFAULT '0' COMMENT '일반상품, 선물하기 ',
  `filter2` varchar(10) DEFAULT '1',
  `ca_id` varchar(10) DEFAULT '0',
  `ca_id2` varchar(255) DEFAULT '',
  `ca_id3` varchar(255) DEFAULT '',
  `ca_id4` varchar(255) DEFAULT '',
  `ca_id5` varchar(255) DEFAULT '',
  `ca_id6` varchar(255) DEFAULT '',
  `ca_id7` varchar(255) DEFAULT '',
  `ca_id8` varchar(255) DEFAULT '',
  `ca_id9` varchar(255) DEFAULT '',
  `ca_id10` varchar(255) DEFAULT '',
  `bn_order_display` int(11) NOT NULL DEFAULT 0,
  `it_skin` varchar(255) DEFAULT '',
  `it_mobile_skin` varchar(255) DEFAULT '',
  `it_name` varchar(255) DEFAULT '',
  `it_name_ja` varchar(255) DEFAULT NULL,
  `it_seo_title` varchar(200) DEFAULT '',
  `it_maker` varchar(255) DEFAULT '',
  `it_origin` varchar(255) DEFAULT '',
  `it_brand` varchar(100) DEFAULT '',
  `it_period` varchar(100) DEFAULT '',
  `it_method` varchar(100) DEFAULT '',
  `it_brand_id` varchar(100) DEFAULT '',
  `it_in` varchar(255) DEFAULT '',
  `it_out` varchar(255) DEFAULT '',
  `it_model` varchar(255) DEFAULT '',
  `it_option_subject` varchar(255) DEFAULT '',
  `it_supply_subject` varchar(255) DEFAULT '',
  `it_type1` varchar(3) DEFAULT '0',
  `it_type2` varchar(3) DEFAULT '0',
  `it_type3` varchar(3) DEFAULT '0',
  `it_type4` varchar(3) DEFAULT '0',
  `it_type5` varchar(3) DEFAULT '0',
  `it_type6` varchar(50) DEFAULT NULL,
  `it_type7` varchar(50) DEFAULT NULL,
  `it_type8` varchar(50) DEFAULT NULL,
  `it_basic` text DEFAULT NULL,
  `it_basic_ja` text DEFAULT NULL,
  `it_explan` mediumtext DEFAULT NULL,
  `it_explan_ja` mediumtext DEFAULT NULL,
  `it_explan2` mediumtext DEFAULT NULL,
  `it_mobile_explan` mediumtext DEFAULT NULL,
  `it_cust_price` int(11) DEFAULT 0,
  `it_price` int(11) DEFAULT 0,
  `it_point` varchar(10) DEFAULT NULL,
  `it_point_type` varchar(3) DEFAULT '2',
  `it_supply_point` varchar(10) DEFAULT NULL,
  `it_notax` varchar(3) DEFAULT '0',
  `it_sell_email` varchar(255) DEFAULT '',
  `it_use` varchar(3) DEFAULT '0' COMMENT '판매가능',
  `it_open` varchar(3) DEFAULT '1' COMMENT '노출여부',
  `it_approve` varchar(3) DEFAULT '1',
  `it_approve_date` varchar(20) DEFAULT '1',
  `it_reject_date` varchar(20) DEFAULT NULL,
  `it_reject_reason` varchar(100) DEFAULT NULL,
  `it_reject_type` varchar(20) DEFAULT NULL,
  `it_request_date` varchar(20) DEFAULT NULL,
  `it_nocoupon` varchar(3) DEFAULT '0',
  `it_soldout` varchar(3) DEFAULT '0',
  `it_ban` varchar(3) DEFAULT '0' COMMENT '판매금지',
  `it_stock_qty` int(11) DEFAULT 0,
  `it_stock_sms` varchar(3) DEFAULT '0',
  `it_noti_qty` varchar(10) DEFAULT '0',
  `it_sc_type` varchar(3) DEFAULT '0',
  `it_sc_method` varchar(3) DEFAULT '0',
  `it_sc_price` varchar(10) DEFAULT NULL,
  `it_sc_minimum` varchar(10) DEFAULT NULL,
  `it_sc_qty` varchar(10) DEFAULT NULL,
  `it_buy_min_qty` varchar(10) DEFAULT NULL,
  `it_buy_max_qty` varchar(10) DEFAULT NULL,
  `it_head_html` text DEFAULT NULL,
  `it_tail_html` text DEFAULT NULL,
  `it_mobile_head_html` text DEFAULT NULL,
  `it_mobile_tail_html` text DEFAULT NULL,
  `it_hit` int(11) DEFAULT 0,
  `it_time` varchar(50) DEFAULT '0000-00-00 00:00:00',
  `it_update_time` varchar(50) DEFAULT '0000-00-00 00:00:00',
  `it_ip` varchar(25) DEFAULT '',
  `it_order` varchar(10) DEFAULT '0',
  `it_tel_inq` varchar(3) DEFAULT '0',
  `it_tel_inq_no` varchar(50) DEFAULT NULL,
  `it_info_gubun` varchar(50) DEFAULT '',
  `it_info_value` text DEFAULT NULL,
  `it_sum_qty` int(11) DEFAULT 0,
  `it_use_cnt` int(11) DEFAULT 0,
  `it_use_avg` decimal(2,1) DEFAULT NULL,
  `it_shop_memo` text DEFAULT NULL,
  `it_fee` int(11) DEFAULT 0,
  `ec_mall_pid` varchar(255) DEFAULT '',
  `it_img1` varchar(255) DEFAULT '',
  `it_img2` varchar(255) DEFAULT '',
  `it_img3` varchar(255) DEFAULT '',
  `it_img4` varchar(255) DEFAULT '',
  `it_img5` varchar(255) DEFAULT '',
  `it_img6` varchar(255) DEFAULT '',
  `it_img7` varchar(255) DEFAULT '',
  `it_img8` varchar(255) DEFAULT '',
  `it_img9` varchar(255) DEFAULT '',
  `it_img10` varchar(255) DEFAULT '',
  `it_1_subj` varchar(255) DEFAULT '',
  `it_2_subj` varchar(255) DEFAULT '',
  `it_3_subj` varchar(255) DEFAULT '',
  `it_4_subj` varchar(255) DEFAULT '',
  `it_5_subj` varchar(255) DEFAULT '',
  `it_6_subj` varchar(255) DEFAULT '',
  `it_7_subj` varchar(255) DEFAULT '',
  `it_8_subj` varchar(255) DEFAULT '',
  `it_9_subj` varchar(255) DEFAULT '',
  `it_10_subj` varchar(255) DEFAULT '',
  `it_1` varchar(255) DEFAULT '',
  `it_2` varchar(255) DEFAULT '',
  `it_3` varchar(255) DEFAULT '',
  `it_4` varchar(255) DEFAULT '',
  `it_5` varchar(255) DEFAULT '',
  `it_6` varchar(255) DEFAULT '',
  `it_7` varchar(255) DEFAULT '',
  `it_8` varchar(255) DEFAULT '',
  `it_9` varchar(255) DEFAULT '',
  `it_10` varchar(255) DEFAULT '',
  `pt_tag` varchar(255) DEFAULT '',
  `pt_thumb` varchar(255) DEFAULT '',
  `pt_link1` varchar(255) DEFAULT '',
  `pt_link2` varchar(255) DEFAULT '',
  `pt_map` varchar(255) DEFAULT '',
  `pt_id` varchar(255) DEFAULT '',
  `pt_it` varchar(3) DEFAULT '1',
  `pt_ccl` varchar(3) DEFAULT '0',
  `pt_img` varchar(3) DEFAULT '0',
  `pt_file` varchar(3) DEFAULT '0',
  `pt_main` varchar(3) DEFAULT '0',
  `pt_point` varchar(3) DEFAULT '0',
  `pt_order` varchar(3) DEFAULT '0',
  `pt_commission` varchar(3) DEFAULT '0',
  `pt_incentive` varchar(3) DEFAULT '0',
  `pt_marketer` varchar(3) DEFAULT '0',
  `pt_review_use` varchar(50) DEFAULT '0',
  `pt_comment_use` varchar(50) DEFAULT '0',
  `pt_comment` int(11) DEFAULT 0,
  `pt_qa` int(11) DEFAULT 0,
  `pt_good` int(11) DEFAULT 0,
  `pt_nogood` int(11) DEFAULT 0,
  `pt_show` varchar(50) DEFAULT NULL,
  `pt_num` int(11) DEFAULT 0,
  `pt_day` varchar(50) DEFAULT NULL,
  `pt_end` varchar(50) DEFAULT NULL,
  `pt_reserve` varchar(50) DEFAULT NULL,
  `pt_reserve_use` varchar(3) DEFAULT '0',
  `pt_syndi` varchar(3) DEFAULT '0',
  `pt_explan` mediumtext DEFAULT NULL,
  `pt_mobile_explan` mediumtext DEFAULT NULL,
  `pt_msg1` varchar(255) DEFAULT '',
  `pt_msg2` varchar(255) DEFAULT '',
  `pt_msg3` varchar(255) DEFAULT '',
  `styleArr` varchar(255) DEFAULT '',
  `feelArr` varchar(255) DEFAULT '',
  `colorArr` varchar(255) DEFAULT '',
  `pArr` varchar(100) DEFAULT '',
  `barcode` varchar(100) DEFAULT '',
  `siteKeyword` varchar(100) DEFAULT '',
  `itemKind` varchar(100) DEFAULT '',
  `produceYear` varchar(100) DEFAULT '',
  `produceDay` varchar(100) DEFAULT '',
  `season` varchar(100) DEFAULT '',
  `gender` varchar(100) DEFAULT '',
  `enTitle` varchar(100) DEFAULT '',
  `taxKind` varchar(100) DEFAULT '',
  `authNo` varchar(100) DEFAULT '',
  `authStart` varchar(100) DEFAULT '',
  `authEnd` varchar(100) DEFAULT '',
  `createDate` varchar(100) DEFAULT '',
  `authDate` varchar(100) DEFAULT '',
  `authInstitude` varchar(100) DEFAULT '',
  `authField` varchar(100) DEFAULT '',
  `customNo` varchar(100) DEFAULT '',
  `customImg` varchar(100) DEFAULT '',
  `pt_gubun` varchar(100) DEFAULT '0',
  `pt_group_id` varchar(50) DEFAULT NULL,
  `it_buycost_price` int(11) DEFAULT NULL,
  `it_review_point` int(11) DEFAULT NULL,
  `it_photoreview_point` int(11) DEFAULT NULL,
  `it_vodreview_point` int(11) DEFAULT NULL,
  `it_snsreview_point` int(11) DEFAULT NULL,
  `store_mb_id` varchar(50) NOT NULL,
  `it_quo` varchar(50) NOT NULL,
  `naver_shopping` int(11) DEFAULT NULL,
  `it_noti_qty_str` varchar(50) DEFAULT NULL,
  `it_noti_qty_cnt` varchar(50) DEFAULT NULL,
  `auto_gubun` varchar(10) DEFAULT NULL,
  `it_price_krw` int(11) DEFAULT NULL,
  `it_cust_price_krw` int(11) DEFAULT NULL,
  PRIMARY KEY (`it_id`),
  KEY `ca_id` (`ca_id`),
  KEY `it_name` (`it_name`),
  KEY `it_seo_title` (`it_seo_title`),
  KEY `it_order` (`it_order`),
  KEY `idx` (`idx`),
  KEY `it_type4` (`it_type4`),
  KEY `it_img1` (`it_img1`),
  KEY `it_id` (`it_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3408 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='상품';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item2`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item2` (
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `ca_id` varchar(10) NOT NULL DEFAULT '0',
  `ca_id2` varchar(255) NOT NULL DEFAULT '',
  `ca_id3` varchar(255) NOT NULL DEFAULT '',
  `ca_id4` int(11) DEFAULT NULL,
  `ca_id5` int(11) DEFAULT NULL,
  `ca_id6` int(11) DEFAULT NULL,
  `ca_id7` int(11) DEFAULT NULL,
  `ca_id8` int(11) DEFAULT NULL,
  `ca_id9` int(11) DEFAULT NULL,
  `ca_id10` int(11) DEFAULT NULL,
  `it_skin` varchar(255) NOT NULL DEFAULT '',
  `it_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_name_ja` varchar(255) DEFAULT NULL,
  `it_seo_title` varchar(200) NOT NULL DEFAULT '',
  `it_maker` varchar(255) NOT NULL DEFAULT '',
  `it_origin` varchar(255) NOT NULL DEFAULT '',
  `it_brand` varchar(255) NOT NULL DEFAULT '',
  `it_model` varchar(255) NOT NULL DEFAULT '',
  `it_option_subject` varchar(255) NOT NULL DEFAULT '',
  `it_supply_subject` varchar(255) NOT NULL DEFAULT '',
  `it_type1` tinyint(4) NOT NULL DEFAULT 0,
  `it_type2` tinyint(4) NOT NULL DEFAULT 0,
  `it_type3` tinyint(4) NOT NULL DEFAULT 0,
  `it_type4` tinyint(4) NOT NULL DEFAULT 0,
  `it_type5` tinyint(4) NOT NULL DEFAULT 0,
  `it_type6` tinyint(4) NOT NULL DEFAULT 0,
  `it_type7` tinyint(4) NOT NULL DEFAULT 0,
  `it_type8` tinyint(4) NOT NULL DEFAULT 0,
  `it_basic` text NOT NULL,
  `it_explan` mediumtext NOT NULL,
  `it_explan2` mediumtext NOT NULL,
  `it_mobile_explan` mediumtext NOT NULL,
  `it_cust_price` int(11) NOT NULL DEFAULT 0,
  `it_price` int(11) NOT NULL DEFAULT 0,
  `it_buycost_price` int(11) NOT NULL,
  `it_point` int(11) NOT NULL DEFAULT 0,
  `it_point_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_supply_point` int(11) NOT NULL DEFAULT 0,
  `it_notax` tinyint(4) NOT NULL DEFAULT 0,
  `it_sell_email` varchar(255) NOT NULL DEFAULT '',
  `it_use` tinyint(4) NOT NULL DEFAULT 0,
  `it_nocoupon` tinyint(4) NOT NULL DEFAULT 0,
  `it_soldout` tinyint(4) NOT NULL DEFAULT 0,
  `it_stock_qty` int(11) NOT NULL DEFAULT 0,
  `it_stock_sms` tinyint(4) NOT NULL DEFAULT 0,
  `it_noti_qty` int(11) NOT NULL DEFAULT 0,
  `it_sc_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_sc_method` tinyint(4) NOT NULL DEFAULT 0,
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_min_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_max_qty` int(11) NOT NULL DEFAULT 0,
  `it_head_html` text NOT NULL,
  `it_tail_html` text NOT NULL,
  `it_mobile_head_html` text NOT NULL,
  `it_mobile_tail_html` text NOT NULL,
  `it_hit` int(11) NOT NULL DEFAULT 0,
  `it_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `it_update_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `it_ip` varchar(25) NOT NULL DEFAULT '',
  `it_order` int(11) NOT NULL DEFAULT 0,
  `it_tel_inq` tinyint(4) NOT NULL DEFAULT 0,
  `it_info_gubun` varchar(50) NOT NULL DEFAULT '',
  `it_info_value` text NOT NULL,
  `it_sum_qty` int(11) NOT NULL DEFAULT 0,
  `it_use_cnt` int(11) NOT NULL DEFAULT 0,
  `it_use_avg` decimal(2,1) NOT NULL,
  `it_shop_memo` text NOT NULL,
  `it_review_point` int(11) NOT NULL DEFAULT 0,
  `it_photoreview_point` int(11) NOT NULL DEFAULT 0,
  `it_vodreview_point` int(11) NOT NULL DEFAULT 0,
  `it_snsreview_point` int(11) NOT NULL DEFAULT 0,
  `ec_mall_pid` varchar(255) NOT NULL DEFAULT '',
  `store_mb_id` varchar(50) NOT NULL,
  `it_img1` varchar(255) NOT NULL DEFAULT '',
  `it_img2` varchar(255) NOT NULL DEFAULT '',
  `it_img3` varchar(255) NOT NULL DEFAULT '',
  `it_img4` varchar(255) NOT NULL DEFAULT '',
  `it_img5` varchar(255) NOT NULL DEFAULT '',
  `it_img6` varchar(255) NOT NULL DEFAULT '',
  `it_img7` varchar(255) NOT NULL DEFAULT '',
  `it_img8` varchar(255) NOT NULL DEFAULT '',
  `it_img9` varchar(255) NOT NULL DEFAULT '',
  `it_img10` varchar(255) NOT NULL DEFAULT '',
  `it_1_subj` varchar(255) NOT NULL DEFAULT '',
  `it_2_subj` varchar(255) NOT NULL DEFAULT '',
  `it_3_subj` varchar(255) NOT NULL DEFAULT '',
  `it_4_subj` varchar(255) NOT NULL DEFAULT '',
  `it_5_subj` varchar(255) NOT NULL DEFAULT '',
  `it_6_subj` varchar(255) NOT NULL DEFAULT '',
  `it_7_subj` varchar(255) NOT NULL DEFAULT '',
  `it_8_subj` varchar(255) NOT NULL DEFAULT '',
  `it_9_subj` varchar(255) NOT NULL DEFAULT '',
  `it_10_subj` varchar(255) NOT NULL DEFAULT '',
  `it_1` varchar(255) NOT NULL DEFAULT '',
  `it_2` varchar(255) NOT NULL DEFAULT '',
  `it_3` varchar(255) NOT NULL DEFAULT '',
  `it_4` varchar(255) NOT NULL DEFAULT '',
  `it_5` varchar(255) NOT NULL DEFAULT '',
  `it_6` varchar(255) NOT NULL DEFAULT '',
  `it_7` varchar(255) NOT NULL DEFAULT '',
  `it_8` varchar(255) NOT NULL DEFAULT '',
  `it_9` varchar(255) NOT NULL DEFAULT '',
  `it_10` varchar(255) NOT NULL DEFAULT '',
  `it_approve` int(11) NOT NULL DEFAULT 1,
  `pt_id` varchar(20) NOT NULL,
  `it_quo` varchar(50) NOT NULL,
  PRIMARY KEY (`it_id`),
  KEY `ca_id` (`ca_id`),
  KEY `it_name` (`it_name`),
  KEY `it_seo_title` (`it_seo_title`),
  KEY `it_order` (`it_order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_itemX`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_itemX` (
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `ca_id` varchar(10) NOT NULL DEFAULT '0',
  `ca_id2` varchar(255) NOT NULL DEFAULT '',
  `ca_id3` varchar(255) NOT NULL DEFAULT '',
  `ca_id4` int(11) DEFAULT NULL,
  `ca_id5` int(11) DEFAULT NULL,
  `ca_id6` int(11) DEFAULT NULL,
  `ca_id7` int(11) DEFAULT NULL,
  `ca_id8` int(11) DEFAULT NULL,
  `ca_id9` int(11) DEFAULT NULL,
  `ca_id10` int(11) DEFAULT NULL,
  `it_skin` varchar(255) NOT NULL DEFAULT '',
  `it_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_seo_title` varchar(200) NOT NULL DEFAULT '',
  `it_maker` varchar(255) NOT NULL DEFAULT '',
  `it_origin` varchar(255) NOT NULL DEFAULT '',
  `it_brand` varchar(255) NOT NULL DEFAULT '',
  `it_model` varchar(255) NOT NULL DEFAULT '',
  `it_option_subject` varchar(255) NOT NULL DEFAULT '',
  `it_supply_subject` varchar(255) NOT NULL DEFAULT '',
  `it_type1` tinyint(4) NOT NULL DEFAULT 0,
  `it_type2` tinyint(4) NOT NULL DEFAULT 0,
  `it_type3` tinyint(4) NOT NULL DEFAULT 0,
  `it_type4` tinyint(4) NOT NULL DEFAULT 0,
  `it_type5` tinyint(4) NOT NULL DEFAULT 0,
  `it_type6` tinyint(4) NOT NULL DEFAULT 0,
  `it_type7` tinyint(4) NOT NULL DEFAULT 0,
  `it_type8` tinyint(4) NOT NULL DEFAULT 0,
  `it_basic` text NOT NULL,
  `it_explan` mediumtext NOT NULL,
  `it_explan2` mediumtext NOT NULL,
  `it_mobile_explan` mediumtext NOT NULL,
  `it_cust_price` int(11) NOT NULL DEFAULT 0,
  `it_price` int(11) NOT NULL DEFAULT 0,
  `it_buycost_price` int(11) NOT NULL,
  `it_point` int(11) NOT NULL DEFAULT 0,
  `it_point_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_supply_point` int(11) NOT NULL DEFAULT 0,
  `it_notax` tinyint(4) NOT NULL DEFAULT 0,
  `it_sell_email` varchar(255) NOT NULL DEFAULT '',
  `it_use` tinyint(4) NOT NULL DEFAULT 0,
  `it_nocoupon` tinyint(4) NOT NULL DEFAULT 0,
  `it_soldout` tinyint(4) NOT NULL DEFAULT 0,
  `it_stock_qty` int(11) NOT NULL DEFAULT 0,
  `it_stock_sms` tinyint(4) NOT NULL DEFAULT 0,
  `it_noti_qty` int(11) NOT NULL DEFAULT 0,
  `it_sc_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_sc_method` tinyint(4) NOT NULL DEFAULT 0,
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_min_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_max_qty` int(11) NOT NULL DEFAULT 0,
  `it_head_html` text NOT NULL,
  `it_tail_html` text NOT NULL,
  `it_mobile_head_html` text NOT NULL,
  `it_mobile_tail_html` text NOT NULL,
  `it_hit` int(11) NOT NULL DEFAULT 0,
  `it_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `it_update_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `it_ip` varchar(25) NOT NULL DEFAULT '',
  `it_order` int(11) NOT NULL DEFAULT 0,
  `it_tel_inq` tinyint(4) NOT NULL DEFAULT 0,
  `it_info_gubun` varchar(50) NOT NULL DEFAULT '',
  `it_info_value` text NOT NULL,
  `it_sum_qty` int(11) NOT NULL DEFAULT 0,
  `it_use_cnt` int(11) NOT NULL DEFAULT 0,
  `it_use_avg` decimal(2,1) NOT NULL,
  `it_shop_memo` text NOT NULL,
  `it_review_point` int(11) NOT NULL DEFAULT 0,
  `it_photoreview_point` int(11) NOT NULL DEFAULT 0,
  `it_vodreview_point` int(11) NOT NULL DEFAULT 0,
  `it_snsreview_point` int(11) NOT NULL DEFAULT 0,
  `ec_mall_pid` varchar(255) NOT NULL DEFAULT '',
  `store_mb_id` varchar(50) NOT NULL,
  `it_img1` varchar(255) NOT NULL DEFAULT '',
  `it_img2` varchar(255) NOT NULL DEFAULT '',
  `it_img3` varchar(255) NOT NULL DEFAULT '',
  `it_img4` varchar(255) NOT NULL DEFAULT '',
  `it_img5` varchar(255) NOT NULL DEFAULT '',
  `it_img6` varchar(255) NOT NULL DEFAULT '',
  `it_img7` varchar(255) NOT NULL DEFAULT '',
  `it_img8` varchar(255) NOT NULL DEFAULT '',
  `it_img9` varchar(255) NOT NULL DEFAULT '',
  `it_img10` varchar(255) NOT NULL DEFAULT '',
  `it_1_subj` varchar(255) NOT NULL DEFAULT '',
  `it_2_subj` varchar(255) NOT NULL DEFAULT '',
  `it_3_subj` varchar(255) NOT NULL DEFAULT '',
  `it_4_subj` varchar(255) NOT NULL DEFAULT '',
  `it_5_subj` varchar(255) NOT NULL DEFAULT '',
  `it_6_subj` varchar(255) NOT NULL DEFAULT '',
  `it_7_subj` varchar(255) NOT NULL DEFAULT '',
  `it_8_subj` varchar(255) NOT NULL DEFAULT '',
  `it_9_subj` varchar(255) NOT NULL DEFAULT '',
  `it_10_subj` varchar(255) NOT NULL DEFAULT '',
  `it_1` varchar(255) NOT NULL DEFAULT '',
  `it_2` varchar(255) NOT NULL DEFAULT '',
  `it_3` varchar(255) NOT NULL DEFAULT '',
  `it_4` varchar(255) NOT NULL DEFAULT '',
  `it_5` varchar(255) NOT NULL DEFAULT '',
  `it_6` varchar(255) NOT NULL DEFAULT '',
  `it_7` varchar(255) NOT NULL DEFAULT '',
  `it_8` varchar(255) NOT NULL DEFAULT '',
  `it_9` varchar(255) NOT NULL DEFAULT '',
  `it_10` varchar(255) NOT NULL DEFAULT '',
  `it_approve` int(11) NOT NULL DEFAULT 1,
  `pt_id` varchar(20) NOT NULL,
  `it_quo` varchar(50) NOT NULL,
  PRIMARY KEY (`it_id`),
  KEY `ca_id` (`ca_id`),
  KEY `it_name` (`it_name`),
  KEY `it_seo_title` (`it_seo_title`),
  KEY `it_order` (`it_order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_hit`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_hit` (
  `iht_id` int(11) NOT NULL AUTO_INCREMENT,
  `iht_date` date NOT NULL DEFAULT '0000-00-00',
  `iht_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ca_id` varchar(30) NOT NULL DEFAULT '',
  `it_id` varchar(30) NOT NULL DEFAULT '',
  `hit` int(11) NOT NULL,
  `mb_id` text NOT NULL,
  `ip_list` text NOT NULL,
  PRIMARY KEY (`iht_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_i18n`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_i18n` (
  `it_id` varchar(20) NOT NULL,
  `lang` varchar(10) NOT NULL,
  `it_name` varchar(500) NOT NULL DEFAULT '',
  `it_basic` text DEFAULT NULL,
  `it_explan` mediumtext DEFAULT NULL,
  `translated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`it_id`,`lang`),
  KEY `idx_lang` (`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_option`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_option` (
  `io_no` int(11) NOT NULL AUTO_INCREMENT,
  `io_id` varchar(255) NOT NULL DEFAULT '0',
  `io_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `io_price` int(11) NOT NULL DEFAULT 0,
  `io_stock_qty` int(11) NOT NULL DEFAULT 0,
  `io_noti_qty` int(11) NOT NULL DEFAULT 0,
  `io_use` tinyint(4) NOT NULL DEFAULT 0,
  `io_discount_percent` int(11) DEFAULT 0 COMMENT '옵션 할인율\n추가 251230',
  `io_discount_price` int(11) DEFAULT 0 COMMENT '할인율에 따른 할인금액\n추가 251230',
  PRIMARY KEY (`io_no`),
  KEY `io_id` (`io_id`),
  KEY `it_id` (`it_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2149 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_qa`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_qa` (
  `iq_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `iq_secret` tinyint(4) NOT NULL DEFAULT 0,
  `iq_name` varchar(255) NOT NULL DEFAULT '',
  `iq_email` varchar(255) NOT NULL DEFAULT '',
  `iq_hp` varchar(255) NOT NULL DEFAULT '',
  `iq_password` varchar(255) NOT NULL DEFAULT '',
  `iq_subject` varchar(255) NOT NULL DEFAULT '',
  `iq_question` text NOT NULL,
  `iq_answer` text NOT NULL,
  `iq_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `iq_timeanswer` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `iq_ip` varchar(25) NOT NULL DEFAULT '',
  `iq_inquiryid` varchar(20) NOT NULL DEFAULT '',
  `iq_answercontentid` varchar(20) NOT NULL DEFAULT '',
  `iq_productorderid` varchar(20) NOT NULL DEFAULT '',
  `iq_orderid` varchar(20) NOT NULL DEFAULT '',
  `iq_answer_time` varchar(20) NOT NULL,
  PRIMARY KEY (`iq_id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_relation`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_relation` (
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `it_id2` varchar(20) NOT NULL DEFAULT '',
  `ir_no` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`it_id`,`it_id2`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_stocksms`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_stocksms` (
  `ss_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `ss_hp` varchar(255) NOT NULL DEFAULT '',
  `ss_send` tinyint(4) NOT NULL DEFAULT 0,
  `ss_send_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ss_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ss_ip` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`ss_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_trash`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_trash` (
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `ca_id` varchar(10) NOT NULL DEFAULT '0',
  `ca_id2` varchar(255) NOT NULL DEFAULT '',
  `ca_id3` varchar(255) NOT NULL DEFAULT '',
  `it_skin` varchar(255) NOT NULL DEFAULT '',
  `it_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_seo_title` varchar(200) NOT NULL DEFAULT '',
  `it_maker` varchar(255) NOT NULL DEFAULT '',
  `it_origin` varchar(255) NOT NULL DEFAULT '',
  `it_brand` varchar(255) NOT NULL DEFAULT '',
  `it_model` varchar(255) NOT NULL DEFAULT '',
  `it_option_subject` varchar(255) NOT NULL DEFAULT '',
  `it_supply_subject` varchar(255) NOT NULL DEFAULT '',
  `it_type1` tinyint(4) NOT NULL DEFAULT 0,
  `it_type2` tinyint(4) NOT NULL DEFAULT 0,
  `it_type3` tinyint(4) NOT NULL DEFAULT 0,
  `it_type4` tinyint(4) NOT NULL DEFAULT 0,
  `it_type5` tinyint(4) NOT NULL DEFAULT 0,
  `it_basic` text NOT NULL,
  `it_explan` mediumtext NOT NULL,
  `it_explan2` mediumtext NOT NULL,
  `it_mobile_explan` mediumtext NOT NULL,
  `it_cust_price` int(11) NOT NULL DEFAULT 0,
  `it_price` int(11) NOT NULL DEFAULT 0,
  `it_point` int(11) NOT NULL DEFAULT 0,
  `it_point_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_supply_point` int(11) NOT NULL DEFAULT 0,
  `it_notax` tinyint(4) NOT NULL DEFAULT 0,
  `it_sell_email` varchar(255) NOT NULL DEFAULT '',
  `it_use` tinyint(4) NOT NULL DEFAULT 0,
  `it_nocoupon` tinyint(4) NOT NULL DEFAULT 0,
  `it_soldout` tinyint(4) NOT NULL DEFAULT 0,
  `it_stock_qty` int(11) NOT NULL DEFAULT 0,
  `it_stock_sms` tinyint(4) NOT NULL DEFAULT 0,
  `it_noti_qty` int(11) NOT NULL DEFAULT 0,
  `it_sc_type` tinyint(4) NOT NULL DEFAULT 0,
  `it_sc_method` tinyint(4) NOT NULL DEFAULT 0,
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_min_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_max_qty` int(11) NOT NULL DEFAULT 0,
  `it_head_html` text NOT NULL,
  `it_tail_html` text NOT NULL,
  `it_mobile_head_html` text NOT NULL,
  `it_mobile_tail_html` text NOT NULL,
  `it_hit` int(11) NOT NULL DEFAULT 0,
  `it_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `it_update_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `it_ip` varchar(25) NOT NULL DEFAULT '',
  `it_order` int(11) NOT NULL DEFAULT 0,
  `it_tel_inq` tinyint(4) NOT NULL DEFAULT 0,
  `it_info_gubun` varchar(50) NOT NULL DEFAULT '',
  `it_info_value` text NOT NULL,
  `it_sum_qty` int(11) NOT NULL DEFAULT 0,
  `it_use_cnt` int(11) NOT NULL DEFAULT 0,
  `it_use_avg` decimal(2,1) NOT NULL,
  `it_shop_memo` text NOT NULL,
  `ec_mall_pid` varchar(255) NOT NULL DEFAULT '',
  `it_buycost_price` int(11) NOT NULL,
  `it_review_point` int(11) NOT NULL DEFAULT 0,
  `it_photoreview_point` int(11) NOT NULL DEFAULT 0,
  `it_vodreview_point` int(11) NOT NULL DEFAULT 0,
  `it_snsreview_point` int(11) NOT NULL DEFAULT 0,
  `store_mb_id` varchar(50) NOT NULL,
  `it_img1` varchar(255) NOT NULL DEFAULT '',
  `it_img2` varchar(255) NOT NULL DEFAULT '',
  `it_img3` varchar(255) NOT NULL DEFAULT '',
  `it_img4` varchar(255) NOT NULL DEFAULT '',
  `it_img5` varchar(255) NOT NULL DEFAULT '',
  `it_img6` varchar(255) NOT NULL DEFAULT '',
  `it_img7` varchar(255) NOT NULL DEFAULT '',
  `it_img8` varchar(255) NOT NULL DEFAULT '',
  `it_img9` varchar(255) NOT NULL DEFAULT '',
  `it_img10` varchar(255) NOT NULL DEFAULT '',
  `it_1_subj` varchar(255) NOT NULL DEFAULT '',
  `it_2_subj` varchar(255) NOT NULL DEFAULT '',
  `it_3_subj` varchar(255) NOT NULL DEFAULT '',
  `it_4_subj` varchar(255) NOT NULL DEFAULT '',
  `it_5_subj` varchar(255) NOT NULL DEFAULT '',
  `it_6_subj` varchar(255) NOT NULL DEFAULT '',
  `it_7_subj` varchar(255) NOT NULL DEFAULT '',
  `it_8_subj` varchar(255) NOT NULL DEFAULT '',
  `it_9_subj` varchar(255) NOT NULL DEFAULT '',
  `it_10_subj` varchar(255) NOT NULL DEFAULT '',
  `it_1` varchar(255) NOT NULL DEFAULT '',
  `it_2` varchar(255) NOT NULL DEFAULT '',
  `it_3` varchar(255) NOT NULL DEFAULT '',
  `it_4` varchar(255) NOT NULL DEFAULT '',
  `it_5` varchar(255) NOT NULL DEFAULT '',
  `it_6` varchar(255) NOT NULL DEFAULT '',
  `it_7` varchar(255) NOT NULL DEFAULT '',
  `it_8` varchar(255) NOT NULL DEFAULT '',
  `it_9` varchar(255) NOT NULL DEFAULT '',
  `it_10` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`it_id`),
  KEY `ca_id` (`ca_id`),
  KEY `it_name` (`it_name`),
  KEY `it_seo_title` (`it_seo_title`),
  KEY `it_order` (`it_order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_item_use`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_item_use` (
  `is_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '0',
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `is_name` varchar(255) NOT NULL DEFAULT '',
  `is_password` varchar(255) NOT NULL DEFAULT '',
  `is_score` tinyint(4) NOT NULL DEFAULT 0,
  `is_subject` varchar(255) NOT NULL DEFAULT '',
  `is_content` text NOT NULL,
  `is_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_ip` varchar(25) NOT NULL DEFAULT '',
  `is_confirm` tinyint(4) NOT NULL DEFAULT 0,
  `is_purchasereviewid` varchar(20) NOT NULL DEFAULT '',
  `is_productorderid` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`is_id`),
  KEY `index1` (`it_id`)
) ENGINE=MyISAM AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_order`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_order` (
  `od_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `od_name` varchar(20) NOT NULL DEFAULT '',
  `od_email` varchar(100) NOT NULL DEFAULT '',
  `od_tel` varchar(20) NOT NULL DEFAULT '',
  `od_hp` varchar(20) NOT NULL DEFAULT '',
  `od_zip1` varchar(8) NOT NULL DEFAULT '',
  `od_zip2` char(3) NOT NULL DEFAULT '',
  `od_addr1` varchar(100) NOT NULL DEFAULT '',
  `od_addr2` varchar(100) NOT NULL DEFAULT '',
  `od_addr3` varchar(255) NOT NULL DEFAULT '',
  `od_addr_jibeon` varchar(255) NOT NULL DEFAULT '',
  `od_deposit_name` varchar(20) NOT NULL DEFAULT '',
  `od_deposit_bank` varchar(20) NOT NULL DEFAULT '',
  `od_b_name` varchar(20) NOT NULL DEFAULT '',
  `od_b_tel` varchar(20) NOT NULL DEFAULT '',
  `od_b_hp` varchar(20) NOT NULL DEFAULT '',
  `od_b_zip1` varchar(8) NOT NULL DEFAULT '',
  `od_b_zip2` char(3) NOT NULL DEFAULT '',
  `od_b_addr1` varchar(100) NOT NULL DEFAULT '',
  `od_b_addr2` varchar(100) NOT NULL DEFAULT '',
  `od_b_addr3` varchar(255) NOT NULL DEFAULT '',
  `od_b_addr_jibeon` varchar(255) NOT NULL DEFAULT '',
  `od_memo` text DEFAULT NULL,
  `od_cancel_memo` varchar(300) DEFAULT NULL,
  `od_cart_count` int(11) NOT NULL DEFAULT 0,
  `od_cart_price` int(11) NOT NULL DEFAULT 0,
  `od_cart_coupon` int(11) NOT NULL DEFAULT 0,
  `od_send_cost` int(11) NOT NULL DEFAULT 0,
  `od_send_flag` varchar(3) NOT NULL DEFAULT '0',
  `od_send_cost2` int(11) NOT NULL DEFAULT 0,
  `od_send_coupon` int(11) NOT NULL DEFAULT 0,
  `od_receipt_price` int(11) NOT NULL DEFAULT 0,
  `od_cancel_price` int(11) NOT NULL DEFAULT 0,
  `od_receipt_point` int(11) NOT NULL DEFAULT 0,
  `od_refund_price` int(11) NOT NULL DEFAULT 0,
  `od_bank_account` varchar(255) NOT NULL DEFAULT '',
  `od_card_quota` varchar(2) DEFAULT '' COMMENT '카드할부개월수',
  `od_receipt_time` varchar(50) DEFAULT NULL COMMENT '결제시간',
  `od_coupon` int(11) NOT NULL DEFAULT 0,
  `od_misu` int(11) NOT NULL DEFAULT 0,
  `od_shop_memo` text DEFAULT NULL,
  `od_mod_history` text DEFAULT NULL,
  `od_status` varchar(255) NOT NULL DEFAULT '' COMMENT '주문,입금,준비,배송,완료,반품,취소,취소요청',
  `od_cancel_status` varchar(1) DEFAULT NULL COMMENT '1:취소요청,2:취소승인,3:취소반려',
  `od_cancel_time` varchar(20) DEFAULT NULL COMMENT '취소 신청 일시',
  `od_hope_date` varchar(50) NOT NULL DEFAULT '0000-00-00',
  `od_settle_case` varchar(255) NOT NULL DEFAULT '',
  `od_other_pay_type` varchar(100) NOT NULL DEFAULT '',
  `od_test` varchar(3) NOT NULL DEFAULT '0',
  `od_mobile` varchar(3) NOT NULL DEFAULT '0',
  `od_pg` varchar(255) NOT NULL DEFAULT '',
  `od_tno` varchar(255) NOT NULL DEFAULT '',
  `od_app_no` varchar(20) NOT NULL DEFAULT '',
  `od_escrow` varchar(3) NOT NULL DEFAULT '0',
  `od_casseqno` varchar(255) NOT NULL DEFAULT '',
  `od_tax_flag` varchar(3) NOT NULL DEFAULT '0',
  `od_tax_mny` int(11) NOT NULL DEFAULT 0,
  `od_vat_mny` int(11) NOT NULL DEFAULT 0,
  `od_free_mny` int(11) NOT NULL DEFAULT 0,
  `od_delivery_company` varchar(255) DEFAULT NULL,
  `od_invoice` varchar(255) NOT NULL DEFAULT '',
  `od_invoice_time` varchar(20) DEFAULT NULL,
  `od_cash` varchar(3) DEFAULT NULL,
  `od_cash_no` varchar(255) DEFAULT NULL,
  `od_cash_info` text DEFAULT NULL,
  `od_time` varchar(50) NOT NULL COMMENT '주문시간',
  `od_pwd` varchar(255) NOT NULL DEFAULT '',
  `od_ip` varchar(25) NOT NULL DEFAULT '',
  `pt_case` varchar(255) NOT NULL DEFAULT '',
  `pt_price` varchar(255) NOT NULL DEFAULT '',
  `pt_memo` varchar(255) NOT NULL DEFAULT '',
  `od_bill_hp` varchar(255) DEFAULT NULL COMMENT '현금영수증 발급시 휴대폰번호',
  `change_it_id` varchar(255) DEFAULT NULL,
  `change_it_option` varchar(255) DEFAULT NULL,
  `return_flag` int(11) DEFAULT 0,
  `change_flag` int(11) DEFAULT 0,
  `csalarm` varchar(255) DEFAULT NULL,
  `od_deliver_request` varchar(255) DEFAULT NULL,
  `od_naver_orderid` varchar(20) NOT NULL DEFAULT '',
  `od_naver_sync_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `od_gift` int(11) NOT NULL DEFAULT 0 COMMENT '0 일반주문 1 선물세트',
  `od_gift_name` varchar(50) NOT NULL DEFAULT '',
  `od_gift_hp` varchar(50) NOT NULL DEFAULT '',
  `od_gift_msg` text NOT NULL,
  PRIMARY KEY (`od_id`) USING BTREE,
  KEY `index2` (`mb_id`) USING BTREE,
  KEY `ix_naver_orderid` (`od_naver_orderid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='주문';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_order_address`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_order_address` (
  `ad_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `ad_subject` varchar(255) NOT NULL DEFAULT '',
  `ad_default` tinyint(4) NOT NULL DEFAULT 0,
  `ad_name` varchar(255) NOT NULL DEFAULT '',
  `ad_tel` varchar(255) NOT NULL DEFAULT '',
  `ad_hp` varchar(255) NOT NULL DEFAULT '',
  `ad_zip1` char(3) NOT NULL DEFAULT '',
  `ad_zip2` char(3) NOT NULL DEFAULT '',
  `ad_addr1` varchar(255) NOT NULL DEFAULT '',
  `ad_addr2` varchar(255) NOT NULL DEFAULT '',
  `ad_addr3` varchar(255) NOT NULL DEFAULT '',
  `ad_jibeon` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ad_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_order_atmcheck`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_order_atmcheck` (
  `id_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(25) NOT NULL,
  `od_id` varchar(20) NOT NULL,
  `mb_id` varchar(255) NOT NULL,
  `id_name` varchar(255) NOT NULL,
  `id_password` varchar(255) NOT NULL,
  `id_subject` varchar(255) NOT NULL,
  `od_bank_account` varchar(255) NOT NULL,
  `id_deposit_name` varchar(20) NOT NULL,
  `id_money` varchar(20) NOT NULL,
  `id_deposit_date` date NOT NULL DEFAULT '0000-00-00',
  `id_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `id_ip` varchar(25) NOT NULL,
  `id_confirm` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_id`),
  KEY `index1` (`od_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_order_data`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_order_data` (
  `od_id` bigint(20) unsigned NOT NULL,
  `cart_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `dt_pg` varchar(255) NOT NULL DEFAULT '',
  `dt_data` text NOT NULL,
  `dt_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  KEY `od_id` (`od_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_order_delete`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_order_delete` (
  `de_id` int(11) NOT NULL AUTO_INCREMENT,
  `de_key` varchar(255) NOT NULL DEFAULT '',
  `de_data` longtext NOT NULL,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `de_ip` varchar(255) NOT NULL DEFAULT '',
  `de_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`de_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_order_post_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_order_post_log` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `oid` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `post_data` text NOT NULL,
  `ol_code` varchar(255) NOT NULL DEFAULT '',
  `ol_msg` text NOT NULL,
  `ol_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ol_ip` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`log_id`)
) ENGINE=MyISAM AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_personalpay`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_personalpay` (
  `pp_id` bigint(20) unsigned NOT NULL,
  `od_id` bigint(20) unsigned NOT NULL,
  `pp_name` varchar(255) NOT NULL DEFAULT '',
  `pp_email` varchar(255) NOT NULL DEFAULT '',
  `pp_hp` varchar(255) NOT NULL DEFAULT '',
  `pp_content` text NOT NULL,
  `pp_use` tinyint(4) NOT NULL DEFAULT 0,
  `pp_price` int(11) NOT NULL DEFAULT 0,
  `pp_pg` varchar(255) NOT NULL DEFAULT '',
  `pp_tno` varchar(255) NOT NULL DEFAULT '',
  `pp_app_no` varchar(20) NOT NULL DEFAULT '',
  `pp_casseqno` varchar(255) NOT NULL DEFAULT '',
  `pp_receipt_price` int(11) NOT NULL DEFAULT 0,
  `pp_settle_case` varchar(255) NOT NULL DEFAULT '',
  `pp_bank_account` varchar(255) NOT NULL DEFAULT '',
  `pp_deposit_name` varchar(255) NOT NULL DEFAULT '',
  `pp_receipt_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `pp_receipt_ip` varchar(255) NOT NULL DEFAULT '',
  `pp_shop_memo` text NOT NULL,
  `pp_cash` tinyint(4) NOT NULL DEFAULT 0,
  `pp_cash_no` varchar(255) NOT NULL DEFAULT '',
  `pp_cash_info` text NOT NULL,
  `pp_ip` varchar(255) NOT NULL DEFAULT '',
  `pp_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`pp_id`),
  KEY `od_id` (`od_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_sendcost`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_sendcost` (
  `sc_id` int(11) NOT NULL AUTO_INCREMENT,
  `sc_name` varchar(255) NOT NULL DEFAULT '',
  `sc_zip1` varchar(10) NOT NULL DEFAULT '',
  `sc_zip2` varchar(10) NOT NULL DEFAULT '',
  `sc_price` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`sc_id`),
  KEY `sc_zip1` (`sc_zip1`),
  KEY `sc_zip2` (`sc_zip2`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_shop_wish`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_shop_wish` (
  `wi_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `it_id` varchar(20) NOT NULL DEFAULT '0',
  `wi_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wi_ip` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`wi_id`),
  KEY `index1` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_sms_auth`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_sms_auth` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_hp` varchar(20) NOT NULL DEFAULT '',
  `authNo` varchar(20) NOT NULL DEFAULT '',
  `reg_date` varchar(20) NOT NULL DEFAULT '',
  KEY `wr_id` (`wr_id`)
) ENGINE=MyISAM AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_uniqid`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_uniqid` (
  `uq_id` bigint(20) unsigned NOT NULL,
  `uq_ip` varchar(255) NOT NULL,
  PRIMARY KEY (`uq_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_visit`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_visit` (
  `vi_id` int(11) NOT NULL DEFAULT 0,
  `vi_ip` varchar(100) NOT NULL DEFAULT '',
  `vi_date` date NOT NULL DEFAULT '0000-00-00',
  `vi_time` time NOT NULL DEFAULT '00:00:00',
  `vi_referer` text NOT NULL,
  `vi_agent` varchar(200) NOT NULL DEFAULT '',
  `vi_browser` varchar(255) NOT NULL DEFAULT '',
  `vi_os` varchar(255) NOT NULL DEFAULT '',
  `vi_device` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`vi_id`),
  UNIQUE KEY `index1` (`vi_ip`,`vi_date`),
  KEY `index2` (`vi_date`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_visit_sum`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_visit_sum` (
  `vs_date` date NOT NULL DEFAULT '0000-00-00',
  `vs_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`vs_date`),
  KEY `index1` (`vs_count`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_advertise`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_advertise` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL,
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_ask`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_ask` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL,
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_customer`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_customer` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL,
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_event`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_event` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL,
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_faq`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_faq` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL,
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_free`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_free` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL DEFAULT '',
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_gallery`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_gallery` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL DEFAULT '',
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_notice`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_notice` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL DEFAULT '',
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  `is_notice` tinyint(4) NOT NULL DEFAULT 0,
  `wr_subject_ja` varchar(255) DEFAULT NULL,
  `wr_content_ja` text DEFAULT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_qa`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_qa` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL DEFAULT '',
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_qna`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_qna` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `wr_num` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(10) NOT NULL,
  `wr_parent` int(11) NOT NULL DEFAULT 0,
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_comment` int(11) NOT NULL DEFAULT 0,
  `wr_comment_reply` varchar(5) NOT NULL,
  `ca_name` varchar(255) NOT NULL,
  `wr_option` set('html1','html2','secret','mail') NOT NULL,
  `wr_subject` varchar(255) NOT NULL,
  `wr_content` text NOT NULL,
  `wr_seo_title` varchar(255) NOT NULL,
  `wr_link1` text NOT NULL,
  `wr_link2` text NOT NULL,
  `wr_link1_hit` int(11) NOT NULL DEFAULT 0,
  `wr_link2_hit` int(11) NOT NULL DEFAULT 0,
  `wr_hit` int(11) NOT NULL DEFAULT 0,
  `wr_good` int(11) NOT NULL DEFAULT 0,
  `wr_nogood` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL,
  `wr_password` varchar(255) NOT NULL,
  `wr_name` varchar(255) NOT NULL,
  `wr_email` varchar(255) NOT NULL,
  `wr_homepage` varchar(255) NOT NULL,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_file` tinyint(4) NOT NULL DEFAULT 0,
  `wr_last` varchar(19) NOT NULL,
  `wr_ip` varchar(255) NOT NULL,
  `wr_facebook_user` varchar(255) NOT NULL,
  `wr_twitter_user` varchar(255) NOT NULL,
  `wr_1` varchar(255) NOT NULL,
  `wr_2` varchar(255) NOT NULL,
  `wr_3` varchar(255) NOT NULL,
  `wr_4` varchar(255) NOT NULL,
  `wr_5` varchar(255) NOT NULL,
  `wr_6` varchar(255) NOT NULL,
  `wr_7` varchar(255) NOT NULL,
  `wr_8` varchar(255) NOT NULL,
  `wr_9` varchar(255) NOT NULL,
  `wr_10` varchar(255) NOT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `wr_seo_title` (`wr_seo_title`),
  KEY `wr_num_reply_parent` (`wr_num`,`wr_reply`,`wr_parent`),
  KEY `wr_is_comment` (`wr_is_comment`,`wr_id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `g5_write_review`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `g5_write_review` (
  `wr_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(20) NOT NULL,
  `it_id` varchar(30) NOT NULL,
  `od_id` varchar(20) NOT NULL DEFAULT '',
  `wr_subject` varchar(255) NOT NULL DEFAULT '',
  `wr_content` text NOT NULL,
  `wr_rating` tinyint(4) NOT NULL DEFAULT 5,
  `wr_datetime` datetime NOT NULL,
  `wr_ip` varchar(50) NOT NULL DEFAULT '',
  `wr_is_comment` tinyint(4) NOT NULL DEFAULT 0,
  `wr_parent_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`wr_id`),
  KEY `idx_it_id` (`it_id`),
  KEY `idx_mb_id` (`mb_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gift_receivers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `gift_receivers` (
  `order_id` bigint(20) unsigned NOT NULL,
  `name` varchar(20) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `address1` varchar(100) DEFAULT NULL,
  `address2` varchar(100) DEFAULT NULL,
  `address3` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `order_item` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_mgr_id` int(11) DEFAULT NULL COMMENT '寃ъ쟻??ID',
  `item_id` int(11) DEFAULT NULL COMMENT '?꾩씠??ID',
  `order_cnt` int(11) NOT NULL DEFAULT 1 COMMENT '二쇰Ц 媛쒖닔',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=783 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_mgr`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `order_mgr` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `mb_no` int(11) DEFAULT NULL,
  `mb_id` varchar(50) DEFAULT NULL,
  `mb_hp` varchar(50) DEFAULT NULL,
  `mb_nick` varchar(50) DEFAULT NULL,
  `mb_name` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `pay_at` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_cs_posts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `shop_cs_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(500) NOT NULL,
  `content` mediumtext NOT NULL,
  `is_notice` tinyint(4) NOT NULL DEFAULT 0,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` varchar(100) DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `title_ja` varchar(255) DEFAULT NULL,
  `content_ja` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_events`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `shop_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL DEFAULT '',
  `thumbnail` varchar(500) DEFAULT '',
  `content` longtext DEFAULT '',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `title_ja` varchar(200) DEFAULT NULL,
  `content_ja` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_faqs`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `shop_faqs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL DEFAULT '일반',
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category_ja` varchar(100) DEFAULT NULL,
  `question_ja` varchar(500) DEFAULT NULL,
  `answer_ja` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_main_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `shop_main_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `badge_text` varchar(50) DEFAULT '',
  `badge_color` varchar(25) DEFAULT '#86efac',
  `title_line1` varchar(100) DEFAULT '',
  `title_line2` varchar(100) DEFAULT '',
  `sub_text` varchar(300) DEFAULT '',
  `cta_text` varchar(60) DEFAULT '',
  `cta_bg` varchar(25) DEFAULT '#ffffff',
  `cta_color` varchar(25) DEFAULT '#1b6e45',
  `bg_gradient` varchar(250) DEFAULT '',
  `link_url` varchar(500) DEFAULT '',
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(4) DEFAULT 1,
  `categories_json` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_promo_banners`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `shop_promo_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slot` varchar(20) NOT NULL,
  `slot_name` varchar(100) DEFAULT '',
  `image_url` varchar(500) DEFAULT '',
  `link_url` varchar(500) DEFAULT '',
  `is_active` tinyint(4) DEFAULT 1,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slot` (`slot`)
) ENGINE=InnoDB AUTO_INCREMENT=1276 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shortURL`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `shortURL` (
  `seq` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(255) DEFAULT NULL,
  `surl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`seq`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_book`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_book` (
  `bk_no` int(11) NOT NULL AUTO_INCREMENT,
  `bg_no` int(11) NOT NULL DEFAULT 0,
  `mb_no` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `bk_name` varchar(255) NOT NULL DEFAULT '',
  `bk_hp` varchar(255) NOT NULL DEFAULT '',
  `bk_receipt` tinyint(4) NOT NULL DEFAULT 0,
  `bk_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bk_memo` text NOT NULL,
  PRIMARY KEY (`bk_no`),
  KEY `bk_name` (`bk_name`),
  KEY `bk_hp` (`bk_hp`),
  KEY `mb_no` (`mb_no`),
  KEY `bg_no` (`bg_no`,`bk_no`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_book_group`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_book_group` (
  `bg_no` int(11) NOT NULL AUTO_INCREMENT,
  `bg_name` varchar(255) NOT NULL DEFAULT '',
  `bg_count` int(11) NOT NULL DEFAULT 0,
  `bg_member` int(11) NOT NULL DEFAULT 0,
  `bg_nomember` int(11) NOT NULL DEFAULT 0,
  `bg_receipt` int(11) NOT NULL DEFAULT 0,
  `bg_reject` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bg_no`),
  KEY `bg_name` (`bg_name`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_config` (
  `cf_phone` varchar(255) NOT NULL DEFAULT '',
  `cf_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_form`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_form` (
  `fo_no` int(11) NOT NULL AUTO_INCREMENT,
  `fg_no` tinyint(4) NOT NULL DEFAULT 0,
  `fg_member` char(1) NOT NULL DEFAULT '0',
  `fo_name` varchar(255) NOT NULL DEFAULT '',
  `fo_content` text NOT NULL,
  `fo_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`fo_no`),
  KEY `fg_no` (`fg_no`,`fo_no`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_form_group`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_form_group` (
  `fg_no` int(11) NOT NULL AUTO_INCREMENT,
  `fg_name` varchar(255) NOT NULL DEFAULT '',
  `fg_count` int(11) NOT NULL DEFAULT 0,
  `fg_member` tinyint(4) NOT NULL,
  PRIMARY KEY (`fg_no`),
  KEY `fg_name` (`fg_name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_history`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_history` (
  `hs_no` int(11) NOT NULL AUTO_INCREMENT,
  `wr_no` int(11) NOT NULL DEFAULT 0,
  `wr_renum` int(11) NOT NULL DEFAULT 0,
  `bg_no` int(11) NOT NULL DEFAULT 0,
  `mb_no` int(11) NOT NULL DEFAULT 0,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `bk_no` int(11) NOT NULL DEFAULT 0,
  `hs_name` varchar(30) NOT NULL DEFAULT '',
  `hs_hp` varchar(255) NOT NULL DEFAULT '',
  `hs_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `hs_flag` tinyint(4) NOT NULL DEFAULT 0,
  `hs_code` varchar(255) NOT NULL DEFAULT '',
  `hs_memo` varchar(255) NOT NULL DEFAULT '',
  `hs_log` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`hs_no`),
  KEY `wr_no` (`wr_no`),
  KEY `mb_no` (`mb_no`),
  KEY `bk_no` (`bk_no`),
  KEY `hs_hp` (`hs_hp`),
  KEY `hs_code` (`hs_code`),
  KEY `bg_no` (`bg_no`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms5_write`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sms5_write` (
  `wr_no` int(11) NOT NULL DEFAULT 1,
  `wr_renum` int(11) NOT NULL DEFAULT 0,
  `wr_reply` varchar(255) NOT NULL DEFAULT '',
  `wr_message` varchar(255) NOT NULL DEFAULT '',
  `wr_booking` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_total` int(11) NOT NULL DEFAULT 0,
  `wr_re_total` int(11) NOT NULL DEFAULT 0,
  `wr_success` int(11) NOT NULL DEFAULT 0,
  `wr_failure` int(11) NOT NULL DEFAULT 0,
  `wr_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `wr_memo` text NOT NULL,
  KEY `wr_no` (`wr_no`,`wr_renum`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_apms_partner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_apms_partner` (
  `pt_no` int(11) NOT NULL AUTO_INCREMENT,
  `pt_type` varchar(3) NOT NULL DEFAULT '0',
  `pt_partner` varchar(3) NOT NULL DEFAULT '0',
  `pt_marketer` varchar(50) DEFAULT '0',
  `pt_filter1` varchar(50) DEFAULT '0' COMMENT '브랜드 필터 럭셔리',
  `pt_filter2` varchar(50) DEFAULT '0' COMMENT '브랜드 필터 디자이너',
  `pt_filter3` varchar(50) DEFAULT '0' COMMENT '브랜드 필터 브랜드',
  `pt_id` varchar(255) DEFAULT '',
  `pt_register` varchar(8) DEFAULT '',
  `pt_group_id` varchar(20) DEFAULT '',
  `pt_manager` varchar(50) DEFAULT '',
  `pt_datetime` varchar(20) DEFAULT '',
  `pt_leave` varchar(8) DEFAULT '',
  `pt_name` varchar(255) DEFAULT '',
  `pt_email` varchar(255) DEFAULT '',
  `pt_buseo` varchar(20) DEFAULT NULL,
  `pt_hp` varchar(20) DEFAULT '',
  `pt_tel` varchar(20) DEFAULT '',
  `pt_company` varchar(255) DEFAULT '',
  `pt_company_name` varchar(255) DEFAULT '',
  `pt_company_president` varchar(255) DEFAULT '',
  `pt_company_saupja` varchar(255) DEFAULT '',
  `pt_company_addr` varchar(255) DEFAULT '',
  `pt_company_type` varchar(255) DEFAULT '',
  `pt_company_item` varchar(255) DEFAULT '',
  `pt_bank_name` varchar(255) DEFAULT '',
  `pt_bank_account` varchar(255) DEFAULT '',
  `pt_bank_holder` varchar(255) DEFAULT '',
  `pt_bank_limit` varchar(3) NOT NULL DEFAULT '0',
  `pt_flag` varchar(3) NOT NULL DEFAULT '0',
  `pt_point` int(11) NOT NULL DEFAULT 0,
  `pt_benefit` int(11) NOT NULL DEFAULT 0,
  `pt_level` varchar(3) NOT NULL DEFAULT '1',
  `pt_limit` varchar(3) NOT NULL DEFAULT '0',
  `pt_commission_1` varchar(3) DEFAULT '0',
  `pt_commission_2` varchar(3) DEFAULT '0',
  `pt_commission_3` varchar(3) DEFAULT '0',
  `pt_commission_4` varchar(3) DEFAULT '0',
  `pt_commission_5` varchar(3) DEFAULT '0',
  `pt_incentive_1` varchar(3) DEFAULT '0',
  `pt_incentive_2` varchar(3) DEFAULT '0',
  `pt_incentive_3` varchar(3) DEFAULT '0',
  `pt_incentive_4` varchar(3) DEFAULT '0',
  `pt_incentive_5` varchar(3) DEFAULT '0',
  `pt_memo` text DEFAULT NULL,
  `pt_1` varchar(255) DEFAULT '',
  `pt_2` varchar(255) DEFAULT '',
  `pt_3` varchar(255) DEFAULT '',
  `pt_4` varchar(255) DEFAULT '',
  `pt_5` varchar(255) DEFAULT '',
  `pt_6` varchar(255) DEFAULT '',
  `pt_7` varchar(255) DEFAULT '',
  `pt_8` varchar(255) DEFAULT '',
  `pt_9` varchar(255) DEFAULT '',
  `pt_10` varchar(255) DEFAULT '',
  `pt_refund_account_holder` varchar(255) DEFAULT '',
  `pt_refund_account_number` varchar(255) DEFAULT '',
  `pt_refund_bank` varchar(255) DEFAULT '',
  `pt_brand_name_kr` varchar(255) DEFAULT '' COMMENT '브랜드명 (국문)',
  `pt_brand_name_en` varchar(255) DEFAULT '' COMMENT '브랜드명 (영문)',
  `pt_brand_name_main` varchar(255) DEFAULT '' COMMENT '대표명칭',
  `pt_brand_tel` varchar(255) DEFAULT '' COMMENT '업체 전화번호',
  `pt_zip` varchar(255) DEFAULT '',
  `pt_addr1` varchar(255) DEFAULT '',
  `pt_addr2` varchar(255) DEFAULT '',
  `pt_addr3` varchar(255) DEFAULT '',
  `pt_addr4` varchar(255) DEFAULT '',
  `pt_addr5` varchar(255) DEFAULT '',
  `pt_addr6` varchar(255) DEFAULT '',
  `delivery_fee` varchar(255) DEFAULT '',
  `pt_rrn` varchar(255) DEFAULT '',
  `pt_business_license` varchar(255) DEFAULT '' COMMENT '사업자등록증',
  `pt_id_file` varchar(255) DEFAULT '' COMMENT '신분증',
  `pt_thumbnail` varchar(255) DEFAULT '' COMMENT '브랜드 썸네일 (브랜드 상세페이지)',
  `pt_title` varchar(255) DEFAULT '' COMMENT '브랜드 타이틀',
  `pt_content` text DEFAULT NULL COMMENT '브랜드 내용',
  `pt_product` text DEFAULT NULL COMMENT '배너 상품선택',
  `pt_category` text DEFAULT NULL,
  `pt_style` text DEFAULT NULL,
  `pt_recommend` varchar(3) DEFAULT NULL,
  `pt_recommend_order` int(11) DEFAULT 0,
  `pt_logo` varchar(255) DEFAULT '' COMMENT '로고 이미지',
  PRIMARY KEY (`pt_no`) USING BTREE,
  UNIQUE KEY `pt_id` (`pt_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=227 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='브랜드 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_page_cnt`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_page_cnt` (
  `page_idx` int(11) NOT NULL AUTO_INCREMENT,
  `page_url` varchar(255) NOT NULL DEFAULT '',
  `page_cnt` int(11) NOT NULL DEFAULT 10,
  `reg_date` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`page_idx`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_adhoc`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_adhoc` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_sub_title` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) DEFAULT NULL,
  `bn_new_win` varchar(3) DEFAULT NULL,
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` tinyint(4) NOT NULL DEFAULT 0,
  `bn_new_win` tinyint(4) NOT NULL DEFAULT 0,
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bn_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_belt_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_belt_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_sub_title` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_brand_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_brand_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_type` varchar(50) NOT NULL DEFAULT '0',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(50) NOT NULL,
  `bn_end_time` varchar(50) NOT NULL,
  `bn_time` varchar(50) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_use` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `pt_id` varchar(100) DEFAULT NULL,
  `bn_it_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_brand_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_brand_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_end_time` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_time` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_brand_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_brand_list_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL,
  `bn_item_idx` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_cart`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_cart` (
  `ct_id` int(11) NOT NULL AUTO_INCREMENT,
  `od_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_sc_type` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_method` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `ct_status` varchar(255) NOT NULL DEFAULT '' COMMENT '주문,입금,준비,배송,완료,반품,취소,취소요청',
  `ct_cancel_status` varchar(1) DEFAULT NULL COMMENT '1:취소요청,2:취소승인,3:취소반려',
  `ct_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `exchange_ct_id` varchar(50) DEFAULT NULL,
  `exchange_it_id` varchar(50) DEFAULT NULL,
  `exchange_it_name` varchar(255) DEFAULT NULL,
  `exchange_ct_option` varchar(255) DEFAULT NULL,
  `ct_price` int(11) NOT NULL DEFAULT 0,
  `ct_point` int(11) NOT NULL DEFAULT 0,
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `ct_point_use` varchar(3) NOT NULL DEFAULT '0',
  `ct_stock_use` varchar(3) NOT NULL DEFAULT '0',
  `ct_option` varchar(255) DEFAULT '',
  `ct_qty` int(11) NOT NULL DEFAULT 0,
  `ct_notax` varchar(3) NOT NULL DEFAULT '0',
  `io_id` varchar(255) DEFAULT '',
  `io_type` varchar(3) NOT NULL DEFAULT '0',
  `io_price` int(11) NOT NULL DEFAULT 0,
  `ct_time` varchar(20) DEFAULT NULL,
  `ct_ip` varchar(25) DEFAULT '',
  `ct_send_cost` varchar(10) DEFAULT '0',
  `ct_direct` varchar(3) NOT NULL DEFAULT '0',
  `ct_select` varchar(3) NOT NULL DEFAULT '0',
  `ct_select_time` varchar(40) DEFAULT NULL,
  `ct_confirm_date` varchar(20) DEFAULT NULL COMMENT '구매확정일',
  `pt_sale` int(11) NOT NULL DEFAULT 0,
  `pt_commission` int(11) NOT NULL DEFAULT 0,
  `pt_point` int(11) NOT NULL DEFAULT 0,
  `pt_incentive` int(11) NOT NULL DEFAULT 0,
  `pt_net` int(11) NOT NULL DEFAULT 0,
  `pt_commission_rate` varchar(3) NOT NULL DEFAULT '0',
  `pt_incentive_rate` varchar(3) NOT NULL DEFAULT '0',
  `pt_it` varchar(3) NOT NULL DEFAULT '1',
  `pt_id` varchar(255) DEFAULT '',
  `pt_send` varchar(255) DEFAULT '',
  `pt_send_num` varchar(255) DEFAULT '',
  `pt_datetime` varchar(20) DEFAULT NULL,
  `pt_msg1` varchar(255) DEFAULT '',
  `pt_msg2` varchar(255) DEFAULT '',
  `pt_msg3` varchar(255) DEFAULT '',
  `mk_id` varchar(255) DEFAULT '',
  `mk_profit` int(11) NOT NULL DEFAULT 0,
  `mk_benefit` int(11) NOT NULL DEFAULT 0,
  `mk_profit_rate` int(11) NOT NULL DEFAULT 0,
  `mk_benefit_rate` int(11) NOT NULL DEFAULT 0,
  `ct_seq` int(11) NOT NULL DEFAULT 1,
  `od_invoice` varchar(255) DEFAULT NULL,
  `od_delivery_company` varchar(100) DEFAULT NULL,
  `od_delivery_company_money` varchar(100) DEFAULT NULL,
  `od_delivery_company2` varchar(100) DEFAULT NULL,
  `od_delivery_company_money2` varchar(100) DEFAULT NULL,
  `od_invoice_time` varchar(20) DEFAULT NULL,
  `it_use_check` varchar(3) NOT NULL DEFAULT '0',
  `celeb_id` varchar(255) NOT NULL DEFAULT '',
  `cType` varchar(2) DEFAULT '',
  `dCompany` varchar(100) DEFAULT '',
  `address_kakao` varchar(255) DEFAULT '',
  `address_detail` varchar(255) DEFAULT '',
  `cancel_type` varchar(2) DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `order_cancel_date` varchar(20) DEFAULT NULL COMMENT '취소요청일자',
  `order_cancel_approve_date` varchar(20) DEFAULT NULL COMMENT '취소승인일자',
  `order_cancel_out_date` varchar(20) DEFAULT NULL COMMENT '취소반려일자',
  `order_refund_date` varchar(20) DEFAULT NULL,
  `order_refund_approve_date` varchar(20) DEFAULT NULL COMMENT '환불승인일자',
  `order_refund_kind` varchar(20) DEFAULT NULL COMMENT '환불신청사유',
  `order_refund_reason` varchar(255) DEFAULT NULL COMMENT '환불신청사유 직접입력',
  `order_refund_changed_price` varchar(20) DEFAULT NULL COMMENT '변경된 환불금액',
  `order_refund_changed_price_reason` varchar(255) DEFAULT NULL COMMENT '변경된 환불금액 사유',
  `order_refund_account` varchar(100) DEFAULT NULL COMMENT '환불대상계좌(환불수단|은행|계좌번호|예금주|사유)',
  `order_exchange_date` varchar(20) DEFAULT NULL COMMENT '교환신청일자',
  `order_exchange_approve_date` varchar(20) DEFAULT NULL COMMENT '교환승인일자',
  `order_exchange_item_io_no` int(11) DEFAULT NULL,
  `order_exchange_item_io_id` varchar(255) DEFAULT NULL,
  `order_exchange_item_option` varchar(20) DEFAULT NULL COMMENT '교환 옵션',
  `order_exchange_kind` varchar(20) DEFAULT NULL COMMENT '교환신청사유',
  `order_exchange_reason` varchar(255) DEFAULT NULL COMMENT '교환신청사유 직접입력',
  `order_exchange_complete_expected_time` varchar(20) DEFAULT NULL COMMENT '교환완료 예상일자',
  `order_exchange_delivery_money_kind` varchar(50) DEFAULT NULL COMMENT '교환배송비 지불형태',
  `order_exchange_delivery_money` int(11) DEFAULT NULL COMMENT '교환배송비 금액',
  `order_exchange_delivery_money_in` int(11) DEFAULT NULL COMMENT '교환배송비 금액(동봉)',
  `order_exchange_delivery_memo` varchar(255) DEFAULT NULL COMMENT '교환 메모',
  `order_return_flag` varchar(3) DEFAULT NULL COMMENT '1:반품/환불,2:교환',
  `order_return_status` varchar(3) DEFAULT NULL COMMENT '상태(1:신청, 2;승인)',
  `order_return_way` varchar(1) DEFAULT NULL COMMENT '반품물품 수거방법',
  `order_return_date` varchar(20) DEFAULT NULL COMMENT '반품신청일자',
  `order_return_approve_date` varchar(20) DEFAULT NULL COMMENT '반품승인일자',
  `order_return_kind` varchar(20) DEFAULT NULL COMMENT '반품신청사유',
  `order_return_reason` varchar(255) DEFAULT NULL COMMENT '반품 신청사유 직접입력',
  `order_return_complete_expected_time` varchar(20) DEFAULT NULL COMMENT '반품완료 예상일자',
  `order_return_post` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 주소 우편번호',
  `order_return_address1` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 주소1',
  `order_return_address2` varchar(50) DEFAULT NULL COMMENT '반품 물품 수거 주소2',
  `order_return_address3` varchar(50) DEFAULT NULL COMMENT '반품 물품 수거 주소3',
  `order_return_invoice` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 송장번호',
  `order_return_delivery_company` varchar(100) DEFAULT NULL,
  `order_return_delivery_money` varchar(100) DEFAULT NULL,
  `ct_memo` varchar(255) DEFAULT NULL,
  `change_flag` int(11) DEFAULT 0,
  `return_flag` int(11) DEFAULT 0,
  `change_refer_ct_id` int(11) DEFAULT 0,
  `change_refer_parent_ct_id` int(11) DEFAULT 0,
  `change_refer_flag` varchar(1) DEFAULT 'N',
  `returnYN` varchar(5) DEFAULT 'N',
  `ProductOrderID` varchar(20) NOT NULL DEFAULT '',
  `ClaimType` varchar(30) NOT NULL DEFAULT '',
  `ClaimStatus` varchar(30) NOT NULL DEFAULT '',
  `PlaceOrderStatus` varchar(30) NOT NULL DEFAULT '',
  `DelayedDispatchReason` varchar(30) NOT NULL DEFAULT '',
  `od_naver_orderid` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`ct_id`),
  KEY `od_id` (`od_id`),
  KEY `it_id` (`it_id`),
  KEY `ct_status` (`ct_status`),
  KEY `ProductOrderID` (`ProductOrderID`)
) ENGINE=MyISAM AUTO_INCREMENT=246 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_cart_change`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_cart_change` (
  `ct_id` int(11) NOT NULL AUTO_INCREMENT,
  `od_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_sc_type` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_method` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `ct_status` varchar(255) NOT NULL DEFAULT '' COMMENT '주문,입금,준비,배송,완료,반품,취소,취소요청',
  `ct_cancel_status` varchar(1) DEFAULT NULL COMMENT '1:취소요청,2:취소승인,3:취소반려',
  `ct_history` text NOT NULL,
  `exchange_ct_id` varchar(50) NOT NULL,
  `exchange_it_id` varchar(50) NOT NULL,
  `exchange_it_name` varchar(255) NOT NULL,
  `exchange_ct_option` varchar(255) NOT NULL,
  `ct_price` int(11) NOT NULL DEFAULT 0,
  `ct_point` int(11) NOT NULL DEFAULT 0,
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `ct_point_use` varchar(3) NOT NULL DEFAULT '0',
  `ct_stock_use` varchar(3) NOT NULL DEFAULT '0',
  `ct_option` varchar(255) NOT NULL DEFAULT '',
  `ct_qty` int(11) NOT NULL DEFAULT 0,
  `ct_notax` varchar(3) NOT NULL DEFAULT '0',
  `io_id` varchar(255) NOT NULL DEFAULT '',
  `io_type` varchar(3) NOT NULL DEFAULT '0',
  `io_price` int(11) NOT NULL DEFAULT 0,
  `ct_time` varchar(20) DEFAULT NULL,
  `ct_ip` varchar(25) NOT NULL DEFAULT '',
  `ct_send_cost` varchar(3) NOT NULL DEFAULT '0',
  `ct_direct` varchar(3) NOT NULL DEFAULT '0',
  `ct_select` varchar(3) NOT NULL DEFAULT '0',
  `ct_select_time` varchar(40) DEFAULT NULL,
  `ct_confirm_date` varchar(20) DEFAULT NULL COMMENT '구매확정일',
  `pt_sale` int(11) NOT NULL DEFAULT 0,
  `pt_commission` int(11) NOT NULL DEFAULT 0,
  `pt_point` int(11) NOT NULL DEFAULT 0,
  `pt_incentive` int(11) NOT NULL DEFAULT 0,
  `pt_net` int(11) NOT NULL DEFAULT 0,
  `pt_commission_rate` varchar(3) NOT NULL DEFAULT '0',
  `pt_incentive_rate` varchar(3) NOT NULL DEFAULT '0',
  `pt_it` varchar(3) NOT NULL DEFAULT '1',
  `pt_id` varchar(255) NOT NULL DEFAULT '',
  `pt_send` varchar(255) NOT NULL DEFAULT '',
  `pt_send_num` varchar(255) NOT NULL DEFAULT '',
  `pt_datetime` varchar(20) DEFAULT NULL,
  `pt_msg1` varchar(255) NOT NULL DEFAULT '',
  `pt_msg2` varchar(255) NOT NULL DEFAULT '',
  `pt_msg3` varchar(255) NOT NULL DEFAULT '',
  `mk_id` varchar(255) NOT NULL DEFAULT '',
  `mk_profit` int(11) NOT NULL DEFAULT 0,
  `mk_benefit` int(11) NOT NULL DEFAULT 0,
  `mk_profit_rate` int(11) NOT NULL DEFAULT 0,
  `mk_benefit_rate` int(11) NOT NULL DEFAULT 0,
  `ct_seq` int(11) NOT NULL DEFAULT 1,
  `od_invoice` varchar(255) NOT NULL,
  `od_delivery_company` varchar(100) DEFAULT NULL,
  `od_delivery_company_money` varchar(100) DEFAULT NULL,
  `od_delivery_company2` varchar(100) DEFAULT NULL,
  `od_delivery_company_money2` varchar(100) DEFAULT NULL,
  `od_invoice_time` varchar(255) NOT NULL,
  `it_use_check` varchar(3) NOT NULL DEFAULT '0',
  `celeb_id` varchar(255) NOT NULL DEFAULT '',
  `cType` varchar(2) DEFAULT '',
  `dCompany` varchar(100) DEFAULT '',
  `address_kakao` varchar(255) DEFAULT '',
  `address_detail` varchar(255) DEFAULT '',
  `cancel_type` varchar(2) DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `order_cancel_date` varchar(20) DEFAULT NULL COMMENT '취소요청일자',
  `order_cancel_approve_date` varchar(20) DEFAULT NULL COMMENT '취소승인일자',
  `order_cancel_out_date` varchar(20) DEFAULT NULL COMMENT '취소반려일자',
  `order_refund_date` varchar(20) DEFAULT NULL,
  `order_refund_approve_date` varchar(20) DEFAULT NULL COMMENT '환불승인일자',
  `order_refund_kind` varchar(20) DEFAULT NULL COMMENT '환불신청사유',
  `order_refund_reason` varchar(255) DEFAULT NULL COMMENT '환불신청사유 직접입력',
  `order_refund_changed_price` varchar(20) DEFAULT NULL COMMENT '변경된 환불금액',
  `order_refund_changed_price_reason` varchar(255) DEFAULT NULL COMMENT '변경된 환불금액 사유',
  `order_refund_account` varchar(100) DEFAULT NULL COMMENT '환불대상계좌(환불수단|은행|계좌번호|예금주|사유)',
  `order_exchange_date` varchar(20) DEFAULT NULL COMMENT '교환신청일자',
  `order_exchange_approve_date` varchar(20) DEFAULT NULL COMMENT '교환승인일자',
  `order_exchange_item_io_no` int(11) DEFAULT NULL,
  `order_exchange_item_io_id` varchar(255) DEFAULT NULL,
  `order_exchange_item_option` varchar(20) DEFAULT NULL COMMENT '교환 옵션',
  `order_exchange_kind` varchar(20) DEFAULT NULL COMMENT '교환신청사유',
  `order_exchange_reason` varchar(255) DEFAULT NULL COMMENT '교환신청사유 직접입력',
  `order_exchange_complete_expected_time` varchar(20) DEFAULT NULL COMMENT '교환완료 예상일자',
  `order_exchange_delivery_money_kind` varchar(50) DEFAULT NULL COMMENT '교환배송비 지불형태',
  `order_exchange_delivery_money` int(11) DEFAULT NULL COMMENT '교환배송비 금액',
  `order_exchange_delivery_money_in` int(11) DEFAULT NULL COMMENT '교환배송비 금액(동봉)',
  `order_exchange_deliver_memo` varchar(255) DEFAULT NULL COMMENT '교환 메모',
  `order_return_flag` varchar(1) DEFAULT NULL COMMENT '1:반품/환불,2:교환',
  `order_return_status` varchar(1) DEFAULT NULL COMMENT '상태(1:신청, 2;승인)',
  `order_return_way` varchar(1) DEFAULT NULL COMMENT '반품물품 수거방법',
  `order_return_date` varchar(20) DEFAULT NULL COMMENT '반품신청일자',
  `order_return_approve_date` varchar(20) DEFAULT NULL COMMENT '반품승인일자',
  `order_return_kind` varchar(20) DEFAULT NULL COMMENT '반품신청사유',
  `order_return_reason` varchar(255) DEFAULT NULL COMMENT '반품 신청사유 직접입력',
  `order_return_complete_expected_time` varchar(20) DEFAULT NULL COMMENT '반품완료 예상일자',
  `order_return_post` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 주소 우편번호',
  `order_return_address1` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 주소1',
  `order_return_address2` varchar(50) DEFAULT NULL COMMENT '반품 물품 수거 주소2',
  `order_return_address3` varchar(50) DEFAULT NULL COMMENT '반품 물품 수거 주소3',
  `order_return_invoice` varchar(255) DEFAULT NULL COMMENT '반품 물품 수거 송장번호',
  `order_return_delivery_company` varchar(100) DEFAULT NULL,
  `order_return_delivery_money` varchar(100) DEFAULT NULL,
  `ct_memo` varchar(255) DEFAULT NULL,
  `change_flag` int(11) DEFAULT 0,
  `return_flag` int(11) DEFAULT 0,
  `change_refer_ct_id` int(11) DEFAULT 0,
  PRIMARY KEY (`ct_id`) USING BTREE,
  KEY `od_id` (`od_id`) USING BTREE,
  KEY `it_id` (`it_id`) USING BTREE,
  KEY `ct_status` (`ct_status`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_cart_refund_method_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_cart_refund_method_log` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `od_id` varchar(50) NOT NULL DEFAULT '0',
  `ct_seq` int(11) NOT NULL DEFAULT 0,
  `refund_method` varchar(50) NOT NULL DEFAULT '0',
  `bank_name` varchar(50) NOT NULL,
  `bank_account` varchar(50) NOT NULL,
  `bank_holder` varchar(50) NOT NULL,
  `method_reason` varchar(255) NOT NULL,
  `reg_date` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`log_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_cart_refund_price_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_cart_refund_price_log` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `od_id` varchar(50) NOT NULL DEFAULT '0',
  `ct_seq` int(11) NOT NULL DEFAULT 0,
  `log_price` int(11) NOT NULL DEFAULT 0,
  `log_price_reason` varchar(255) NOT NULL,
  `reg_date` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`log_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_cart_vacoin`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_cart_vacoin` (
  `ct_id` int(11) NOT NULL,
  `cc_idx` int(11) NOT NULL,
  `ins_date` varchar(20) NOT NULL,
  PRIMARY KEY (`ct_id`,`cc_idx`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_category` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `filter1` int(11) NOT NULL DEFAULT 0,
  `filter2` int(11) NOT NULL DEFAULT 1,
  `ca_id` varchar(50) NOT NULL DEFAULT '0',
  `ca_name` varchar(255) NOT NULL DEFAULT '',
  `ca_order` int(11) NOT NULL DEFAULT 0,
  `ca_skin_dir` varchar(255) NOT NULL DEFAULT '',
  `ca_mobile_skin_dir` varchar(255) NOT NULL DEFAULT '',
  `ca_skin` varchar(255) NOT NULL DEFAULT '',
  `ca_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `ca_img_width` int(11) NOT NULL DEFAULT 0,
  `ca_img_height` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_img_width` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_img_height` int(11) NOT NULL DEFAULT 0,
  `ca_sell_email` varchar(255) NOT NULL DEFAULT '',
  `ca_use` varchar(3) NOT NULL DEFAULT '0',
  `ca_stock_qty` int(11) NOT NULL DEFAULT 0,
  `ca_explan_html` varchar(3) NOT NULL DEFAULT '0',
  `ca_head_html` text DEFAULT NULL,
  `ca_tail_html` text DEFAULT NULL,
  `ca_mobile_head_html` text DEFAULT NULL,
  `ca_mobile_tail_html` text DEFAULT NULL,
  `ca_list_mod` int(11) NOT NULL DEFAULT 0,
  `ca_list_row` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_list_mod` int(11) NOT NULL DEFAULT 0,
  `ca_mobile_list_row` int(11) NOT NULL DEFAULT 0,
  `ca_include_head` varchar(255) NOT NULL DEFAULT '',
  `ca_include_tail` varchar(255) NOT NULL DEFAULT '',
  `ca_mb_id` varchar(255) NOT NULL DEFAULT '',
  `ca_cert_use` varchar(3) NOT NULL DEFAULT '0',
  `ca_adult_use` varchar(3) NOT NULL DEFAULT '0',
  `ca_nocoupon` varchar(3) NOT NULL DEFAULT '0',
  `ca_exhibit` varchar(50) NOT NULL DEFAULT '' COMMENT 'auto,manual',
  `ca_exhibit_detail` varchar(50) NOT NULL DEFAULT '' COMMENT 'auto일 경우 정렬순서',
  `ca_1_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_2_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_3_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_4_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_5_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_6_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_7_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_8_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_9_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_10_subj` varchar(255) NOT NULL DEFAULT '',
  `ca_1` varchar(255) NOT NULL DEFAULT '',
  `ca_2` varchar(255) NOT NULL DEFAULT '',
  `ca_3` varchar(255) NOT NULL DEFAULT '',
  `ca_4` varchar(255) NOT NULL DEFAULT '',
  `ca_5` varchar(255) NOT NULL DEFAULT '',
  `ca_6` varchar(255) NOT NULL DEFAULT '',
  `ca_7` varchar(255) NOT NULL DEFAULT '',
  `ca_8` varchar(255) NOT NULL DEFAULT '',
  `ca_9` varchar(255) NOT NULL DEFAULT '',
  `ca_10` varchar(255) NOT NULL DEFAULT '',
  `ca_datetime` varchar(20) DEFAULT NULL,
  `ca_update_time` varchar(20) DEFAULT NULL,
  `as_thema` varchar(255) NOT NULL DEFAULT '',
  `as_color` varchar(255) NOT NULL DEFAULT '',
  `as_mobile_thema` varchar(255) NOT NULL DEFAULT '',
  `as_mobile_color` varchar(255) NOT NULL DEFAULT '',
  `as_icon` varchar(255) NOT NULL DEFAULT '',
  `as_mobile_icon` varchar(255) NOT NULL DEFAULT '',
  `as_main` varchar(255) NOT NULL DEFAULT '',
  `as_title` varchar(255) NOT NULL DEFAULT '',
  `as_desc` varchar(255) NOT NULL DEFAULT '',
  `as_link` varchar(255) NOT NULL DEFAULT '',
  `as_target` varchar(255) NOT NULL DEFAULT '',
  `as_line` varchar(255) NOT NULL DEFAULT '',
  `as_sp` varchar(3) NOT NULL DEFAULT '0',
  `as_show` varchar(3) NOT NULL DEFAULT '0',
  `as_order` int(11) NOT NULL DEFAULT 0,
  `as_menu` varchar(3) NOT NULL DEFAULT '0',
  `as_menu_show` varchar(3) NOT NULL DEFAULT '0',
  `as_grade` varchar(3) NOT NULL DEFAULT '0',
  `as_equal` varchar(3) NOT NULL DEFAULT '0',
  `as_wide` varchar(3) NOT NULL DEFAULT '0',
  `as_multi` varchar(3) NOT NULL DEFAULT '0',
  `as_partner` varchar(3) NOT NULL DEFAULT '0',
  `as_min` int(11) NOT NULL DEFAULT 0,
  `as_max` int(11) NOT NULL DEFAULT 0,
  `as_list_set` text DEFAULT NULL,
  `as_mobile_list_set` text DEFAULT NULL,
  `as_item_set` text DEFAULT NULL,
  `as_mobile_item_set` text DEFAULT NULL,
  `pt_cate` varchar(255) NOT NULL DEFAULT '',
  `pt_use` varchar(3) NOT NULL DEFAULT '1',
  `pt_limit` varchar(3) NOT NULL DEFAULT '0',
  `pt_item` varchar(3) NOT NULL DEFAULT '0',
  `pt_point` int(11) NOT NULL DEFAULT 0,
  `pt_form` int(11) NOT NULL DEFAULT 1,
  `is_women` varchar(3) NOT NULL DEFAULT '1',
  `is_men` varchar(3) NOT NULL DEFAULT '0',
  `is_designer` varchar(3) NOT NULL DEFAULT '0',
  `is_active` varchar(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ca_id`) USING BTREE,
  KEY `ca_id` (`ca_id`,`ca_name`),
  KEY `bn_id` (`bn_id`),
  KEY `bn_order` (`bn_order`)
) ENGINE=MyISAM AUTO_INCREMENT=623 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_category_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_category_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_category_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_category_list_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL,
  `bn_item_idx` varchar(50) NOT NULL DEFAULT '0',
  `bn_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=2007 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_code_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_code_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) DEFAULT NULL,
  `bn_new_win` varchar(3) DEFAULT NULL,
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_commission`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_commission` (
  `co_id` int(11) NOT NULL AUTO_INCREMENT,
  `co_kind` varchar(1) NOT NULL DEFAULT '',
  `grade1` varchar(2) NOT NULL DEFAULT '',
  `grade2` varchar(2) NOT NULL DEFAULT '',
  `grade3` varchar(2) NOT NULL DEFAULT '',
  `grade4` varchar(2) NOT NULL DEFAULT '',
  `gradeType1` varchar(2) NOT NULL DEFAULT '',
  `gradeType2` varchar(2) NOT NULL DEFAULT '',
  `gradeType3` varchar(2) NOT NULL DEFAULT '',
  `gradeType4` varchar(2) NOT NULL DEFAULT '',
  `cl_datetime` varchar(20) NOT NULL,
  PRIMARY KEY (`co_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_coupon`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_coupon` (
  `cp_no` int(11) NOT NULL AUTO_INCREMENT,
  `cp_id` varchar(100) NOT NULL DEFAULT '',
  `cp_regist` varchar(3) NOT NULL DEFAULT '0',
  `cp_subject` varchar(255) NOT NULL DEFAULT '',
  `cp_method` int(11) NOT NULL DEFAULT 0 COMMENT '0:개별상품,1:카테고리,2:주문금액,4:기획전,5:브랜드',
  `cp_target` varchar(255) NOT NULL DEFAULT '',
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `cz_id` int(11) NOT NULL DEFAULT 0,
  `cp_start` varchar(20) NOT NULL DEFAULT '',
  `cp_end` varchar(20) NOT NULL DEFAULT '',
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `cp_vastyle_rate` int(11) NOT NULL DEFAULT 0,
  `cp_brand_rate` int(11) NOT NULL DEFAULT 0,
  `cp_type` varchar(3) NOT NULL DEFAULT '0',
  `cp_trunc` int(11) NOT NULL DEFAULT 0,
  `cp_minimum` varchar(10) NOT NULL DEFAULT '0',
  `cp_maximum` varchar(10) NOT NULL DEFAULT '0',
  `od_id` bigint(20) unsigned DEFAULT NULL,
  `cp_datetime` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`cp_no`),
  UNIQUE KEY `cp_id` (`cp_id`),
  KEY `mb_id` (`mb_id`),
  KEY `cp_start` (`cp_start`),
  KEY `cp_end` (`cp_end`),
  KEY `cp_method` (`cp_method`),
  KEY `cp_target` (`cp_target`)
) ENGINE=MyISAM AUTO_INCREMENT=250 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_coupon_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_coupon_log` (
  `cl_id` int(11) NOT NULL AUTO_INCREMENT,
  `cp_id` varchar(100) NOT NULL DEFAULT '',
  `mb_id` varchar(100) NOT NULL DEFAULT '',
  `od_id` bigint(20) NOT NULL,
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `cl_datetime` varchar(50) NOT NULL DEFAULT '',
  `ct_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`cl_id`),
  KEY `mb_id` (`mb_id`),
  KEY `od_id` (`od_id`)
) ENGINE=MyISAM AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_coupon_regist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_coupon_regist` (
  `cr_id` int(11) NOT NULL AUTO_INCREMENT,
  `cp_id` varchar(255) NOT NULL DEFAULT '' COMMENT '쿠폰아이디',
  `mb_id` varchar(255) NOT NULL DEFAULT '' COMMENT '등록한 회원아이디',
  `cr_datetime` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`cr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='회원등록쿠폰 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_coupon_zone`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_coupon_zone` (
  `cz_id` int(11) NOT NULL AUTO_INCREMENT,
  `cz_type` tinyint(4) NOT NULL DEFAULT 0,
  `cz_subject` varchar(255) NOT NULL DEFAULT '',
  `cz_start` varchar(20) NOT NULL DEFAULT '',
  `cz_end` varchar(20) NOT NULL DEFAULT '',
  `cz_file` varchar(255) NOT NULL DEFAULT '',
  `cz_period` int(11) NOT NULL DEFAULT 0,
  `cz_point` varchar(10) DEFAULT '0',
  `cp_method` int(11) NOT NULL DEFAULT 0,
  `cp_target` varchar(255) NOT NULL DEFAULT '',
  `cp_price` int(11) NOT NULL DEFAULT 0,
  `cp_vastyle_rate` int(11) NOT NULL DEFAULT 0,
  `cp_brand_rate` int(11) NOT NULL DEFAULT 0,
  `cp_type` int(11) NOT NULL DEFAULT 0,
  `cp_trunc` int(11) NOT NULL DEFAULT 0,
  `cp_minimum` varchar(10) DEFAULT '0',
  `cp_maximum` varchar(10) DEFAULT '0',
  `cz_download` int(11) NOT NULL DEFAULT 0,
  `cz_link` varchar(50) DEFAULT '0',
  `cz_datetime` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`cz_id`)
) ENGINE=MyISAM AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_default`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_default` (
  `de_admin_company_owner` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_name` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_saupja_no` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_tel` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_fax` varchar(255) NOT NULL DEFAULT '',
  `de_admin_tongsin_no` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_zip` varchar(255) NOT NULL DEFAULT '',
  `de_admin_company_addr` varchar(255) NOT NULL DEFAULT '',
  `de_admin_info_name` varchar(255) NOT NULL DEFAULT '',
  `de_admin_info_email` varchar(255) NOT NULL DEFAULT '',
  `de_root_index_use` varchar(3) NOT NULL DEFAULT '0',
  `de_shop_skin` varchar(255) NOT NULL DEFAULT '',
  `de_shop_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type1_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_type1_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type1_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type1_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type1_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type1_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type2_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_type2_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type2_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type2_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type2_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type2_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type3_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_type3_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type3_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type3_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type3_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type3_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type4_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_type4_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type4_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type4_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type4_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type4_img_height` int(11) NOT NULL DEFAULT 0,
  `de_type5_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_type5_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_type5_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_type5_list_row` int(11) NOT NULL DEFAULT 0,
  `de_type5_img_width` int(11) NOT NULL DEFAULT 0,
  `de_type5_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_mobile_type1_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type1_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type1_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_mobile_type2_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type2_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type2_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_mobile_type3_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type3_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type3_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_mobile_type4_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type4_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type4_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_mobile_type5_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_type5_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_type5_img_height` int(11) NOT NULL DEFAULT 0,
  `de_rel_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_rel_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_rel_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_rel_img_width` int(11) NOT NULL DEFAULT 0,
  `de_rel_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_rel_list_use` varchar(3) NOT NULL DEFAULT '0',
  `de_mobile_rel_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_rel_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_rel_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_rel_img_height` int(11) NOT NULL DEFAULT 0,
  `de_search_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_search_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_search_list_row` int(11) NOT NULL DEFAULT 0,
  `de_search_img_width` int(11) NOT NULL DEFAULT 0,
  `de_search_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_search_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_search_img_height` int(11) NOT NULL DEFAULT 0,
  `de_listtype_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_listtype_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_listtype_list_row` int(11) NOT NULL DEFAULT 0,
  `de_listtype_img_width` int(11) NOT NULL DEFAULT 0,
  `de_listtype_img_height` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_list_skin` varchar(255) NOT NULL DEFAULT '',
  `de_mobile_listtype_list_mod` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_list_row` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_img_width` int(11) NOT NULL DEFAULT 0,
  `de_mobile_listtype_img_height` int(11) NOT NULL DEFAULT 0,
  `de_bank_use` int(11) NOT NULL DEFAULT 0,
  `de_bank_account` text NOT NULL,
  `de_card_test` int(11) NOT NULL DEFAULT 0,
  `de_card_use` int(11) NOT NULL DEFAULT 0,
  `de_card_noint_use` varchar(3) NOT NULL DEFAULT '0',
  `de_card_point` int(11) NOT NULL DEFAULT 0,
  `de_settle_min_point` int(11) NOT NULL DEFAULT 0,
  `de_settle_max_point` int(11) NOT NULL DEFAULT 0,
  `de_settle_point_unit` int(11) NOT NULL DEFAULT 0,
  `de_level_sell` int(11) NOT NULL DEFAULT 0,
  `de_delivery_company` varchar(255) NOT NULL DEFAULT '',
  `de_send_cost_case` varchar(255) NOT NULL DEFAULT '',
  `de_send_cost_limit` varchar(255) NOT NULL DEFAULT '',
  `de_send_cost_list` varchar(255) NOT NULL DEFAULT '',
  `de_hope_date_use` int(11) NOT NULL DEFAULT 0,
  `de_hope_date_after` int(11) NOT NULL DEFAULT 0,
  `de_baesong_content` text NOT NULL,
  `de_change_content` text NOT NULL,
  `de_point_days` int(11) NOT NULL DEFAULT 0,
  `de_simg_width` int(11) NOT NULL DEFAULT 0,
  `de_simg_height` int(11) NOT NULL DEFAULT 0,
  `de_mimg_width` int(11) NOT NULL DEFAULT 0,
  `de_mimg_height` int(11) NOT NULL DEFAULT 0,
  `de_sms_cont1` text NOT NULL,
  `de_sms_cont2` text NOT NULL,
  `de_sms_cont3` text NOT NULL,
  `de_sms_cont4` text NOT NULL,
  `de_sms_cont5` text NOT NULL,
  `de_sms_use1` varchar(3) NOT NULL DEFAULT '0',
  `de_sms_use2` varchar(3) NOT NULL DEFAULT '0',
  `de_sms_use3` varchar(3) NOT NULL DEFAULT '0',
  `de_sms_use4` varchar(3) NOT NULL DEFAULT '0',
  `de_sms_use5` varchar(3) NOT NULL DEFAULT '0',
  `de_sms_hp` varchar(255) NOT NULL DEFAULT '',
  `de_pg_service` varchar(255) NOT NULL DEFAULT '',
  `de_kcp_mid` varchar(255) NOT NULL DEFAULT '',
  `de_kcp_site_key` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_mid` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_admin_key` varchar(255) NOT NULL DEFAULT '',
  `de_inicis_sign_key` varchar(255) NOT NULL DEFAULT '',
  `de_iche_use` varchar(3) NOT NULL DEFAULT '0',
  `de_easy_pay_use` varchar(3) NOT NULL DEFAULT '0',
  `de_easy_pay_services` varchar(255) NOT NULL DEFAULT '',
  `de_samsung_pay_use` varchar(3) NOT NULL DEFAULT '0',
  `de_inicis_lpay_use` varchar(3) NOT NULL DEFAULT '0',
  `de_inicis_kakaopay_use` varchar(3) NOT NULL DEFAULT '0',
  `de_inicis_cartpoint_use` varchar(3) NOT NULL DEFAULT '0',
  `de_item_use_use` varchar(3) NOT NULL DEFAULT '0',
  `de_item_use_write` varchar(3) NOT NULL DEFAULT '0',
  `de_code_dup_use` varchar(3) NOT NULL DEFAULT '0',
  `de_cart_keep_term` int(11) NOT NULL DEFAULT 0,
  `de_guest_cart_use` varchar(3) NOT NULL DEFAULT '0',
  `de_admin_buga_no` varchar(255) NOT NULL DEFAULT '',
  `de_vbank_use` varchar(255) NOT NULL DEFAULT '',
  `de_taxsave_use` varchar(3) NOT NULL DEFAULT '',
  `de_taxsave_types` set('account','vbank','transfer') NOT NULL DEFAULT 'account',
  `de_guest_privacy` text NOT NULL,
  `de_hp_use` varchar(3) NOT NULL DEFAULT '0',
  `de_escrow_use` varchar(3) NOT NULL DEFAULT '0',
  `de_tax_flag_use` varchar(3) NOT NULL DEFAULT '0',
  `de_kakaopay_mid` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_key` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_enckey` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_hashkey` varchar(255) NOT NULL DEFAULT '',
  `de_kakaopay_cancelpwd` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_mid` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_cert_key` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_button_key` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_test` varchar(3) NOT NULL DEFAULT '0',
  `de_naverpay_mb_id` varchar(255) NOT NULL DEFAULT '',
  `de_naverpay_sendcost` varchar(255) NOT NULL DEFAULT '',
  `de_member_reg_coupon_use` varchar(3) NOT NULL DEFAULT '0',
  `de_member_reg_coupon_term` int(11) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_price` int(11) NOT NULL DEFAULT 0,
  `de_member_reg_coupon_minimum` int(11) NOT NULL DEFAULT 0,
  `as_thema` varchar(255) NOT NULL DEFAULT 'Basic',
  `as_color` varchar(255) NOT NULL DEFAULT 'Basic',
  `as_mobile_thema` varchar(255) NOT NULL DEFAULT 'Basic',
  `as_mobile_color` varchar(255) NOT NULL DEFAULT 'Basic',
  `as_intro` varchar(255) NOT NULL DEFAULT '',
  `as_intro_skin` varchar(255) NOT NULL DEFAULT '',
  `as_mobile_intro_skin` varchar(255) NOT NULL DEFAULT '',
  `as_partner` varchar(3) NOT NULL DEFAULT '0',
  `as_point` varchar(3) NOT NULL DEFAULT '0',
  `pt_shingo` varchar(3) NOT NULL DEFAULT '0',
  `pt_lucky` varchar(3) NOT NULL DEFAULT '0',
  `pt_code` varchar(3) NOT NULL DEFAULT '0',
  `pt_auto` varchar(3) NOT NULL DEFAULT '10',
  `pt_auto_cache` varchar(3) NOT NULL DEFAULT '0',
  `pt_auto_time` int(11) NOT NULL DEFAULT 10,
  `pt_good_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_good_point` int(11) NOT NULL DEFAULT 0,
  `pt_review_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_comment_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_comment_sns` varchar(3) NOT NULL DEFAULT '0',
  `pt_comment_point` int(11) NOT NULL DEFAULT 0,
  `pt_comment_limit` int(11) NOT NULL DEFAULT 0,
  `pt_reserve` int(11) NOT NULL DEFAULT 0,
  `pt_reserve_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_reserve_end` int(11) NOT NULL DEFAULT 0,
  `pt_reserve_day` int(11) NOT NULL DEFAULT 0,
  `pt_reserve_cache` int(11) NOT NULL DEFAULT 0,
  `pt_reserve_none` int(11) NOT NULL DEFAULT 24,
  `pt_img_width` int(11) NOT NULL DEFAULT 600,
  `pt_upload_size` int(11) NOT NULL DEFAULT 10485760,
  `de_naverpayorder_AccessLicense` varchar(100) NOT NULL DEFAULT '',
  `de_naverpayorder_SecretKey` varchar(100) NOT NULL DEFAULT '',
  `de_naverpayorder_test` tinyint(4) NOT NULL DEFAULT 0,
  `de_naverpayorder_test_mb_id` varchar(20) NOT NULL DEFAULT ''
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_event`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_event` (
  `ev_id` int(11) NOT NULL AUTO_INCREMENT,
  `ev_skin` varchar(255) NOT NULL DEFAULT '',
  `ev_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `ev_img_width` int(11) NOT NULL DEFAULT 0,
  `ev_img_height` int(11) NOT NULL DEFAULT 0,
  `ev_list_mod` int(11) NOT NULL DEFAULT 0,
  `ev_list_row` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_img_width` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_img_height` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_list_mod` int(11) NOT NULL DEFAULT 0,
  `ev_mobile_list_row` int(11) NOT NULL DEFAULT 0,
  `ev_subject` varchar(255) NOT NULL DEFAULT '',
  `ev_subject_strong` varchar(3) NOT NULL DEFAULT '0',
  `ev_head_html` text NOT NULL,
  `ev_tail_html` text NOT NULL,
  `ev_use` varchar(3) NOT NULL DEFAULT '0',
  `ev_type` int(11) NOT NULL DEFAULT 0,
  `ev_href` varchar(255) NOT NULL DEFAULT '',
  `ev_set` text NOT NULL,
  `ev_mobile_set` text NOT NULL,
  PRIMARY KEY (`ev_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_event_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_event_item` (
  `ev_id` int(11) NOT NULL DEFAULT 0,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`ev_id`,`it_id`),
  KEY `it_id` (`it_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_exhibition_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_exhibition_category` (
  `co_id` int(11) NOT NULL AUTO_INCREMENT,
  `co_html` tinyint(4) NOT NULL DEFAULT 0,
  `co_subject` varchar(255) NOT NULL DEFAULT '',
  `co_content` longtext NOT NULL,
  `co_seo_title` varchar(255) NOT NULL DEFAULT '',
  `co_mobile_content` longtext NOT NULL,
  `co_skin` varchar(255) NOT NULL DEFAULT '',
  `co_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `co_tag_filter_use` varchar(3) NOT NULL DEFAULT '0',
  `co_hit` int(11) NOT NULL DEFAULT 0,
  `co_include_head` varchar(255) NOT NULL,
  `co_include_tail` varchar(255) NOT NULL,
  PRIMARY KEY (`co_id`) USING BTREE,
  KEY `co_seo_title` (`co_seo_title`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_exhibition_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_exhibition_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bcode` int(11) NOT NULL DEFAULT 0 COMMENT '기획전1 :1, 기획전2: 2. 기획전3: 3',
  `bn_category_idx` varchar(10) NOT NULL DEFAULT '0' COMMENT 'va_shop_exhibition_category 의 co_id 값',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_alt2` varchar(255) NOT NULL DEFAULT '',
  `bn_banner` varchar(255) NOT NULL DEFAULT '' COMMENT '기획전 상세페이지의 배너',
  `bn_subject` varchar(255) NOT NULL DEFAULT '',
  `bn_sub_subject` varchar(255) NOT NULL DEFAULT '' COMMENT '부제목',
  `bn_desc` text NOT NULL,
  `bn_desc2` text NOT NULL,
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(50) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(50) NOT NULL DEFAULT '0',
  `bn_status` varchar(50) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(50) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_end_time` varchar(50) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_time` varchar(50) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  `it_img1` varchar(255) DEFAULT NULL,
  `it_img2` varchar(255) DEFAULT NULL,
  `it_img3` varchar(255) DEFAULT NULL,
  `it_img4` varchar(255) DEFAULT NULL,
  `it_img5` varchar(255) DEFAULT NULL,
  `it_img6` varchar(255) DEFAULT NULL,
  `it_img7` varchar(255) DEFAULT NULL,
  `it_img8` varchar(255) DEFAULT NULL,
  `it_img9` varchar(255) DEFAULT NULL,
  `it_img10` varchar(255) DEFAULT NULL,
  `bn_url1` varchar(255) DEFAULT NULL,
  `bn_url2` varchar(255) DEFAULT NULL,
  `bn_url3` varchar(255) DEFAULT NULL,
  `bn_url4` varchar(255) DEFAULT NULL,
  `bn_url5` varchar(255) DEFAULT NULL,
  `bn_url6` varchar(255) DEFAULT NULL,
  `bn_url7` varchar(255) DEFAULT NULL,
  `bn_url8` varchar(255) DEFAULT NULL,
  `bn_url9` varchar(255) DEFAULT NULL,
  `bn_url10` varchar(255) DEFAULT NULL,
  `bn_new_win1` varchar(1) DEFAULT NULL,
  `bn_new_win2` varchar(1) DEFAULT NULL,
  `bn_new_win3` varchar(1) DEFAULT NULL,
  `bn_new_win4` varchar(1) DEFAULT NULL,
  `bn_new_win5` varchar(1) DEFAULT NULL,
  `bn_new_win6` varchar(1) DEFAULT NULL,
  `bn_new_win7` varchar(1) DEFAULT NULL,
  `bn_new_win8` varchar(1) DEFAULT NULL,
  `bn_new_win9` varchar(1) DEFAULT NULL,
  `bn_new_win10` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_exhibition_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_exhibition_list_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL COMMENT 'va_shop_exhibition_list bn_id값',
  `bn_item_idx` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_hot_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_hot_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(10) DEFAULT NULL,
  `bn_new_win` varchar(10) DEFAULT NULL,
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_main` varchar(100) DEFAULT NULL,
  `bn_sub` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_hot_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_hot_list_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL,
  `bn_item_idx` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_inicis_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_inicis_log` (
  `oid` bigint(20) unsigned NOT NULL,
  `P_TID` varchar(255) NOT NULL DEFAULT '',
  `P_MID` varchar(255) NOT NULL DEFAULT '',
  `P_AUTH_DT` varchar(255) NOT NULL DEFAULT '',
  `P_STATUS` varchar(255) NOT NULL DEFAULT '',
  `P_TYPE` varchar(255) NOT NULL DEFAULT '',
  `P_OID` varchar(255) NOT NULL DEFAULT '',
  `P_FN_NM` varchar(255) NOT NULL DEFAULT '',
  `P_AUTH_NO` varchar(255) NOT NULL DEFAULT '',
  `P_AMT` int(11) NOT NULL DEFAULT 0,
  `P_RMESG1` varchar(255) NOT NULL DEFAULT '',
  `post_data` text NOT NULL,
  `is_mail_send` varchar(3) NOT NULL DEFAULT '1',
  PRIMARY KEY (`oid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_batch`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_batch` (
  `idx` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `filter1` int(11) NOT NULL DEFAULT 0 COMMENT 'DESIGNER ',
  `filter2` int(11) NOT NULL DEFAULT 1 COMMENT 'WOMEN 1 , MAN 2',
  `ca_id` varchar(10) NOT NULL DEFAULT '0',
  `ca_id2` varchar(10) NOT NULL DEFAULT '',
  `ca_id3` varchar(10) NOT NULL DEFAULT '',
  `ca_id4` varchar(10) NOT NULL DEFAULT '',
  `ca_id5` varchar(10) NOT NULL DEFAULT '',
  `ca_id6` varchar(10) NOT NULL DEFAULT '',
  `ca_id7` varchar(10) NOT NULL DEFAULT '',
  `ca_id8` varchar(10) NOT NULL DEFAULT '',
  `ca_id9` varchar(10) NOT NULL DEFAULT '',
  `ca_id10` varchar(10) NOT NULL DEFAULT '',
  `it_skin` varchar(255) NOT NULL DEFAULT '',
  `it_mobile_skin` varchar(255) NOT NULL DEFAULT '',
  `it_name` varchar(255) NOT NULL DEFAULT '',
  `it_seo_title` varchar(200) NOT NULL DEFAULT '',
  `it_maker` varchar(255) NOT NULL DEFAULT '',
  `it_origin` varchar(255) NOT NULL DEFAULT '',
  `it_brand` varchar(255) NOT NULL DEFAULT '',
  `it_in` varchar(255) NOT NULL DEFAULT '',
  `it_out` varchar(255) NOT NULL DEFAULT '',
  `it_model` varchar(255) NOT NULL DEFAULT '',
  `it_option_subject` varchar(255) NOT NULL DEFAULT '',
  `it_supply_subject` varchar(255) NOT NULL DEFAULT '',
  `it_type1` varchar(3) NOT NULL DEFAULT '0',
  `it_type2` varchar(3) NOT NULL DEFAULT '0',
  `it_type3` varchar(3) NOT NULL DEFAULT '0',
  `it_type4` varchar(3) NOT NULL DEFAULT '0',
  `it_type5` varchar(3) NOT NULL DEFAULT '0',
  `it_basic` text NOT NULL,
  `it_explan` mediumtext NOT NULL,
  `it_explan2` mediumtext NOT NULL,
  `it_mobile_explan` mediumtext NOT NULL,
  `it_cust_price` int(11) NOT NULL DEFAULT 0,
  `it_price` int(11) NOT NULL DEFAULT 0,
  `it_point` int(11) NOT NULL DEFAULT 0,
  `it_point_type` varchar(3) NOT NULL DEFAULT '0',
  `it_supply_point` int(11) NOT NULL DEFAULT 0,
  `it_notax` varchar(3) NOT NULL DEFAULT '0',
  `it_sell_email` varchar(255) NOT NULL DEFAULT '',
  `it_use` varchar(3) NOT NULL DEFAULT '0' COMMENT '판매가능',
  `it_open` varchar(3) NOT NULL DEFAULT '1' COMMENT '노출여부',
  `it_approve` varchar(3) NOT NULL DEFAULT '1',
  `it_approve_date` varchar(20) NOT NULL DEFAULT '1',
  `it_reject_date` varchar(20) NOT NULL DEFAULT '1',
  `it_reject_reason` varchar(100) NOT NULL,
  `it_reject_type` varchar(20) NOT NULL DEFAULT '1',
  `it_request_date` varchar(20) NOT NULL DEFAULT '1',
  `it_nocoupon` varchar(3) NOT NULL DEFAULT '0',
  `it_soldout` varchar(3) NOT NULL DEFAULT '0',
  `it_stock_qty` int(11) NOT NULL DEFAULT 0,
  `it_stock_sms` varchar(3) NOT NULL DEFAULT '0',
  `it_noti_qty` int(11) NOT NULL DEFAULT 0,
  `it_sc_type` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_method` varchar(3) NOT NULL DEFAULT '0',
  `it_sc_price` int(11) NOT NULL DEFAULT 0,
  `it_sc_minimum` int(11) NOT NULL DEFAULT 0,
  `it_sc_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_min_qty` int(11) NOT NULL DEFAULT 0,
  `it_buy_max_qty` int(11) NOT NULL DEFAULT 0,
  `it_head_html` text NOT NULL,
  `it_tail_html` text NOT NULL,
  `it_mobile_head_html` text NOT NULL,
  `it_mobile_tail_html` text NOT NULL,
  `it_hit` int(11) NOT NULL DEFAULT 0,
  `it_time` varchar(50) DEFAULT NULL,
  `it_update_time` varchar(20) DEFAULT NULL,
  `it_ip` varchar(20) NOT NULL DEFAULT '',
  `it_order` int(11) NOT NULL DEFAULT 0,
  `it_tel_inq` varchar(3) NOT NULL DEFAULT '0',
  `it_tel_inq_no` varchar(50) DEFAULT NULL,
  `it_info_gubun` varchar(50) NOT NULL DEFAULT '',
  `it_info_value` text DEFAULT NULL,
  `it_sum_qty` int(11) NOT NULL DEFAULT 0,
  `it_use_cnt` int(11) NOT NULL DEFAULT 0,
  `it_use_avg` decimal(2,1) DEFAULT NULL,
  `it_shop_memo` text DEFAULT NULL,
  `ec_mall_pid` varchar(255) NOT NULL DEFAULT '',
  `it_img1` varchar(255) NOT NULL DEFAULT '',
  `it_img2` varchar(255) NOT NULL DEFAULT '',
  `it_img3` varchar(255) NOT NULL DEFAULT '',
  `it_img4` varchar(255) NOT NULL DEFAULT '',
  `it_img5` varchar(255) NOT NULL DEFAULT '',
  `it_img6` varchar(255) NOT NULL DEFAULT '',
  `it_img7` varchar(255) NOT NULL DEFAULT '',
  `it_img8` varchar(255) NOT NULL DEFAULT '',
  `it_img9` varchar(255) NOT NULL DEFAULT '',
  `it_img10` varchar(255) NOT NULL DEFAULT '',
  `pt_tag` varchar(255) NOT NULL DEFAULT '',
  `pt_thumb` varchar(255) NOT NULL DEFAULT '',
  `pt_link1` varchar(255) NOT NULL DEFAULT '',
  `pt_link2` varchar(255) NOT NULL DEFAULT '',
  `pt_map` varchar(255) NOT NULL DEFAULT '',
  `pt_id` varchar(255) NOT NULL DEFAULT '',
  `pt_it` varchar(3) NOT NULL DEFAULT '1',
  `pt_ccl` varchar(3) NOT NULL DEFAULT '0',
  `pt_img` varchar(3) NOT NULL DEFAULT '0',
  `pt_file` varchar(3) NOT NULL DEFAULT '0',
  `pt_main` varchar(3) NOT NULL DEFAULT '0',
  `pt_point` varchar(3) NOT NULL DEFAULT '0',
  `pt_order` varchar(3) NOT NULL DEFAULT '0',
  `pt_commission` varchar(3) NOT NULL DEFAULT '0',
  `pt_incentive` varchar(3) NOT NULL DEFAULT '0',
  `pt_marketer` varchar(3) NOT NULL DEFAULT '0',
  `pt_review_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_comment_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_comment` int(11) NOT NULL DEFAULT 0,
  `pt_qa` int(11) NOT NULL DEFAULT 0,
  `pt_good` int(11) NOT NULL DEFAULT 0,
  `pt_nogood` int(11) NOT NULL DEFAULT 0,
  `pt_show` int(11) NOT NULL DEFAULT 0,
  `pt_num` int(11) NOT NULL DEFAULT 0,
  `pt_day` int(11) NOT NULL DEFAULT 0,
  `pt_end` int(11) NOT NULL DEFAULT 0,
  `pt_reserve` int(11) NOT NULL DEFAULT 0,
  `pt_reserve_use` varchar(3) NOT NULL DEFAULT '0',
  `pt_syndi` varchar(3) NOT NULL DEFAULT '0',
  `pt_explan` mediumtext DEFAULT NULL,
  `pt_mobile_explan` mediumtext DEFAULT NULL,
  `pt_msg1` varchar(255) DEFAULT '',
  `pt_msg2` varchar(255) DEFAULT '',
  `pt_msg3` varchar(255) DEFAULT '',
  `styleArr` varchar(255) DEFAULT '',
  `feelArr` varchar(255) DEFAULT '',
  `colorArr` varchar(255) DEFAULT '',
  `pArr` varchar(100) DEFAULT '',
  `barcode` varchar(100) DEFAULT '',
  `siteKeyword` varchar(100) DEFAULT '',
  `itemKind` varchar(100) DEFAULT '',
  `produceYear` varchar(100) DEFAULT '',
  `produceDay` varchar(100) DEFAULT '',
  `season` varchar(100) DEFAULT '',
  `gender` varchar(100) DEFAULT '',
  `enTitle` varchar(100) DEFAULT '',
  `taxKind` varchar(100) DEFAULT '',
  `authNo` varchar(100) DEFAULT '',
  `authStart` varchar(100) DEFAULT '',
  `authEnd` varchar(100) DEFAULT '',
  `createDate` varchar(100) DEFAULT '',
  `authDate` varchar(100) DEFAULT '',
  `authInstitude` varchar(100) DEFAULT '',
  `authField` varchar(100) DEFAULT '',
  `customNo` varchar(100) DEFAULT '',
  `customImg` varchar(100) DEFAULT '',
  `pt_gubun` varchar(100) DEFAULT '0',
  `batch_fail_reason` text DEFAULT NULL,
  `batch_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`it_id`),
  KEY `ca_id` (`ca_id`),
  KEY `idx` (`idx`),
  KEY `it_id` (`it_id`)
) ENGINE=MyISAM AUTO_INCREMENT=263 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_option`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_option` (
  `io_no` int(11) NOT NULL AUTO_INCREMENT,
  `io_id` varchar(255) NOT NULL DEFAULT '0',
  `io_type` varchar(3) NOT NULL DEFAULT '0',
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `io_price` int(11) NOT NULL DEFAULT 0,
  `io_stock_qty` int(11) NOT NULL DEFAULT 0,
  `io_noti_qty` int(11) NOT NULL DEFAULT 0,
  `io_use` varchar(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`io_no`),
  KEY `io_id` (`io_id`),
  KEY `it_id` (`it_id`)
) ENGINE=MyISAM AUTO_INCREMENT=42375 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_option_batch`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_option_batch` (
  `io_no` int(11) NOT NULL AUTO_INCREMENT,
  `io_id` varchar(255) NOT NULL DEFAULT '0',
  `io_type` varchar(50) NOT NULL DEFAULT '0',
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `io_price` int(11) NOT NULL DEFAULT 0,
  `io_stock_qty` int(11) NOT NULL DEFAULT 0,
  `io_noti_qty` int(11) NOT NULL DEFAULT 0,
  `io_use` varchar(3) NOT NULL DEFAULT '0',
  `it_approve` varchar(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`io_no`) USING BTREE,
  KEY `io_id` (`io_id`) USING BTREE,
  KEY `it_id` (`it_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=338 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_qa`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_qa` (
  `iq_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `iq_secret` varchar(50) NOT NULL DEFAULT '0',
  `iq_name` varchar(255) NOT NULL DEFAULT '',
  `iq_email` varchar(255) NOT NULL DEFAULT '',
  `iq_hp` varchar(255) NOT NULL DEFAULT '',
  `iq_password` varchar(255) NOT NULL DEFAULT '',
  `iq_subject` varchar(255) NOT NULL DEFAULT '',
  `iq_question` text DEFAULT NULL,
  `iq_answer` text DEFAULT NULL,
  `iq_answer_time` varchar(50) DEFAULT '',
  `iq_time` varchar(20) DEFAULT NULL,
  `iq_ip` varchar(25) DEFAULT '',
  `pt_it` varchar(50) NOT NULL DEFAULT '1',
  `pt_id` varchar(255) DEFAULT '',
  `pt_group_id` varchar(20) DEFAULT NULL,
  `qa_gubun` int(11) DEFAULT 1 COMMENT '1 => 일반QA, 2 => 1:1이관문의브랜드',
  `qa_id` int(11) DEFAULT NULL,
  `iq_inquiryid` varchar(20) NOT NULL DEFAULT '',
  `iq_answercontentid` varchar(20) NOT NULL DEFAULT '',
  `iq_productorderid` varchar(20) NOT NULL DEFAULT '',
  `iq_orderid` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`iq_id`)
) ENGINE=MyISAM AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_relation`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_relation` (
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `it_id2` varchar(20) NOT NULL DEFAULT '',
  `ir_no` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`it_id`,`it_id2`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_stocksms`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_stocksms` (
  `ss_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '',
  `ss_hp` varchar(255) NOT NULL DEFAULT '',
  `ss_send` tinyint(4) NOT NULL DEFAULT 0,
  `ss_send_time` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ss_datetime` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ss_ip` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`ss_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_use`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_use` (
  `is_id` int(11) NOT NULL AUTO_INCREMENT,
  `it_id` varchar(20) NOT NULL DEFAULT '0',
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `is_name` varchar(255) NOT NULL DEFAULT '',
  `is_password` varchar(255) NOT NULL DEFAULT '',
  `is_score` varchar(3) NOT NULL DEFAULT '0',
  `is_subject` varchar(255) NOT NULL DEFAULT '',
  `is_content` text NOT NULL,
  `is_img1` text DEFAULT NULL,
  `is_img2` text DEFAULT NULL,
  `is_img3` text DEFAULT NULL,
  `is_img4` text DEFAULT NULL,
  `is_img5` text DEFAULT NULL,
  `is_time` varchar(50) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_ip` varchar(25) NOT NULL DEFAULT '',
  `is_confirm` varchar(3) NOT NULL DEFAULT '0',
  `is_reply_subject` varchar(255) DEFAULT '',
  `is_reply_content` text DEFAULT NULL,
  `is_reply_name` varchar(25) DEFAULT '',
  `pt_it` varchar(3) NOT NULL DEFAULT '1',
  `pt_photo` varchar(3) NOT NULL DEFAULT '0',
  `pt_id` varchar(255) NOT NULL DEFAULT '',
  `ct_id` int(11) DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  `is_purchasereviewid` varchar(20) NOT NULL DEFAULT '',
  `is_productorderid` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`is_id`),
  KEY `index1` (`it_id`)
) ENGINE=MyISAM AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_item_use_like_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_item_use_like_log` (
  `il_id` int(11) NOT NULL AUTO_INCREMENT,
  `is_id` int(11) DEFAULT NULL,
  `mb_id` varchar(255) DEFAULT NULL,
  `il_type` varchar(50) DEFAULT NULL,
  `il_datetime` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`il_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_main_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_main_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_mobile_bottom_popup`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_mobile_bottom_popup` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_mobile_category_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_mobile_category_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_file_header` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_order`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_order` (
  `od_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `od_name` varchar(20) NOT NULL DEFAULT '',
  `od_email` varchar(100) NOT NULL DEFAULT '',
  `od_tel` varchar(20) NOT NULL DEFAULT '',
  `od_hp` varchar(20) NOT NULL DEFAULT '',
  `od_zip1` char(3) NOT NULL DEFAULT '',
  `od_zip2` char(3) NOT NULL DEFAULT '',
  `od_addr1` varchar(100) NOT NULL DEFAULT '',
  `od_addr2` varchar(100) NOT NULL DEFAULT '',
  `od_addr3` varchar(255) NOT NULL DEFAULT '',
  `od_addr_jibeon` varchar(255) NOT NULL DEFAULT '',
  `od_deposit_name` varchar(20) NOT NULL DEFAULT '',
  `od_deposit_bank` varchar(20) NOT NULL DEFAULT '',
  `od_b_name` varchar(20) NOT NULL DEFAULT '',
  `od_b_tel` varchar(20) NOT NULL DEFAULT '',
  `od_b_hp` varchar(20) NOT NULL DEFAULT '',
  `od_b_zip1` char(3) NOT NULL DEFAULT '',
  `od_b_zip2` char(3) NOT NULL DEFAULT '',
  `od_b_addr1` varchar(100) NOT NULL DEFAULT '',
  `od_b_addr2` varchar(100) NOT NULL DEFAULT '',
  `od_b_addr3` varchar(255) NOT NULL DEFAULT '',
  `od_b_addr_jibeon` varchar(255) NOT NULL DEFAULT '',
  `od_memo` text DEFAULT NULL,
  `od_cancel_memo` varchar(300) DEFAULT NULL,
  `od_cart_count` int(11) NOT NULL DEFAULT 0,
  `od_cart_price` int(11) NOT NULL DEFAULT 0,
  `od_cart_coupon` int(11) NOT NULL DEFAULT 0,
  `od_send_cost` int(11) NOT NULL DEFAULT 0,
  `od_send_cost2` int(11) NOT NULL DEFAULT 0,
  `od_send_coupon` int(11) NOT NULL DEFAULT 0,
  `od_receipt_price` int(11) NOT NULL DEFAULT 0,
  `od_cancel_price` int(11) NOT NULL DEFAULT 0,
  `od_receipt_point` int(11) NOT NULL DEFAULT 0,
  `od_refund_price` int(11) NOT NULL DEFAULT 0,
  `od_bank_account` varchar(255) NOT NULL DEFAULT '',
  `od_card_quota` varchar(2) DEFAULT '' COMMENT '카드할부개월수',
  `od_receipt_time` varchar(50) DEFAULT NULL COMMENT '결제시간',
  `od_coupon` int(11) NOT NULL DEFAULT 0,
  `od_misu` int(11) NOT NULL DEFAULT 0,
  `od_shop_memo` text DEFAULT NULL,
  `od_mod_history` text DEFAULT NULL,
  `od_status` varchar(255) NOT NULL DEFAULT '' COMMENT '주문,입금,준비,배송,완료,반품,취소,취소요청',
  `od_cancel_status` varchar(1) DEFAULT NULL COMMENT '1:취소요청,2:취소승인,3:취소반려',
  `od_cancel_time` varchar(20) DEFAULT NULL COMMENT '취소 신청 일시',
  `od_hope_date` varchar(50) NOT NULL DEFAULT '0000-00-00',
  `od_settle_case` varchar(255) NOT NULL DEFAULT '',
  `od_other_pay_type` varchar(100) NOT NULL DEFAULT '',
  `od_test` varchar(3) NOT NULL DEFAULT '0',
  `od_mobile` varchar(3) NOT NULL DEFAULT '0',
  `od_pg` varchar(255) NOT NULL DEFAULT '',
  `od_tno` varchar(255) NOT NULL DEFAULT '',
  `od_app_no` varchar(20) NOT NULL DEFAULT '',
  `od_escrow` varchar(3) NOT NULL DEFAULT '0',
  `od_casseqno` varchar(255) NOT NULL DEFAULT '',
  `od_tax_flag` varchar(3) NOT NULL DEFAULT '0',
  `od_tax_mny` int(11) NOT NULL DEFAULT 0,
  `od_vat_mny` int(11) NOT NULL DEFAULT 0,
  `od_free_mny` int(11) NOT NULL DEFAULT 0,
  `od_delivery_company` varchar(255) DEFAULT NULL,
  `od_invoice` varchar(255) NOT NULL DEFAULT '',
  `od_invoice_time` varchar(20) DEFAULT NULL,
  `od_cash` varchar(3) DEFAULT NULL,
  `od_cash_no` varchar(255) DEFAULT NULL,
  `od_cash_info` text DEFAULT NULL,
  `od_time` varchar(50) NOT NULL COMMENT '주문시간',
  `od_pwd` varchar(255) NOT NULL DEFAULT '',
  `od_ip` varchar(25) NOT NULL DEFAULT '',
  `pt_case` varchar(255) NOT NULL DEFAULT '',
  `pt_price` varchar(255) NOT NULL DEFAULT '',
  `pt_memo` varchar(255) NOT NULL DEFAULT '',
  `od_bill_hp` varchar(255) DEFAULT NULL COMMENT '현금영수증 발급시 휴대폰번호',
  `change_it_id` varchar(255) DEFAULT NULL,
  `change_it_option` varchar(255) DEFAULT NULL,
  `return_flag` int(11) DEFAULT 0,
  `change_flag` int(11) DEFAULT 0,
  `csalarm` varchar(255) DEFAULT NULL,
  `od_deliver_request` varchar(255) DEFAULT NULL,
  `od_naver_orderid` varchar(20) NOT NULL DEFAULT '',
  `od_naver_sync_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`od_id`),
  KEY `index2` (`mb_id`),
  KEY `ix_naver_orderid` (`od_naver_orderid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='주문';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_order_address`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_order_address` (
  `ad_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `ad_subject` varchar(255) NOT NULL DEFAULT '',
  `ad_default` varchar(3) NOT NULL DEFAULT '0',
  `ad_name` varchar(255) NOT NULL DEFAULT '',
  `ad_tel` varchar(255) NOT NULL DEFAULT '',
  `ad_hp` varchar(255) NOT NULL DEFAULT '',
  `ad_zip1` char(3) NOT NULL DEFAULT '',
  `ad_zip2` char(3) NOT NULL DEFAULT '',
  `ad_addr1` varchar(255) NOT NULL DEFAULT '',
  `ad_addr2` varchar(255) NOT NULL DEFAULT '',
  `ad_addr3` varchar(255) NOT NULL DEFAULT '',
  `ad_jibeon` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`ad_id`),
  KEY `mb_id` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_order_data`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_order_data` (
  `od_id` bigint(20) unsigned NOT NULL,
  `cart_id` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `dt_pg` varchar(255) NOT NULL DEFAULT '',
  `dt_data` text NOT NULL,
  `dt_time` varchar(20) NOT NULL,
  KEY `od_id` (`od_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_order_delete`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_order_delete` (
  `de_id` int(11) NOT NULL AUTO_INCREMENT,
  `de_key` varchar(255) NOT NULL DEFAULT '',
  `de_data` longtext NOT NULL,
  `mb_id` varchar(20) NOT NULL DEFAULT '',
  `de_ip` varchar(255) NOT NULL DEFAULT '',
  `de_datetime` varchar(20) NOT NULL,
  PRIMARY KEY (`de_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_order_post_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_order_post_log` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `oid` bigint(20) unsigned NOT NULL,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `post_data` text NOT NULL,
  `ol_code` varchar(255) NOT NULL DEFAULT '',
  `ol_msg` text NOT NULL,
  `ol_datetime` varchar(20) NOT NULL,
  `ol_ip` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`log_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_pc_category_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_pc_category_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_alt2` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_file_header` int(11) DEFAULT NULL,
  `bn_ca_kind` varchar(1) DEFAULT NULL,
  `bn_category1` varchar(50) DEFAULT NULL,
  `bn_category2` varchar(50) DEFAULT NULL,
  `bn_category3` varchar(50) DEFAULT NULL,
  `bn_category4` varchar(50) DEFAULT NULL,
  `bn_open` varchar(1) DEFAULT 'Y',
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_personalpay`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_personalpay` (
  `pp_id` bigint(20) unsigned NOT NULL,
  `od_id` bigint(20) unsigned NOT NULL,
  `pp_name` varchar(255) NOT NULL DEFAULT '',
  `pp_email` varchar(255) NOT NULL DEFAULT '',
  `pp_hp` varchar(255) NOT NULL DEFAULT '',
  `pp_content` text NOT NULL,
  `pp_use` varchar(3) NOT NULL DEFAULT '0',
  `pp_price` int(11) NOT NULL DEFAULT 0,
  `pp_pg` varchar(255) NOT NULL DEFAULT '',
  `pp_tno` varchar(255) NOT NULL DEFAULT '',
  `pp_app_no` varchar(20) NOT NULL DEFAULT '',
  `pp_casseqno` varchar(255) NOT NULL DEFAULT '',
  `pp_receipt_price` int(11) NOT NULL DEFAULT 0,
  `pp_settle_case` varchar(255) NOT NULL DEFAULT '',
  `pp_bank_account` varchar(255) NOT NULL DEFAULT '',
  `pp_deposit_name` varchar(255) NOT NULL DEFAULT '',
  `pp_receipt_time` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `pp_receipt_ip` varchar(255) NOT NULL DEFAULT '',
  `pp_shop_memo` text NOT NULL,
  `pp_cash` varchar(3) NOT NULL DEFAULT '0',
  `pp_cash_no` varchar(255) NOT NULL DEFAULT '',
  `pp_cash_info` text NOT NULL,
  `pp_ip` varchar(255) NOT NULL DEFAULT '',
  `pp_time` varchar(20) NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`pp_id`),
  KEY `od_id` (`od_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_plan_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_plan_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_plan_id` int(11) NOT NULL DEFAULT 1 COMMENT '기획서:1, 기획서:2, 기획서:3, 기획서:4',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_plan_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_plan_list_item` (
  `plan_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_id` int(11) NOT NULL,
  `bn_plan_item_idx` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`plan_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_pointsetting`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_pointsetting` (
  `co_id` int(11) NOT NULL AUTO_INCREMENT,
  `co_kind` varchar(1) NOT NULL DEFAULT '',
  `grade1` varchar(20) NOT NULL DEFAULT '',
  `grade2` varchar(20) NOT NULL DEFAULT '',
  `grade3` varchar(20) NOT NULL DEFAULT '',
  `grade4` varchar(20) NOT NULL DEFAULT '',
  `grade5` varchar(20) NOT NULL DEFAULT '',
  `gradeType1` varchar(20) NOT NULL DEFAULT '',
  `gradeType2` varchar(20) NOT NULL DEFAULT '',
  `gradeType3` varchar(20) NOT NULL DEFAULT '',
  `gradeType4` varchar(20) NOT NULL DEFAULT '',
  `gradeType5` varchar(20) NOT NULL DEFAULT '',
  `cl_datetime` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`co_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_profile`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_profile` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_review_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_review_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_review_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_review_list_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL,
  `bn_item_idx` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_sale_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_sale_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_sub_title` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_sendcost`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_sendcost` (
  `sc_id` int(11) NOT NULL AUTO_INCREMENT,
  `sc_name` varchar(255) NOT NULL DEFAULT '',
  `sc_zip1` varchar(10) NOT NULL DEFAULT '',
  `sc_zip2` varchar(10) NOT NULL DEFAULT '',
  `sc_price` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`sc_id`),
  KEY `sc_zip1` (`sc_zip1`),
  KEY `sc_zip2` (`sc_zip2`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_style_category_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_style_category_banner` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_alt2` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` text DEFAULT NULL,
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) DEFAULT '0',
  `bn_new_win` varchar(3) DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` varchar(50) DEFAULT '0',
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_status` int(11) DEFAULT NULL,
  `bn_order_all` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_style_category_banner_feed`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_style_category_banner_feed` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_style_idx` int(11) NOT NULL,
  `bn_feed_idx` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  `selItem` int(11) DEFAULT 2,
  `bn_celeb_idx` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_styling_product`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_styling_product` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) NOT NULL DEFAULT '0',
  `bn_new_win` varchar(3) NOT NULL DEFAULT '0',
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_styling_product_feed`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_styling_product_feed` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_style_idx` int(11) NOT NULL,
  `bn_feed_idx` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=280 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_vas_list`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_vas_list` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) NOT NULL DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) DEFAULT '0',
  `bn_new_win` varchar(3) DEFAULT '0',
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_vas_list_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_vas_list_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL,
  `bn_item_idx` varchar(50) NOT NULL DEFAULT '0',
  `bn_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=967 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_what_people_want`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_what_people_want` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_type` varchar(10) DEFAULT NULL COMMENT '1:배너 2:상품',
  `bn_kind` varchar(50) NOT NULL DEFAULT '',
  `bcode` int(11) NOT NULL DEFAULT 0 COMMENT '기획전1 :1, 기획전2: 2. 기획전3: 3',
  `bn_category_idx` varchar(10) DEFAULT NULL COMMENT 'va_shop_exhibition_category 의 co_id 값',
  `bn_alt` varchar(255) NOT NULL DEFAULT '',
  `bn_alt2` varchar(255) NOT NULL DEFAULT '',
  `bn_subject` varchar(255) NOT NULL DEFAULT '',
  `bn_desc` varchar(255) DEFAULT '',
  `bn_url` varchar(255) NOT NULL DEFAULT '',
  `bn_device` varchar(10) NOT NULL DEFAULT '',
  `bn_position` varchar(255) NOT NULL DEFAULT '',
  `bn_border` varchar(3) DEFAULT NULL,
  `bn_new_win` varchar(3) DEFAULT NULL,
  `bn_status` varchar(3) DEFAULT NULL,
  `bn_begin_time` varchar(20) NOT NULL,
  `bn_end_time` varchar(20) NOT NULL,
  `bn_time` varchar(20) NOT NULL,
  `bn_hit` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) NOT NULL DEFAULT 0,
  `bn_cate1` varchar(100) DEFAULT NULL,
  `bn_cate2` varchar(100) DEFAULT NULL,
  `bn_item_idx` int(11) DEFAULT NULL,
  `it_img1` varchar(255) DEFAULT NULL,
  `it_img2` varchar(255) DEFAULT NULL,
  `it_img3` varchar(255) DEFAULT NULL,
  `it_img4` varchar(255) DEFAULT NULL,
  `bn_url1` varchar(255) DEFAULT NULL,
  `bn_url2` varchar(255) DEFAULT NULL,
  `bn_url3` varchar(255) DEFAULT NULL,
  `bn_url4` varchar(255) DEFAULT NULL,
  `bn_new_win1` int(11) DEFAULT NULL,
  `bn_new_win2` int(11) DEFAULT NULL,
  `bn_new_win3` int(11) DEFAULT NULL,
  `bn_new_win4` int(11) DEFAULT NULL,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_what_people_want_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_what_people_want_item` (
  `bn_id` int(11) NOT NULL AUTO_INCREMENT,
  `bn_category_idx` int(11) NOT NULL COMMENT 'va_shop_exhibition_list bn_id값',
  `bn_item_idx` int(11) NOT NULL DEFAULT 0,
  `bn_order` int(11) DEFAULT NULL,
  `it_sail_price` int(11) DEFAULT 0,
  PRIMARY KEY (`bn_id`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=607 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=FIXED;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `va_shop_wish`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `va_shop_wish` (
  `wi_id` int(11) NOT NULL AUTO_INCREMENT,
  `mb_id` varchar(255) NOT NULL DEFAULT '',
  `it_id` varchar(20) NOT NULL DEFAULT '0',
  `wi_time` varchar(20) NOT NULL,
  `wi_ip` varchar(25) NOT NULL DEFAULT '',
  PRIMARY KEY (`wi_id`),
  KEY `index1` (`mb_id`)
) ENGINE=MyISAM AUTO_INCREMENT=751 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_config` (
  `cf_ix` int(11) NOT NULL AUTO_INCREMENT,
  `cf_userid` varchar(100) NOT NULL COMMENT '비즈엠아이디',
  `cf_userkey_key` varchar(255) NOT NULL COMMENT '비즈엠계정키',
  `cf_profile_key` varchar(255) NOT NULL COMMENT '발신프로필키',
  `cf_smssender` varchar(20) NOT NULL COMMENT '발신번호',
  `cf_receiver` varchar(255) NOT NULL COMMENT '관리자수신번호',
  `cf_sms_use` varchar(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cf_ix`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='환경설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_fl_image`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_fl_image` (
  `fi_id` int(11) NOT NULL AUTO_INCREMENT,
  `fi_insert_type` enum('비즈엠등록','API업로드') NOT NULL DEFAULT '비즈엠등록' COMMENT '이미지파일 업로드방식',
  `fi_wide` enum('Y','N') NOT NULL DEFAULT 'N' COMMENT '와이드형이미지여부',
  `fi_img_name` varchar(255) NOT NULL COMMENT '이미지 원본 파일명',
  `fi_img_url` varchar(255) NOT NULL COMMENT '이미지 URL',
  `fi_time` varchar(20) DEFAULT NULL COMMENT '등록일',
  PRIMARY KEY (`fi_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='친구톡이미지';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_items` (
  `ati_id` int(11) NOT NULL AUTO_INCREMENT,
  `at_id` int(11) NOT NULL COMMENT '템플릿키',
  `ati_summary` varchar(3) NOT NULL DEFAULT '0' COMMENT '요약정보여부',
  `ati_title` varchar(60) NOT NULL COMMENT '타이틀',
  `ati_description` varchar(100) NOT NULL COMMENT '부가정보',
  PRIMARY KEY (`ati_id`),
  KEY `at_id` (`at_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='알림톡템플릿아이템리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_log`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_log` (
  `ao_id` int(11) NOT NULL AUTO_INCREMENT,
  `ao_tmplId` varchar(30) NOT NULL COMMENT '템플릿코드',
  `ao_phn` varchar(15) NOT NULL COMMENT '수신자번호',
  `ao_type` varchar(2) NOT NULL COMMENT '발송 유형 (at: 알림톡, ft: 친구톡, S: SMS, L:LMS, M: MMS)',
  `ao_msgid` varchar(40) NOT NULL COMMENT '메시지 일련번호 (메시지에 대해 고유한 값)',
  `ao_msg` text NOT NULL COMMENT '메시지 내용',
  `ao_result` varchar(255) NOT NULL COMMENT '처리결과',
  `ao_is_success` varchar(3) NOT NULL DEFAULT '0' COMMENT '발송 성공(예약 성공)/실패 여부',
  `ao_reserveDt` varchar(20) DEFAULT NULL COMMENT '예약발송을 위한 시간값',
  `ao_time` varchar(20) DEFAULT NULL COMMENT '요청일시',
  PRIMARY KEY (`ao_id`),
  KEY `at_tmplId` (`ao_tmplId`)
) ENGINE=MyISAM AUTO_INCREMENT=1599 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='알림톡발송로그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_template`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_template` (
  `at_id` int(11) NOT NULL AUTO_INCREMENT,
  `at_tmplId` varchar(30) NOT NULL COMMENT '템플릿코드',
  `at_emp_type` varchar(10) NOT NULL COMMENT '템플릿강조유형',
  `at_title` varchar(255) NOT NULL COMMENT '템플릿명',
  `at_type` varchar(255) NOT NULL COMMENT '메세지유형',
  `at_accent_title` varchar(255) NOT NULL COMMENT '강조표기할핵심정보',
  `at_msg` text NOT NULL COMMENT '템플릿내용',
  `at_use` varchar(3) NOT NULL DEFAULT '1' COMMENT '사용여부',
  `at_header` varchar(100) NOT NULL COMMENT '템플릿 헤더',
  `at_itemHighlight_title` varchar(100) NOT NULL COMMENT '아이템하이라이트타이틀',
  `at_itemHighlight_description` varchar(100) NOT NULL COMMENT '아이템하이라이트부가정보',
  PRIMARY KEY (`at_id`),
  UNIQUE KEY `at_tmplId` (`at_tmplId`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='알림톡템플릿';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_template_button`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_template_button` (
  `atb_id` int(11) NOT NULL AUTO_INCREMENT,
  `at_tmplId` varchar(30) NOT NULL COMMENT '템플릿코드',
  `atb_gubun` enum('button','quick') NOT NULL DEFAULT 'button' COMMENT '버튼형태 (quick:바로연결)',
  `atb_name` varchar(255) NOT NULL COMMENT '버튼명',
  `atb_type` varchar(255) NOT NULL COMMENT '버튼타입',
  `atb_url_mobile` varchar(255) NOT NULL COMMENT '모바일링크',
  `atb_url_pc` varchar(255) NOT NULL COMMENT 'PC링크',
  `atb_scheme_android` varchar(255) NOT NULL COMMENT 'android스킴',
  `atb_scheme_ios` varchar(255) NOT NULL COMMENT 'ios스킴',
  `atb_plugin_id` varchar(255) NOT NULL COMMENT '플러그인 id',
  PRIMARY KEY (`atb_id`),
  KEY `at_tmplId` (`at_tmplId`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='알림톡템플릿버튼';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wz_alimtalk2_template_cate`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `wz_alimtalk2_template_cate` (
  `atc_id` int(11) NOT NULL AUTO_INCREMENT,
  `at_tmplId` varchar(30) NOT NULL COMMENT '템플릿코드',
  `atc_code` varchar(50) NOT NULL COMMENT '분류코드',
  PRIMARY KEY (`atc_id`),
  KEY `at_tmplId` (`at_tmplId`),
  KEY `atc_code` (`atc_code`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='알림톡템플릿적용상태';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
