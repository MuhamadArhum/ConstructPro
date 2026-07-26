-- ============================================================
-- ConstructPro ERP (BuildERP) - Complete Seed Data
-- Database: PostgreSQL (Supabase)
-- Each table: 100 rows  |  Currency: PKR  |  Context: Pakistan
-- Run ONCE after all migrations have been applied.
-- ============================================================

-- ============================================================
-- 1. CUSTOMERS  (100 rows)
-- ============================================================
INSERT INTO "Customers"
  ("Id","Name","CompanyName","Phone","Email","Address","NTN","CNIC",
   "ProjectName","TotalBilled","TotalPaid","IsActive","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  (ARRAY['Ali Hassan','Ahmed Raza','Usman Khan','Muhammad Bilal','Farhan Sheikh',
         'Zubair Ahmed','Asim Butt','Tariq Mehmood','Shahid Iqbal','Imran Malik',
         'Awais Khalid','Bilal Chaudhry','Sohail Anwar','Nasir Hussain','Kamran Baig',
         'Faisal Qureshi','Saad Mirza','Omer Javed','Danish Latif','Waqar Shaukat',
         'Rizwan Akbar','Adeel Aslam','Hassan Noor','Arslan Bajwa','Junaid Gilani',
         'Tauqir Sattar','Naeem Siddiqui','Rafiq Ahmed','Zaheer Abbas','Majid Bhatti'])[((i-1)%30)+1],
  (ARRAY['Al-Hassan Builders','Raza Constructions Pvt Ltd','Khan & Sons Developers',
         'Bilal Engineering Co','Prime City Developers','Zubair Ahmed & Partners',
         'Asim Infrastructure','Metro Builders','Pak Construction Group','Imran Associates',
         'Al-Khalid Builders','Chaudhry & Co','Anwar Real Estate','Hussain Group',
         'Kamran Brothers','Qureshi Constructions','Mirza Housing Society',
         'Javed Engineering Works','Latif Developers','Waqar & Sons',
         'Rizwan Builders','Aslam Group','Hassan Engineers','Bajwa Infra',
         'Junaid Housing Pvt Ltd','Sattar Constructions','Siddiqui Builders',
         'Ahmed Associates','Abbas Real Estate','Bhatti Builders'])[((i-1)%30)+1],
  '030' || LPAD(((i*9371)%10000000)::text,7,'0'),
  'customer'||i||'@construction.pk',
  'House '||(i*3)||', Block '||CHR(64+(i%26)+1)||', '||
    (ARRAY['DHA Lahore','Gulberg Lahore','Bahria Town Lahore','Model Town Lahore',
           'Johar Town Lahore','DHA Karachi','Clifton Karachi','Gulshan-e-Iqbal Karachi',
           'DHA Islamabad','F-7 Islamabad','G-9 Islamabad','Blue Area Islamabad',
           'Saddar Rawalpindi','Bahria Town Rawalpindi','Cantt Multan',
           'New Multan','Hayatabad Peshawar','Qasimabad Hyderabad'])[((i-1)%18)+1],
  '200'||LPAD(i::text,4,'0')||'-'||LPAD((i*3%99)::text,2,'0'),
  '3520'||LPAD(i::text,2,'0')||'-'||LPAD((i*123456%9999999)::text,7,'0')||'-'||((i%9)+1),
  (ARRAY['Residential Complex Phase-I','Commercial Tower Block-A','DHA Housing Scheme',
         'Bahria Town Villa Project','Industrial Unit Construction',
         'Road Infrastructure Project','School Building Contract',
         'Hospital Wing Extension','Government Office Block',
         'Warehouse Facility'])[((i-1)%10)+1]||' '||i,
  (500000+(i%50)*250000)::numeric,
  (400000+(i%50)*200000)::numeric,
  (i%7 != 0),
  CASE WHEN i%5=0 THEN 'VIP Client - Priority handling required' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 2. SUPPLIERS  (100 rows)
-- ============================================================
INSERT INTO "Suppliers"
  ("Id","Name","CompanyName","Phone","Email","Address","NTN","Category",
   "TotalPurchased","TotalPaid","IsActive","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  (ARRAY['Saeed Ahmad','Bashir Traders','Pak Steel','Cement Corp','Iron Works',
         'Al-Ameen Traders','Rehman Materials','KHI Steel Industries','Punjab Hardware',
         'Super Cement','Al-Baraka Suppliers','National Steel','Lahore Cement Works',
         'Faisalabad Wires','Gujranwala Steel','Islamabad Marble','Rawalpindi Sand',
         'Multan Bricks','Peshawar Wood','Quetta Stone','Sialkot Pipes',
         'Sargodha Gravel','Hyderabad Plumbing','Sukkur Tiles','Bahawalpur Electrical',
         'Abbottabad Timber','Murree Aggregates','Mansehra Steel','Gilgit Stone',
         'Muzaffarabad Materials'])[((i-1)%30)+1],
  (ARRAY['Saeed Ahmad & Sons Traders','Bashir Construction Materials Pvt Ltd',
         'Pakistan Steel Trading Co','Cement Corporation Pvt Ltd',
         'Iron Works & Co Pakistan','Al-Ameen Trading Company',
         'Rehman Construction Materials','Karachi Steel Industries Ltd',
         'Punjab Hardware Depot','Super Cement Pvt Ltd',
         'Al-Baraka Builders Suppliers','National Steel Corporation',
         'Lahore Cement Works Ltd','Faisalabad Electrical Wires',
         'Gujranwala Steel Factory','Islamabad Marble House',
         'Rawalpindi Sand Suppliers','Multan Brick Kiln Industries',
         'Peshawar Timber Depot','Quetta Stone Works',
         'Sialkot Pipe Industries','Sargodha Gravel Depot',
         'Hyderabad Plumbing Supplies','Sukkur Tile Centre',
         'Bahawalpur Electrical Depot','Abbottabad Timber Yard',
         'Murree Aggregates Pvt Ltd','Mansehra Steel Works',
         'Gilgit Stone Quarry','Muzaffarabad Building Materials'])[((i-1)%30)+1],
  '031'||LPAD(((i*8273)%10000000)::text,7,'0'),
  'supplier'||i||'@materials.pk',
  'Plot '||(i*2)||', Industrial Zone, '||
    (ARRAY['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad',
           'Multan','Peshawar','Quetta','Sialkot','Gujranwala'])[((i-1)%10)+1],
  '300'||LPAD(i::text,4,'0')||'-'||LPAD((i*4%99)::text,2,'0'),
  (ARRAY['Cement & Concrete','Steel & Iron','Electrical','Plumbing',
         'Wood & Timber','Aggregates & Sand','Tiles & Flooring',
         'Machinery Parts','Fuel & Lubricants','Safety Equipment'])[((i-1)%10)+1],
  (200000+(i%40)*150000)::numeric,
  (150000+(i%40)*120000)::numeric,
  (i%8 != 0),
  CASE WHEN i%4=0 THEN 'Reliable supplier - 30 day credit terms' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'2 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 3. EMPLOYEES  (100 rows)
