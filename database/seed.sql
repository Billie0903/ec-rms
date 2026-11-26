-- EC-RMS sample data (FAKE people only; never put real resident data in a demo).
-- Run after schema.sql. Every account's password is: Demo@1234
--
--   admin@ecrms.test       Admin
--   operator1@ecrms.test   Operator
--   operator2@ecrms.test   Operator
--   lan.nguyen@ecrms.test  Relative (full access to Nguyễn Văn An)
--   minh.tran@ecrms.test   Relative (full access to Trần Thị Bình and Trần Văn Cường)
--   hoa.le@ecrms.test      Relative (basic access to Lê Thị Dung)
--   tuan.pham@ecrms.test   Relative, NOT activated yet. Activation link:
--                          http://localhost:5173/activate/demo-invite-token-for-tuan-pham-0001
--
-- Dates are relative to NOW() so the demo always looks current.

USE ec_rms;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE audit_logs; TRUNCATE deletion_requests; TRUNCATE weekly_summaries; TRUNCATE schedules;
TRUNCATE care_notes; TRUNCATE vital_signs; TRUNCATE medications; TRUNCATE health_conditions;
TRUNCATE allergies; TRUNCATE resident_relatives; TRUNCATE residents; TRUNCATE account_invites; TRUNCATE users;
SET FOREIGN_KEY_CHECKS = 1;

SET @pw = '$2b$12$Q1dmVRCeccjF12HuWoDZ/uUan02GU8h7cJWJO9Ncssqa9z8ySGefe';

INSERT INTO users (id, full_name, email, phone, password_hash, role, status) VALUES
  (1, 'Quản trị viên',   'admin@ecrms.test',      '0901000001', @pw,  'admin',    'active'),
  (2, 'Đỗ Thu Hà',       'operator1@ecrms.test',  '0901000002', @pw,  'operator', 'active'),
  (3, 'Vũ Quốc Khánh',   'operator2@ecrms.test',  '0901000003', @pw,  'operator', 'active'),
  (4, 'Nguyễn Thị Lan',  'lan.nguyen@ecrms.test', '0912000004', @pw,  'relative', 'active'),
  (5, 'Trần Đức Minh',   'minh.tran@ecrms.test',  '0912000005', @pw,  'relative', 'active'),
  (6, 'Lê Thanh Hoa',    'hoa.le@ecrms.test',     '0912000006', @pw,  'relative', 'active'),
  (7, 'Phạm Anh Tuấn',   'tuan.pham@ecrms.test',  '0912000007', NULL, 'relative', 'invited');

INSERT INTO account_invites (user_id, token_hash, expires_at, created_by) VALUES
  (7, SHA2('demo-invite-token-for-tuan-pham-0001', 256), NOW() + INTERVAL 30 DAY, 1);