-- ============================================================
INSERT INTO "Employees"
  ("Id","FullName","Designation","Department","PhoneNumber","CNIC",
   "Address","BasicSalary","JoinDate","IsActive")
SELECT
  gen_random_uuid(),
  (ARRAY['Muhammad Usman','Ahmed Raza','Ali Hassan','Bilal Khan','Farhan Ahmed',
         'Zubair Shah','Asim Nawaz','Tariq Hussain','Shahid Butt','Imran Qureshi',
         'Awais Mirza','Bilal Akram','Sohail Malik','Nasir Javed','Kamran Iqbal',
         'Faisal Baig','Saad Noor','Omer Anwar','Danish Sattar','Waqar Rafiq',
         'Rizwan Zaheer','Adeel Majid','Hassan Aslam','Arslan Latif','Junaid Waqas',
         'Tauqir Naeem','Naeem Rashid','Rafiq Sultan','Zaheer Khalid',
         'Majid Chaudhry'])[((i-1)%30)+1],
  (ARRAY['Site Engineer','Project Manager','Civil Engineer','Electrical Engineer',
         'Mechanical Engineer','Site Supervisor','Quantity Surveyor','Safety Officer',
         'Accounts Manager','HR Officer','Procurement Officer','Store Keeper',
         'Admin Officer','Document Controller','Cost Engineer'])[((i-1)%15)+1],
  (ARRAY['Engineering','Operations','Finance','HR',
         'Administration','Procurement','Safety','Quality Control'])[((i-1)%8)+1],
  '030'||LPAD(((i*7419)%10000000)::text,7,'0'),
  '3520'||LPAD(i::text,2,'0')||'-'||LPAD((i*78563%9999999)::text,7,'0')||'-'||((i%9)+1),
  'House '||(i*4)||', Street '||(i%20+1)||', '||
    (ARRAY['Gulberg Lahore','DHA Lahore','Model Town Lahore','Johar Town Lahore',
           'Bahria Town Lahore','Clifton Karachi','DHA Karachi',
           'F-8 Islamabad','G-11 Islamabad','Saddar Rawalpindi'])[((i-1)%10)+1],
  (30000+(i%20)*5000)::numeric,
  ('2021-01-01'::timestamptz+(i*11||' days')::interval),
  (i%12 != 0)
FROM generate_series(1,100) AS i;

-- ============================================================
-- 4. INCOMES  (100 rows)
-- ============================================================
INSERT INTO "Incomes"
  ("Id","Category","Amount","Date","Description","CustomerName","ProjectName","IsPaid","CreatedAt")
SELECT
  gen_random_uuid(),
  (i%3),
  (100000+(i%50)*50000)::numeric,
  ('2025-01-01'::timestamptz+(i*3||' days')::interval),
  (ARRAY['Monthly progress billing for residential project',
         'Contract payment received from client',
         'Advance payment - project mobilization',
         'Final payment upon project completion',
         'Material cost recovery invoice',
         'Running bill No.'||i||' submitted',
         'Retention money released by client',
         'Variation order payment received',
         'Bonus payment on early completion',
         'Consultancy fee invoice'])[((i-1)%10)+1],
  (ARRAY['Ali Hassan','Ahmed Raza','Usman Khan','Muhammad Bilal','Farhan Sheikh',
         'Zubair Ahmed','Asim Butt','Tariq Mehmood','Shahid Iqbal','Imran Malik',
         'Awais Khalid','Bilal Chaudhry','Sohail Anwar','Nasir Hussain','Kamran Baig',
         'Faisal Qureshi','Saad Mirza','Omer Javed','Danish Latif',
         'Waqar Shaukat'])[((i-1)%20)+1],
  (ARRAY['Residential Complex Phase-I','Commercial Tower Block-A','DHA Housing Scheme',
         'Bahria Town Villa Project','Industrial Unit Construction',
         'Road Infrastructure Project','School Building Contract',
         'Hospital Wing Extension','Government Office Block',
         'Warehouse Facility'])[((i-1)%10)+1],
  (i%4 != 0),
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 5. EXPENSES  (100 rows)
-- ============================================================
INSERT INTO "Expenses"
  ("Id","Category","Amount","Date","Description","Vendor","CreatedAt")
SELECT
  gen_random_uuid(),
  (i%11),
  (15000+(i%30)*25000)::numeric,
  ('2025-01-01'::timestamptz+(i*3||' days')::interval),
  (ARRAY['Weekly labour wages payment','Monthly salary disbursement',
         'Machinery maintenance & repair cost','Vehicle fuel and maintenance',
         'Fuel purchase for site generators','Plant equipment servicing',
         'Carpentry work for formwork','Electrical wiring installation',
         'Material purchase from supplier','Office stationery and utilities',
         'Miscellaneous site expenses'])[((i%11))+1],
  (ARRAY['Saeed Ahmad & Sons','Pakistan Steel Mills Ltd','National Fuel Station',
         'Al-Ameen Traders','Rehman Construction Materials','Punjab Hardware Store',
         'Lahore Cement Works','Faisalabad Electrical Wires',
         'Karachi Steel Industries','Super Cement Pvt Ltd',
         'Miscellaneous Vendors'])[((i%11))+1],
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 6. LABOURS  (100 rows)
-- ============================================================
INSERT INTO "Labours"
  ("Id","Name","PhoneNumber","CNIC","Address","Trade",
   "DailyWage","OvertimeRatePerHour","JoinDate","IsActive")
SELECT
  gen_random_uuid(),
  (ARRAY['Ghulam Nabi','Muhammad Shafiq','Allah Ditta','Fazal Karim','Mehr Din',
         'Bashir Ahmed','Aslam Khan','Ramzan Ali','Liaquat Hussain','Boota Khan',
         'Noor Muhammad','Karim Bakhsh','Dil Muhammad','Hazoor Bakhsh','Sher Muhammad',
         'Khadim Hussain','Sadiq Ali','Gul Muhammad','Ameer Bakhsh','Faqeer Muhammad',
         'Inayat Khan','Barkat Ali','Muhammad Nawaz','Siddiq Ahmad','Khurshid Ahmad',
         'Manzoor Ahmad','Naseer Ahmad','Mukhtar Ahmad','Pervez Ahmad',
         'Tanveer Ahmad'])[((i-1)%30)+1]||' '||i,
  '030'||LPAD(((i*6183)%10000000)::text,7,'0'),
  '3610'||LPAD(i::text,2,'0')||'-'||LPAD((i*45678%9999999)::text,7,'0')||'-'||((i%9)+1),
  (ARRAY['Chak 23','Chak 45','Chak 67','Chak 89','Mauza Sihala',
         'Mauza Kalar','Mauza Dhamthal','Chak 12','Chak 34',
         'Mauza Kohala'])[((i-1)%10)+1]||', '||
    (ARRAY['Lahore','Faisalabad','Gujranwala','Sialkot','Sheikhupura',
           'Multan','Bahawalpur','Sargodha','Jhang',
           'Rahim Yar Khan'])[((i-1)%10)+1],
  (ARRAY['Mason','Carpenter','Plumber','Electrician','Welder',
         'Steel Fixer','Painter','Helper','Tile Layer','Excavator Operator',
         'Crane Operator','Truck Driver'])[((i-1)%12)+1],
  (700+(i%10)*100)::numeric,
  (150+(i%5)*50)::numeric,
  ('2023-01-01'::timestamptz+(i*5||' days')::interval),
  (i%10 != 0)
FROM generate_series(1,100) AS i;

-- ============================================================
-- 7. LABOUR ATTENDANCES  (100 rows)
--    Unique constraint: (LabourId, Date) -> 1 record per labour
-- ============================================================
INSERT INTO "LabourAttendances"
  ("Id","LabourId","Date","IsPresent","OvertimeHours","Notes")
SELECT
  gen_random_uuid(),
  l."Id",
  ('2025-07-01'::timestamptz+((i-1)*INTERVAL'1 day')),
  (i%8 != 0),
  CASE WHEN i%3=0 THEN ((i%5)+1)::numeric ELSE 0 END,
  CASE WHEN i%10=0 THEN 'Absent - medical leave' ELSE NULL END
FROM generate_series(1,100) AS i
JOIN (
  SELECT "Id", ROW_NUMBER() OVER (ORDER BY "JoinDate","Id") AS rn FROM "Labours"
) l ON l.rn = i;

-- ============================================================
-- 8. LABOUR ADVANCES  (100 rows)
-- ============================================================
INSERT INTO "LabourAdvances"
  ("Id","LabourId","Amount","Date","Reason")
SELECT
  gen_random_uuid(),
  l."Id",
  (2000+(i%10)*1000)::numeric,
  ('2025-06-01'::timestamptz+(i*3||' days')::interval),
  (ARRAY['Medical emergency','Eid advance payment','Personal loan request',
         'House rent payment','Education expenses','Wedding expenses',
         'Agricultural season expenses','Utility bills payment',
         'Travel expenses','Family emergency'])[((i-1)%10)+1]
FROM generate_series(1,100) AS i
JOIN (
  SELECT "Id", ROW_NUMBER() OVER (ORDER BY "JoinDate","Id") AS rn FROM "Labours"
) l ON l.rn = ((i-1)%100)+1;

-- ============================================================
-- 9. SALARY PAYMENTS  (100 rows)
-- ============================================================
INSERT INTO "SalaryPayments"
  ("Id","EmployeeId","Month","Year","BasicSalary","Bonus","Deductions",
   "NetSalary","DaysPresent","TotalDays","PaidAt","Remarks","CreatedAt")