INSERT INTO residents (id, resident_code, full_name, date_of_birth, gender, room, admission_date, status,
                       mobility_level, fall_risk, diet_notes, cognitive_status, primary_doctor, preferred_hospital, created_by) VALUES
  (1, 'RS-0001', 'Nguyễn Văn An',   '1940-03-12', 'male',   'A101', CURDATE() - INTERVAL 400 DAY, 'active',   'walking_aid', 'high',   'Ít muối, cháo mềm buổi tối', 'Sa sút trí tuệ nhẹ',      'BS. Phạm Hùng', 'Bệnh viện Chợ Rẫy',     1),
  (2, 'RS-0002', 'Trần Thị Bình',   '1938-07-25', 'female', 'A102', CURDATE() - INTERVAL 250 DAY, 'active',   'wheelchair',  'medium', 'Tiểu đường: hạn chế đường', 'Tỉnh táo',                'BS. Lê Mai',    'Bệnh viện Nhân dân 115', 1),
  (3, 'RS-0003', 'Trần Văn Cường',  '1936-01-08', 'male',   'A103', CURDATE() - INTERVAL 250 DAY, 'hospital', 'bedridden',   'high',   'Ăn qua ống thông',           'Lú lẫn từng lúc',         'BS. Lê Mai',    'Bệnh viện Nhân dân 115', 1),
  (4, 'RS-0004', 'Lê Thị Dung',     '1945-11-30', 'female', 'B201', CURDATE() - INTERVAL 120 DAY, 'active',   'independent', 'low',    NULL,                         'Tỉnh táo',                'BS. Phạm Hùng', 'Bệnh viện Chợ Rẫy',     2),
  (5, 'RS-0005', 'Hoàng Văn Em',    '1942-05-17', 'male',   'B202', CURDATE() - INTERVAL 90 DAY,  'active',   'walking_aid', 'medium', 'Không ăn hải sản',           'Tỉnh táo',                'BS. Phạm Hùng', 'Bệnh viện Chợ Rẫy',     2),
  (6, 'RS-0006', 'Phan Thị Giang',  '1939-09-02', 'female', 'B203', CURDATE() - INTERVAL 60 DAY,  'active',   'independent', 'low',    'Ăn chay',                    'Suy giảm trí nhớ nhẹ',    'BS. Lê Mai',    'Bệnh viện Nhân dân 115', 2),
  (7, 'RS-0007', 'Đặng Văn Hải',    '1935-12-21', 'male',   'C301', CURDATE() - INTERVAL 30 DAY,  'active',   'wheelchair',  'high',   'Cháo xay',                   'Sa sút trí tuệ trung bình','BS. Phạm Hùng', 'Bệnh viện Chợ Rẫy',     3),
  (8, 'RS-0008', 'Bùi Thị Kim',     '1944-04-04', 'female', NULL,   CURDATE() - INTERVAL 500 DAY, 'discharged','independent','low',    NULL,                         'Tỉnh táo',                'BS. Lê Mai',    'Bệnh viện Nhân dân 115', 1);

INSERT INTO resident_relatives (resident_id, relative_user_id, relationship, access_level, is_emergency_contact, is_legal_guardian,
                                consent_recorded_at, consent_recorded_by, consent_note) VALUES
  (1, 4, 'Con gái', 'full',  TRUE,  TRUE,  NOW() - INTERVAL 400 DAY, 1, 'Mẫu đồng ý ký khi nhập viện'),
  (2, 5, 'Con trai','full',  TRUE,  FALSE, NOW() - INTERVAL 250 DAY, 1, 'Cụ Bình tự ký đồng ý'),
  (3, 5, 'Con trai','full',  TRUE,  TRUE,  NOW() - INTERVAL 250 DAY, 1, 'Người giám hộ theo quyết định của tòa'),
  (4, 6, 'Cháu gái','basic', FALSE, FALSE, NOW() - INTERVAL 120 DAY, 1, 'Cụ Dung đồng ý cho xem lịch và tóm tắt'),
  (5, 7, 'Con trai','full',  TRUE,  FALSE, NOW() - INTERVAL 1 DAY,   1, 'Cụ Em tự ký đồng ý');

INSERT INTO allergies (resident_id, allergen, type, reaction, severity) VALUES
  (1, 'Penicillin', 'drug',  'Nổi mề đay, khó thở', 'severe'),
  (2, 'Tôm, cua',   'food',  'Ngứa, nổi mẩn',       'moderate'),
  (5, 'Hải sản',    'food',  'Phát ban',            'moderate'),
  (7, 'Aspirin',    'drug',  'Đau dạ dày',          'mild');

INSERT INTO health_conditions (resident_id, name, since_date, notes) VALUES
  (1, 'Tăng huyết áp',          '2010-01-01', 'Theo dõi huyết áp mỗi sáng'),
  (1, 'Sa sút trí tuệ nhẹ',     '2022-06-01', NULL),
  (2, 'Đái tháo đường type 2',  '2005-01-01', 'Đo đường huyết trước bữa sáng'),
  (3, 'Đột quỵ (di chứng)',     '2023-03-15', 'Liệt nửa người phải'),
  (4, 'Thoái hóa khớp gối',     '2018-01-01', NULL),
  (5, 'Bệnh phổi tắc nghẽn mạn tính', '2015-01-01', 'Dùng thuốc xịt'),
  (7, 'Sa sút trí tuệ trung bình', '2020-01-01', 'Cần giám sát khi di chuyển');