SELECT
  gen_random_uuid(),
  e."Id",
  ((i%12)+1),
  CASE WHEN i<=50 THEN 2025 ELSE 2026 END,
  (30000+(i%20)*5000)::numeric,
  CASE WHEN i%5=0 THEN (5000+(i%5)*2000)::numeric ELSE 0 END,
  CASE WHEN i%7=0 THEN (1000+(i%3)*500)::numeric ELSE 0 END,
  (30000+(i%20)*5000
    + CASE WHEN i%5=0 THEN 5000 ELSE 0 END
    - CASE WHEN i%7=0 THEN 1000 ELSE 0 END)::numeric,
  (20+i%6),
  26,
  ('2025-01-31'::timestamptz+((i%12)*30||' days')::interval),
  CASE WHEN i%8=0 THEN 'Performance bonus included' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i
JOIN (
  SELECT "Id", ROW_NUMBER() OVER (ORDER BY "JoinDate","Id") AS rn FROM "Employees"
) e ON e.rn = ((i-1)%100)+1;

-- ============================================================
-- 10. MACHINERIES  (100 rows)
-- ============================================================
INSERT INTO "Machineries"
  ("Id","Name","Model","SerialNumber","PurchaseDate","PurchasePrice",
   "Status","TotalRunningHours","NextMaintenanceDate","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  (ARRAY['Excavator','Tower Crane','Concrete Mixer','Bulldozer','Wheel Loader',
         'Motor Grader','Vibratory Compactor','Diesel Generator','Dewatering Pump',
         'Concrete Pump','Pile Driver','Drilling Rig','Forklift','Backhoe Loader',
         'Tipper Truck','Concrete Vibrator','Shotcrete Machine','Welding Machine',
         'Air Compressor','Mobile Crane'])[((i-1)%20)+1]||' #'||i,
  (ARRAY['CAT 320GC','Liebherr 132 EC-H','Rex 500L','Komatsu D65PX','JCB 456ZX',
         'Volvo G930','Bomag BW213 DH','Perkins 250 KVA','Grundfos CM5-5',
         'Schwing S34 SX','PTC 110 R3','Soilmec SR-30','Hyster H50FT',
         'JCB 3DX Super','Sinotruk HOWO 371','Wacker VP1550','Aliva 260',
         'Lincoln 350MP','Atlas Copco XAS 97','Liebherr LTM 1030'])[((i-1)%20)+1],
  'SN-'||LPAD(i::text,4,'0')||'-'||LPAD((i*137)::text,4,'0'),
  ('2020-01-01'::timestamptz+(i*30||' days')::interval),
  (500000+(i%30)*200000)::numeric,
  CASE WHEN i%10=0 THEN 2 WHEN i%5=0 THEN 1 ELSE 0 END,
  (100+i*50)::numeric,
  ('2026-08-01'::timestamptz+(i*7||' days')::interval),
  CASE WHEN i%6=0 THEN 'Scheduled for major overhaul next quarter' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'2 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 11. MACHINERY MAINTENANCES  (100 rows)
-- ============================================================
INSERT INTO "MachineryMaintenances"
  ("Id","MachineryId","MaintenanceDate","Type","Description","Cost",
   "RunningHoursAtService","NextMaintenanceDate","ServiceProvider","CreatedAt")
SELECT
  gen_random_uuid(),
  m."Id",
  ('2025-01-01'::timestamptz+(i*3||' days')::interval),
  (i%2),
  (ARRAY['Engine oil change and filter replacement','Full engine overhaul',
         'Hydraulic system service and fluid change','Brake system inspection & adjustment',
         'Tire replacement and balancing','Battery replacement & alternator check',
         'Electrical system diagnostic and repair','Track adjustment and tensioning',
         'Boom and arm inspection','500-hour general service'])[((i-1)%10)+1],
  (5000+(i%20)*10000)::numeric,
  (500+i*20)::numeric,
  ('2025-07-01'::timestamptz+(i*30||' days')::interval),
  (ARRAY['Al-Rashid Service Center Lahore','National Machinery Services',
         'Pak Engineering Works Karachi','Master Mechanics Lahore',
         'CAT Authorized Dealer Service','JCB Pakistan Service Center',
         'Volvo Service Pakistan','Authorized Workshop Karachi',
         'Independent Workshop Rawalpindi','OEM Service Team'])[((i-1)%10)+1],
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i
JOIN (
  SELECT "Id", ROW_NUMBER() OVER (ORDER BY "CreatedAt","Id") AS rn FROM "Machineries"
) m ON m.rn = ((i-1)%100)+1;