INSERT INTO medications (resident_id, name, dosage, route, times_of_day, instructions, start_date, prescribed_by) VALUES
  (1, 'Amlodipine',  '5 mg',      'oral',    '["08:00"]',          'Uống sau ăn sáng',         CURDATE() - INTERVAL 400 DAY, 'BS. Phạm Hùng'),
  (1, 'Donepezil',   '5 mg',      'oral',    '["21:00"]',          'Uống trước khi ngủ',       CURDATE() - INTERVAL 300 DAY, 'BS. Phạm Hùng'),
  (2, 'Metformin',   '500 mg',    'oral',    '["07:30","19:30"]',  'Uống cùng bữa ăn',         CURDATE() - INTERVAL 250 DAY, 'BS. Lê Mai'),
  (3, 'Clopidogrel', '75 mg',     'oral',    '["08:00"]',          'Nghiền, cho qua ống thông', CURDATE() - INTERVAL 250 DAY, 'BS. Lê Mai'),
  (4, 'Glucosamine', '1500 mg',   'oral',    '["08:00"]',          NULL,                       CURDATE() - INTERVAL 100 DAY, 'BS. Phạm Hùng'),
  (5, 'Salbutamol',  '2 nhát xịt','inhaled', '["08:00","20:00"]',  'Thêm khi khó thở',         CURDATE() - INTERVAL 90 DAY,  'BS. Phạm Hùng'),
  (7, 'Memantine',   '10 mg',     'oral',    '["08:00","20:00"]',  NULL,                       CURDATE() - INTERVAL 30 DAY,  'BS. Phạm Hùng');

INSERT INTO vital_signs (resident_id, measured_at, bp_systolic, bp_diastolic, pulse, temperature_c, spo2, weight_kg, blood_sugar_mmol, recorded_by) VALUES
  (1, NOW() - INTERVAL 2 DAY, 142, 88, 76, 36.6, 96, 58.0, NULL, 2),
  (1, NOW() - INTERVAL 1 DAY, 138, 85, 74, 36.7, 97, NULL, NULL, 2),
  (1, NOW() - INTERVAL 3 HOUR,135, 84, 72, 36.5, 97, NULL, NULL, 2),
  (2, NOW() - INTERVAL 1 DAY, 128, 78, 80, 36.8, 95, 52.5, 7.8,  3),
  (2, NOW() - INTERVAL 2 HOUR,130, 80, 82, 36.9, 96, NULL, 6.9,  3),
  (4, NOW() - INTERVAL 1 DAY, 120, 75, 70, 36.4, 98, 61.0, NULL, 2),
  (5, NOW() - INTERVAL 1 DAY, 125, 82, 88, 37.1, 93, 66.0, NULL, 3),
  (7, NOW() - INTERVAL 5 HOUR,145, 90, 78, 36.6, 95, 55.0, NULL, 3);