-- ============================================================
-- 12. VEHICLES  (100 rows)
-- ============================================================
INSERT INTO "Vehicles"
  ("Id","RegistrationNumber","Make","Model","Year","DriverName","DriverContact",
   "PurchasePrice","PurchaseDate","Status","TotalMileage","NextMaintenanceDate","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  (ARRAY['LHR','KHI','ISB','RWP','FSD','MLT','PSH','QTA','SKT','GRW'])[((i-1)%10)+1]
    ||'-'||LPAD(i::text,3,'0')||'-'||LPAD((i*7%9999)::text,4,'0'),
  (ARRAY['Toyota','Suzuki','Honda','Isuzu','Hino',
         'FAW','Shacman','Sinotruk','Mitsubishi','Nissan'])[((i-1)%10)+1],
  (ARRAY['Hilux Revo','Cultus VXR','Civic Oriel','NPR 71PL','700P',
         'J6 Tractor Head','F3000 Dump Truck','HOWO 6x4','Pajero Sport',
         'Frontier Pickup'])[((i-1)%10)+1],
  (2018+(i%7)),
  (ARRAY['Muhammad Akram','Ghulam Mustafa','Allah Rakha','Lal Muhammad','Habib Ullah',
         'Sultan Mahmood','Bahadur Khan','Hamid Ali','Nisar Ahmed','Zafar Iqbal',
         'Mubarak Ali','Faiz Ahmad','Dilawar Khan','Maqsood Ahmed',
         'Gulzar Ahmad'])[((i-1)%15)+1],
  '030'||LPAD(((i*5729)%10000000)::text,7,'0'),
  (800000+(i%20)*150000)::numeric,
  ('2019-01-01'::timestamptz+(i*20||' days')::interval),
  CASE WHEN i%15=0 THEN 2 WHEN i%10=0 THEN 1 ELSE 0 END,
  (10000+i*500)::numeric,
  ('2026-08-01'::timestamptz+(i*5||' days')::interval),
  CASE WHEN i%8=0 THEN 'Dedicated site transport vehicle' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'2 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 13. VEHICLE MAINTENANCES  (100 rows)
-- ============================================================
INSERT INTO "VehicleMaintenances"
  ("Id","VehicleId","MaintenanceDate","Description","Cost","ServiceProvider",
   "NextDueDate","MileageAtService","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  v."Id",
  ('2025-01-01'::timestamptz+(i*3||' days')::interval),
  (ARRAY['Engine oil & filter change','Tire rotation and balancing',
         'Brake pad and rotor replacement','Battery replacement',
         'Air filter and cabin filter change','Radiator flush and coolant change',
         'Transmission fluid service','Wheel alignment and tracking',
         'AC gas recharge and service','Full periodic inspection'])[((i-1)%10)+1],
  (3000+(i%15)*5000)::numeric,
  (ARRAY['Toyota Authorized Workshop Lahore','Suzuki Service Center',
         'Honda Care Pakistan','Official Dealer Workshop Karachi',
         'Al-Rashid Auto Services','Pak Motors Rawalpindi',
         'National Auto Works','City Auto Center Lahore',
         'Express Auto Service','Mehran Auto Workshop'])[((i-1)%10)+1],
  ('2026-01-01'::timestamptz+(i*30||' days')::interval),
  (8000+i*300)::numeric,
  CASE WHEN i%6=0 THEN 'Parts replaced under warranty claim' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i
JOIN (
  SELECT "Id", ROW_NUMBER() OVER (ORDER BY "CreatedAt","Id") AS rn FROM "Vehicles"
) v ON v.rn = ((i-1)%100)+1;

-- ============================================================
-- 14. PLANTS  (100 rows)
-- ============================================================
INSERT INTO "Plants"
  ("Id","Name","Type","Manufacturer","SerialNumber","PurchaseDate","PurchasePrice",
   "CurrentValue","Status","Location","LastMaintenanceDate","NextMaintenanceDate","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  (ARRAY['Batching Plant','Asphalt Plant','Stone Crushing Plant','Concrete Block Machine',
         'Water Treatment Plant','Precast Yard Facility','Steel Fabrication Shop',
         'Carpenter Workshop','Fuel Storage System','Ready Mix Plant',
         'Sand Washing Plant','Hot Mix Plant','Aggregate Screening Unit',
         'Dewatering Plant','Soil Stabilization Unit','Mobile Batching Plant',
         'Containerized Concrete Plant','Central Mix Plant','Transit Mix Unit',
         'Portable Crusher'])[((i-1)%20)+1]||' #'||i,
  (ARRAY['Batching Plant','Asphalt Plant','Crusher','Block Machine',
         'Treatment Plant','Precast','Fabrication','Workshop',
         'Storage','Screening'])[((i-1)%10)+1],
  (ARRAY['Schwing Stetter','AMMANN Group','Metso Minerals','Besser Company',
         'SUEZ Treatment','Elematic Precast','Lincoln Electric','Siemens',
         'ABB Group','GE Industrial','Atlas Copco','Grundfos',
         'Caterpillar','JLG Industries','Terex Corporation'])[((i-1)%15)+1],
  'PLT-'||LPAD(i::text,4,'0')||'-'||LPAD((i*89%999)::text,3,'0'),
  ('2019-06-01'::timestamptz+(i*25||' days')::interval),
  (2000000+(i%20)*500000)::numeric,
  (1500000+(i%20)*400000)::numeric,
  CASE WHEN i%15=0 THEN 2 WHEN i%8=0 THEN 1 ELSE 0 END,
  (ARRAY['Site A - DHA Lahore','Site B - Bahria Town Lahore',
         'Main Workshop - Lahore','Site C - DHA Karachi',
         'Site D - F-7 Islamabad','Central Depot - Lahore',
         'Site E - New Multan','Site F - Faisalabad Industrial Zone',
         'Site G - Rawalpindi Cantt','Head Office Yard - Gulberg'])[((i-1)%10)+1],
  ('2025-01-01'::timestamptz+(i*10||' days')::interval),
  ('2026-07-01'::timestamptz+(i*15||' days')::interval),
  CASE WHEN i%5=0 THEN 'High-capacity unit - requires specialist maintenance team' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'2 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 15. INVENTORY ITEMS  (100 rows)
-- ============================================================
INSERT INTO "InventoryItems"
  ("Id","Name","Category","Unit","CurrentStock","LowStockThreshold",
   "UnitPrice","SupplierName","Location","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  (ARRAY['OPC Cement 53 Grade','PPC Cement Bag','Steel Bar 12mm TMT',
         'Steel Bar 16mm TMT','Steel Bar 20mm TMT','Red Clay Bricks',
         'Fine Sand','Coarse Sand','Gravel 20mm','Gravel 40mm',
         'Binding Wire 16 Gauge','Nails Assorted Box','Plywood Sheet 18mm',
         'Timber 3x4 inch','Timber 2x4 inch','GI Pipe 1 Inch',
         'PVC Pipe 4 Inch','Emulsion Paint White 20L','Weather Shield Paint',
         'Floor Tiles 60x60','Wall Tiles 30x45','Marble Sheet 18mm',
         'Granite Slab Polished','Float Glass 6mm','Waterproofing Chemical',
         'Bonding Agent SBR','Anti-Rust Paint Red Oxide','Epoxy Floor Coating',
         'Reinforcement Mesh A393','Safety Helmet Yellow',
         'High-Vis Safety Jacket','Safety Boots Steel Toe','Safety Gloves Cut5',
         'Full Face Shield','Caution Barrier Tape','CO2 Fire Extinguisher 5kg',
         'First Aid Kit Standard','Diesel Fuel (Liter)','Engine Lubricating Oil 20W50',
         'Hydraulic Oil 46','Industrial Grease MP2','Welding Electrodes E6013',
         'MIG Welding Wire 0.8mm','Angle Grinder Disc 4.5in','Cutting Disc 4.5in',
         'Scaffolding Pipe 48mm','Scaffolding Swivel Clamp','Scaffolding Plank 3m',
         'Chain Block 2 Ton','Wire Rope Sling 2m',
         'Water Hose 1 Inch 30m','Air Hose 3/8 Inch 20m',
         'Electrical Cable 4mm 2-Core','Electrical Cable 6mm 3-Core',
         'MCB 32A Single Pole','MCB 63A Double Pole','Main Distribution Board 12Way',
         'Copper Wire 2.5mm (Roll)','Switch & Socket Set','Conduit Pipe 20mm',
         'Electrical Conduit Fittings','Mixer Tap Bathroom','Ball Valve 1 Inch',
         'Gate Valve 2 Inch','Concealed Flush Valve','Toilet Suite Western',
         'Wall Hung Basin White','Acrylic Bathtub 5ft','Rain Shower Set Chrome',
         'Split AC 1.5 Ton Inverter','Split AC 2 Ton Inverter',
         '56-inch Ceiling Fan','Exhaust Fan 10 Inch',
         'Mortise Lock Set','Aluminum Window Handle','Piano Hinge 3 Inch',
         'Door Closer Hydraulic','Pop Rivet Aluminum 4mm','Nylon Rawl Plug Box',
         'Silicone Sealant Neutral','Expanding PU Foam',
         'Polythene Sheet 200 Micron','Damp Proof Course 1m',
         'XPS Thermal Insulation Board','Acoustic Foam Panels',
         'Corrugated Iron Sheet','PVC Roof Sheet','Ridge Cap GI',
         'Aluminum Rain Gutter','Cast Iron Manhole Cover','Storm Drain Grill',
         'Road Marking Paint Yellow','Traffic Cone 750mm',
         'Formwork Plywood 18mm','Shuttering Oil (Drum)',
         'Form Tie Rod 15mm','Wedge Bolt & Nut','Surveying Wooden Stakes',
         'Nylon String Line Roll','Steel Measuring Tape 50m',
         'Digital Spirit Level'])[((i-1)%100)+1],
  (ARRAY['Cement & Concrete','Steel & Reinforcement','Wood & Timber',
         'Aggregates & Sand','Plumbing & Sanitary','Electrical',
         'Tiles & Flooring','Safety Equipment','Fuel & Lubricants',
         'Welding Supplies','Scaffolding','Paint & Chemicals',
         'HVAC & Mechanical','Hardware & Fixings','Roofing'])[((i-1)%15)+1],
  (ARRAY['Bag','Ton','Meter','Piece','Bundle',
         'Liter','Square Meter','Cubic Meter','Kilogram','Set'])[((i-1)%10)+1],
  (50+(i%30)*20)::numeric,
  (10+(i%10)*5)::numeric,
  (500+(i%50)*1000)::numeric,
  (ARRAY['Saeed Ahmad & Sons','Pakistan Steel Mills Ltd','Punjab Hardware Store',
         'Lahore Cement Works','Al-Ameen Traders','Rehman Materials',
         'National Steel Corporation','Super Cement Pvt Ltd',
         'Faisalabad Electrical Wires','Karachi Steel Industries'])[((i-1)%10)+1],
  (ARRAY['Main Store - Head Office','Site A Store - DHA','Site B Store - Bahria',
         'Site C Store - Karachi','Workshop Store','Fuel Depot',
         'Chemical Store','Electrical Store','Safety Equipment Store',
         'General Store'])[((i-1)%10)+1],
  CASE WHEN i%10=0 THEN 'Critical item - maintain buffer stock at all times' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'2 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 16. STOCK TRANSACTIONS  (100 rows)