INSERT INTO care_notes (resident_id, category, note, visible_to_family, author_id, created_at) VALUES
  (1, 'daily',    'Cụ ăn hết suất sáng, tham gia tập thể dục nhẹ buổi sáng. Tinh thần vui vẻ.', TRUE,  2, NOW() - INTERVAL 1 DAY),
  (1, 'incident', 'Cụ bị trượt chân nhẹ khi đi vệ sinh lúc 22:10, không chấn thương. Đã báo gia đình.', TRUE,  2, NOW() - INTERVAL 3 DAY),
  (1, 'health',   'Huyết áp sáng hơi cao, theo dõi thêm 3 ngày trước khi báo bác sĩ.', FALSE, 2, NOW() - INTERVAL 2 DAY),
  (2, 'daily',    'Cụ ngủ ngon, đường huyết ổn định. Tham gia buổi hát karaoke chiều.', TRUE,  3, NOW() - INTERVAL 1 DAY),
  (3, 'health',   'Cụ nhập viện 115 do viêm phổi, gia đình đã được thông báo.', TRUE,  3, NOW() - INTERVAL 4 DAY),
  (4, 'activity', 'Cụ hướng dẫn các cụ khác làm hoa giấy.', TRUE, 2, NOW() - INTERVAL 2 DAY),
  (5, 'health',   'SpO2 93%, cho dùng thêm 1 lần xịt, theo dõi.', FALSE, 3, NOW() - INTERVAL 1 DAY),
  (7, 'daily',    'Cụ hơi bồn chồn buổi chiều, đã cho nghe nhạc và đi dạo trong vườn.', TRUE, 3, NOW() - INTERVAL 6 HOUR);

INSERT INTO schedules (resident_id, title, type, start_at, end_at, location, notes) VALUES
  (1, 'Tái khám tim mạch',      'appointment', DATE(NOW() + INTERVAL 3 DAY) + INTERVAL 9 HOUR,  DATE(NOW() + INTERVAL 3 DAY) + INTERVAL 11 HOUR, 'Bệnh viện Chợ Rẫy', 'Nhân viên đưa đi'),
  (1, 'Tập vật lý trị liệu',    'therapy',     DATE(NOW() + INTERVAL 1 DAY) + INTERVAL 15 HOUR, DATE(NOW() + INTERVAL 1 DAY) + INTERVAL 16 HOUR, 'Phòng tập',         NULL),
  (2, 'Sinh hoạt hát karaoke',  'activity',    DATE(NOW() + INTERVAL 2 DAY) + INTERVAL 15 HOUR, DATE(NOW() + INTERVAL 2 DAY) + INTERVAL 16 HOUR, 'Sảnh chung',        NULL),
  (2, 'Gia đình đến thăm',      'visit',       DATE(NOW() + INTERVAL 4 DAY) + INTERVAL 10 HOUR, NULL,                                            'Phòng A102',        'Anh Minh'),
  (4, 'Lớp làm hoa giấy',       'activity',    DATE(NOW() + INTERVAL 1 DAY) + INTERVAL 9 HOUR,  DATE(NOW() + INTERVAL 1 DAY) + INTERVAL 10 HOUR, 'Phòng sinh hoạt',   NULL),
  (5, 'Khám hô hấp định kỳ',    'appointment', DATE(NOW() + INTERVAL 6 DAY) + INTERVAL 8 HOUR,  NULL,                                            'Bệnh viện Chợ Rẫy', NULL);

INSERT INTO weekly_summaries (resident_id, week_start, content, source, published_at, published_by) VALUES
  (1, CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY - INTERVAL 7 DAY,
      'Tuần qua cụ An ăn uống tốt, tham gia tập thể dục đều đặn. Có một lần trượt chân nhẹ, không chấn thương. Huyết áp hơi cao vào buổi sáng, nhân viên đang theo dõi. Lịch tái khám tim mạch vào tuần này.',
      'staff', NOW() - INTERVAL 2 DAY, 2),
  (4, CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY - INTERVAL 7 DAY,
      'Cụ Dung khỏe, vui vẻ và tích cực tham gia hoạt động làm hoa giấy.',
      'staff', NOW() - INTERVAL 2 DAY, 2);

INSERT INTO deletion_requests (resident_id, requested_by, reason, status, created_at) VALUES
  (8, 2, 'Cụ Kim đã xuất viện về ở với gia đình hơn 1 năm, đề nghị lưu trữ hồ sơ.', 'pending', NOW() - INTERVAL 1 DAY);

INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, created_at) VALUES
  (1, 'resident.create', 'resident', 1, NOW() - INTERVAL 400 DAY),
  (2, 'resident.archive_request', 'resident', 8, NOW() - INTERVAL 1 DAY);