-- ============================================================
INSERT INTO "StockTransactions"
  ("Id","InventoryItemId","Type","Quantity","UnitPrice","Date",
   "Reference","ProjectName","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  inv."Id",
  (i%4),
  (5+(i%20)*3)::numeric,
  (500+(i%30)*500)::numeric,
  ('2025-06-01'::timestamptz+(i*3||' days')::interval),
  'TXN-2025-'||LPAD(i::text,4,'0'),
  (ARRAY['DHA Residential Phase-1','Commercial Tower Block-A','Bahria Town Villas Phase-2',
         'Industrial Unit-3 Faisalabad','Road Project KHI-LHR','Hospital Wing-B Extension',
         'Government Office Block','School Building Contract Multan',
         'Warehouse Project Lahore','Bridge Construction Project'])[((i-1)%10)+1],
  (ARRAY['Regular stock replenishment from supplier','Material issued to site team',
         'Stock adjustment after physical audit','Supplier delivery received and checked',
         'Material returned from site (surplus)','Damaged goods written off',
         'Transfer between site stores','Emergency procurement','Daily consumption record',
         'Physical count variance adjustment'])[((i-1)%10)+1],
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i
JOIN (
  SELECT "Id", ROW_NUMBER() OVER (ORDER BY "CreatedAt","Id") AS rn FROM "InventoryItems"
) inv ON inv.rn = ((i-1)%100)+1;

-- ============================================================
-- 17. TAX RECORDS  (100 rows)
-- ============================================================
INSERT INTO "TaxRecords"
  ("Id","TaxType","Amount","PeriodStart","PeriodEnd","DueDate","PaidDate",
   "IsPaid","Reference","Description","CreatedAt")
SELECT
  gen_random_uuid(),
  (i%5),
  (25000+(i%20)*50000)::numeric,
  ('2025-01-01'::timestamptz+(((i-1)/4)*30||' days')::interval),
  ('2025-01-31'::timestamptz+(((i-1)/4)*30||' days')::interval),
  ('2025-02-15'::timestamptz+(((i-1)/4)*30||' days')::interval),
  CASE WHEN i%3=0
    THEN ('2025-02-10'::timestamptz+(((i-1)/4)*30||' days')::interval)
    ELSE NULL END,
  (i%3=0),
  (ARRAY['STS-','ITX-','PRA-','WHT-','SDT-'])[(i%5)+1]||LPAD(i::text,5,'0'),
  (ARRAY['Monthly Sales Tax Return (SRB)','Quarterly Income Tax Payment',
         'PRA Sales Tax on Services Filing','Withholding Tax on Services Received',
         'Security Deposit Tax Deducted','Monthly STS Filing FBR',
         'Annual Income Tax Return','PRA Monthly Return Filing',
         'WHT on Contractor Payments 236C','Security Deposit Refund Claim'])[((i-1)%10)+1],
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 18. CHART OF ACCOUNTS  (100 rows)
-- ============================================================
INSERT INTO "ChartOfAccounts"
  ("Id","Code","Name","AccountType","ParentId","IsActive","Description","CreatedAt")
SELECT
  gen_random_uuid(),
  LPAD(i::text,4,'0'),
  (ARRAY[
    'Cash in Hand','Bank Account - HBL Main','Bank Account - MCB','Bank Account - UBL',
    'Petty Cash Fund','Accounts Receivable - Trade','Advance to Suppliers',
    'Security Deposits Paid','Retention Receivable','Prepaid Insurance',
    'Prepaid Rent & Deposits','Input Tax Receivable (GST)','Advance Income Tax',
    'Stock - Cement & Concrete','Stock - Steel & Rebar','Stock - Sand & Aggregates',
    'Stock - Electrical Materials','Stock - Plumbing Materials','Stock - Safety Equipment',
    'Stock - Miscellaneous','Work In Progress - DHA Project','Work In Progress - Bahria Project',
    'Work In Progress - Commercial Tower','Work In Progress - Industrial Unit',
    'Work In Progress - Road Project','Machinery & Equipment - Cost',
    'Accumulated Depreciation - Machinery','Vehicles - Cost',
    'Accumulated Depreciation - Vehicles','Plant & Equipment - Cost',
    'Accumulated Depreciation - Plant','Furniture & Fixtures','Office Equipment',
    'Computer & IT Equipment','Land & Building','Capital Work In Progress',
    'Accounts Payable - Trade','Advance from Customers','Retention Payable',
    'Security Deposits Received','WHT Payable 236C','Output Tax Payable (GST)',
    'Salary & Wages Payable','EOBI Contributions Payable','SESSI Payable',
    'Income Tax Payable','Provision for Taxation','Running Finance - HBL',
    'Short Term Bank Loan','Long Term Bank Loan','Bank Guarantee Payable',
    'Performance Bond Liability','Mobilization Advance Received',
    'Paid-up Capital','Share Premium','General Reserve',
    'Retained Earnings','Profit & Loss Account','Surplus on Revaluation',
    'Dividend Payable','Opening Balance Equity','Unappropriated Profit',
    'Contract Revenue - Residential','Contract Revenue - Commercial',
    'Contract Revenue - Industrial','Contract Revenue - Infrastructure',
    'Variation Order Income','Penalty Recovery','Retention Income Released',
    'Gain on Disposal of Assets','Interest Income','Miscellaneous Income',
    'Labour Wages Expense','Employee Salaries Expense','EOBI Employer Contribution',
    'Machinery Maintenance Expense','Vehicle Running Expense','Fuel & POL Expense',
    'Cement & Concrete Expense','Steel & Rebar Expense','Sand & Aggregate Expense',
    'Electrical Material Expense','Plumbing Material Expense','Safety Equipment Expense',
    'Subcontractor Expense','Plant Operating Expense','Site Overhead Expense',
    'Head Office Overhead','Depreciation - Machinery','Depreciation - Vehicles',
    'Depreciation - Plant & Equipment','Finance Charges & Interest',
    'Bank Charges & Commission','Audit & Legal Fees','Insurance Premium Expense',
    'Utilities Expense (Site)','Communication & Internet','Travel & Conveyance',
    'Entertainment & Hospitality','Miscellaneous Site Expense',
    'Bad Debt Expense','Provision for Doubtful Debts','Tax Expense - Current'
  ])[((i-1)%100)+1],
  (i%5),
  NULL,
  (i%10 != 0),
  CASE WHEN i%7=0 THEN 'Summary/Control account - do not post directly' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'2 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 19. JOURNAL ENTRIES  (100 rows)
-- ============================================================
INSERT INTO "JournalEntries"
  ("Id","EntryNumber","Date","Description","Reference","TotalDebit",
   "TotalCredit","IsPosted","Notes","CreatedAt")
SELECT
  gen_random_uuid(),
  'JV-2025-'||LPAD(i::text,4,'0'),
  ('2025-01-01'::timestamptz+(i*3||' days')::interval),
  (ARRAY['Cash received from customer - Running Bill',
         'Payment issued to material supplier',
         'Weekly labour wages disbursement',
         'Fuel and POL expense recorded',
         'Machinery maintenance cost voucher',
         'Monthly salary payment entry',
         'Cement and steel material purchase',
         'Progress billing - Running Bill',
         'Advance payment to subcontractor',
         'Tax payment recorded - WHT',
         'Monthly depreciation entry',
         'Bank loan receipt entry',
         'Petty cash reimbursement voucher',
         'Variation order billing raised',
         'Retention released by client',
         'Security deposit received',
         'Insurance premium paid',
         'Utility bills settlement',
         'Office expense payment voucher',
         'Bank charges and commission'])[((i-1)%20)+1],
  'REF-'||LPAD(i::text,4,'0'),
  (50000+(i%30)*25000)::numeric,
  (50000+(i%30)*25000)::numeric,
  (i%5 != 0),
  CASE WHEN i%8=0 THEN 'Approved by Finance Manager' ELSE NULL END,
  NOW()-((100-i)*INTERVAL'3 days')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 20. JOURNAL ENTRY LINES  (200 rows - 1 debit + 1 credit per entry)
-- ============================================================
WITH
  je AS (
    SELECT "Id","Description","TotalDebit",
           ROW_NUMBER() OVER (ORDER BY "EntryNumber") AS rn
    FROM "JournalEntries"
  ),
  ac AS (
    SELECT "Id",
           ROW_NUMBER() OVER (ORDER BY "Code") AS rn
    FROM "ChartOfAccounts"
  ),
  total_ac AS (SELECT COUNT(*)::int AS cnt FROM "ChartOfAccounts")
INSERT INTO "JournalEntryLines"
  ("Id","JournalEntryId","AccountId","Debit","Credit","Description")
SELECT gen_random_uuid(), je."Id", ac."Id", je."TotalDebit", 0,
       'Debit - '||je."Description"
FROM je
JOIN ac ON ac.rn = ((je.rn - 1) % (SELECT cnt FROM total_ac)) + 1
UNION ALL
SELECT gen_random_uuid(), je."Id", ac."Id", 0, je."TotalDebit",
       'Credit - '||je."Description"
FROM je
JOIN ac ON ac.rn = (je.rn % (SELECT cnt FROM total_ac)) + 1;

-- ============================================================
-- 21. NOTIFICATIONS  (100 rows)
-- ============================================================
INSERT INTO "Notifications"
  ("Id","Type","Title","Message","IsRead","UserId","EntityId","CreatedAt")
SELECT
  gen_random_uuid(),
  (i%6),
  (ARRAY['Salary Payment Due This Month',
         'Tax Filing Deadline Approaching',
         'Machinery Maintenance Scheduled',
         'Low Stock Alert - Critical Item',
         'Customer Payment Overdue',
         'System Notification',
         'Monthly Report Ready for Review',
         'Equipment Inspection Due',
         'Supplier Contract Expiring Soon',
         'Vehicle Service Overdue'])[((i-1)%10)+1],
  (ARRAY['Employee salary payment is due. Please initiate payroll processing for this month.',
         'Tax filing deadline is approaching. Submit STS/PRA returns to avoid penalties.',
         'Scheduled maintenance is due for a machinery unit. Contact the service provider.',
         'Stock level has fallen below minimum threshold. Please reorder immediately.',
         'Customer payment is pending for over 30 days. Immediate follow-up required.',
         'Planned system maintenance this weekend. Please save all work beforehand.',
         'Monthly financial report is ready and awaiting Finance Manager approval.',
         'Machinery inspection is due next week. Schedule with the certified service team.',
         'Supplier framework contract expires in 30 days. Initiate renewal process.',
         'Vehicle is overdue for its scheduled service. Book appointment with workshop.'])[((i-1)%10)+1],
  (i%3=0),
  NULL,
  NULL,
  NOW()-((100-i)*INTERVAL'1 day')
FROM generate_series(1,100) AS i;

-- ============================================================
-- 22. COMPANY SETTINGS  (1 row)
-- ============================================================
INSERT INTO "CompanySettings"
  ("Id","CompanyName","Address","Phone","Email","Website",
   "NTN","STRN","Currency","FinancialYearStart","UpdatedAt")
VALUES (
  gen_random_uuid(),
  'ConstructPro Engineering & Builders Pvt Ltd',
  'Office 401, Business Centre, 49-MM Alam Road, Gulberg III, Lahore 54660, Pakistan',
  '042-35761234',
  'info@constructpro.pk',
  'www.constructpro.pk',
  '4156789-2',
  'STRN-3210567',
  'PKR',
  '07-01',
  NOW()
);

-- ============================================================
-- DONE!  Total rows inserted (approximate):
--   Customers:              100
--   Suppliers:              100
--   Employees:              100
--   Incomes:                100
--   Expenses:               100
--   Labours:                100
--   LabourAttendances:      100
--   LabourAdvances:         100
--   SalaryPayments:         100
--   Machineries:            100
--   MachineryMaintenances:  100
--   Vehicles:               100
--   VehicleMaintenances:    100
--   Plants:                 100
--   InventoryItems:         100
--   StockTransactions:      100
--   TaxRecords:             100
--   ChartOfAccounts:        100
--   JournalEntries:         100
--   JournalEntryLines:      200  (2 per entry)
--   Notifications:          100
--   CompanySettings:          1
--                        -----
--   TOTAL:               2101 rows
-- ============================================================
