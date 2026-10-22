import asyncio
from datetime import datetime, date, timedelta
from app.db.mongodb import get_collection
from app.core.security import hash_password

async def seed_initial_data():
    """Seeds database with default users, sites, employees, attendance and settings."""
    users_col = get_collection("users")
    employees_col = get_collection("employees")
    sites_col = get_collection("sites")
    attendance_col = get_collection("attendance")
    settings_col = get_collection("settings")
    locations_col = get_collection("locations")

    # 1. Sites
    if await sites_col.count_documents({}) == 0:
        sites_data = [
            {
                "id": "site_2949e4fc",
                "name": "Surat ST-1",
                "code": "ADN-SITE-010",
                "address": "Adajan, Surat, Gujarat",
                "latitude": 21.1926,
                "longitude": 72.7997,
                "manager": "Dhaval Patel",
                "workingHours": "09:00 AM - 06:00 PM",
                "attendanceRadius": 500.0,
                "status": "Active",
                "imageUrl": "/assets/site_photo.jpg"
            },
            {
                "id": "site_pune_1",
                "name": "Pune - Phase 1",
                "code": "ADN-PS-001",
                "address": "Hinjewadi, Pune, Maharashtra",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "manager": "Suresh Patil",
                "workingHours": "09:00 AM - 06:00 PM",
                "attendanceRadius": 500.0,
                "status": "Active",
                "imageUrl": "/assets/site_photo.jpg"
            },
            {
                "id": "site_pune_2",
                "name": "Pune - Phase 2",
                "code": "ADN-PS-002",
                "address": "Baner, Pune, Maharashtra",
                "latitude": 18.5590,
                "longitude": 73.7868,
                "manager": "Rajesh Deshmukh",
                "workingHours": "09:00 AM - 06:00 PM",
                "attendanceRadius": 600.0,
                "status": "Active",
                "imageUrl": "/assets/site_photo.jpg"
            },
            {
                "id": "site_mumbai_1",
                "name": "Mumbai - Central Hub",
                "code": "ADN-MH-001",
                "address": "Bandra Kurla Complex, Mumbai, Maharashtra",
                "latitude": 19.0657,
                "longitude": 72.8687,
                "manager": "Ramesh Kulkarni",
                "workingHours": "09:00 AM - 06:00 PM",
                "attendanceRadius": 500.0,
                "status": "Active",
                "imageUrl": "/assets/site_photo.jpg"
            },
            {
                "id": "site_7033e340",
                "name": "Ahmedabad - Solar Phase 1",
                "code": "ADN-AHM-001",
                "address": "SG Highway, Ahmedabad, Gujarat",
                "latitude": 23.0225,
                "longitude": 72.5714,
                "manager": "Nilesh Shah",
                "workingHours": "09:00 AM - 06:00 PM",
                "attendanceRadius": 500.0,
                "status": "Active",
                "imageUrl": "/assets/site_photo.jpg"
            }
        ]
        for s in sites_data:
            await sites_col.insert_one(s)

    # 2. Employees & Users
    if await employees_col.count_documents({}) == 0:
        employees_data = [
            {
                "id": "emp_001",
                "employeeId": "b4S/Adani/01",
                "name": "Rohit Sharma",
                "email": "rohit.sharma@adani.com",
                "phone": "9876543210",
                "designation": "Junior Engineer",
                "circle": "Gujarat Circle",
                "division": "Surat Division",
                "role": "technician",
                "assignedSiteId": "site_2949e4fc",
                "assignedSiteName": "Surat ST-1",
                "status": "Present"
            },
            {
                "id": "emp_002",
                "employeeId": "b4S/Adani/02",
                "name": "Amit Kumar",
                "email": "amit.kumar@adani.com",
                "phone": "9876543211",
                "designation": "Junior Engineer",
                "circle": "Prc",
                "division": "Pune Division",
                "role": "technician",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Present"
            },
            {
                "id": "emp_003",
                "employeeId": "b4S/Adani/03",
                "name": "Sandeep Yadav",
                "email": "sandeep.yadav@adani.com",
                "phone": "9876543212",
                "designation": "Junior Engineer",
                "circle": "Rastapeth",
                "division": "Bundgarden",
                "role": "technician",
                "assignedSiteId": "site_pune_2",
                "assignedSiteName": "Pune - Phase 2",
                "status": "Present"
            },
            {
                "id": "emp_004",
                "employeeId": "b4S/Adani/04",
                "name": "Vikash Singh",
                "email": "vikash.singh@adani.com",
                "phone": "9876543213",
                "designation": "Junior Engineer",
                "circle": "Rastapeth",
                "division": "Padmavati Division",
                "role": "technician",
                "assignedSiteId": "site_pune_2",
                "assignedSiteName": "Pune - Phase 2",
                "status": "Absent"
            },
            {
                "id": "emp_005",
                "employeeId": "b4S/Adani/05",
                "name": "Neha Patil",
                "email": "neha.patil@adani.com",
                "phone": "9876543214",
                "designation": "Division Head",
                "circle": "Prc",
                "division": "Office",
                "role": "technician",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Present"
            },
            {
                "id": "emp_supervisor",
                "employeeId": "SUPER01",
                "name": "Suresh Patil",
                "email": "suresh.patil@adani.com",
                "phone": "9822012345",
                "designation": "Area Operations Supervisor",
                "circle": "Maharashtra Circle",
                "division": "Pune Division",
                "role": "supervisor",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "assignedSiteIds": ["site_pune_1", "site_pune_2"],
                "assignedSiteNames": ["Pune - Phase 1", "Pune - Phase 2"],
                "status": "Present"
            },
            {
                "id": "emp_admin",
                "employeeId": "ADMIN01",
                "name": "Adani Operations Admin",
                "email": "admin@adani.com",
                "phone": "9800000000",
                "designation": "Project Operations Lead",
                "circle": "Prc",
                "division": "Office",
                "role": "admin",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Present"
            }
        ]

        for emp in employees_data:
            await employees_col.insert_one(emp)
            user_doc = {
                "id": f"usr_{emp['employeeId'].replace('/', '_').lower()}",
                "username": emp["employeeId"],
                "password": hash_password("adani123" if emp["role"] != "admin" else "admin123"),
                "name": emp["name"],
                "email": emp["email"],
                "phone": emp["phone"],
                "role": emp["role"],
                "employeeId": emp["employeeId"],
                "assignedSiteId": emp["assignedSiteId"],
                "assignedSiteName": emp["assignedSiteName"],
                "status": emp["status"]
            }
            await users_col.insert_one(user_doc)
    else:
        # Preserve b4S/Adani/01 name without overwriting multi-site assignments
        emp_existing = await employees_col.find_one({"employeeId": "b4S/Adani/01"})
        if emp_existing:
            assigned_ids = emp_existing.get("assignedSiteIds") or []
            assigned_names = emp_existing.get("assignedSiteNames") or []
            update_data = {"name": "Rohit Sharma"}
            if assigned_ids and not emp_existing.get("assignedSiteId"):
                update_data["assignedSiteId"] = assigned_ids[0]
                if assigned_names:
                    update_data["assignedSiteName"] = assigned_names[0]
            await employees_col.update_one({"employeeId": "b4S/Adani/01"}, {"$set": update_data})
            await users_col.update_one({"employeeId": "b4S/Adani/01"}, {"$set": update_data})

        # Ensure SUPER01 supervisor exists
        super_existing = await employees_col.find_one({"employeeId": "SUPER01"})
        if not super_existing:
            super_doc = {
                "id": "emp_supervisor",
                "employeeId": "SUPER01",
                "name": "Suresh Patil",
                "email": "suresh.patil@adani.com",
                "phone": "9822012345",
                "designation": "Area Operations Supervisor",
                "circle": "Maharashtra Circle",
                "division": "Pune Division",
                "role": "supervisor",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "assignedSiteIds": ["site_pune_1", "site_pune_2"],
                "assignedSiteNames": ["Pune - Phase 1", "Pune - Phase 2"],
                "status": "Present"
            }
            await employees_col.insert_one(super_doc)
            user_super = {
                "id": "usr_super01",
                "username": "SUPER01",
                "password": hash_password("supervisor123"),
                "name": "Suresh Patil",
                "email": "suresh.patil@adani.com",
                "phone": "9822012345",
                "designation": "Area Operations Supervisor",
                "role": "supervisor",
                "employeeId": "SUPER01",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "assignedSiteIds": ["site_pune_1", "site_pune_2"],
                "assignedSiteNames": ["Pune - Phase 1", "Pune - Phase 2"],
                "status": "Present"
            }
            await users_col.insert_one(user_super)

    # 3. Settings
    if await settings_col.count_documents({}) == 0:
        await settings_col.insert_one({
            "id": "app_settings",
            "settings": {
                "attendanceRadiusMeters": 500,
                "shiftStartTime": "09:00",
                "shiftEndTime": "18:00",
                "workingHoursStart": "09:00 AM",
                "workingHoursEnd": "06:00 PM",
                "enforceShiftTimingRules": True,
                "allowNightAndOvertimeShifts": False,
                "allowMultipleCheckIns": False,
                "gracePeriodMinutes": 15,
                "enableGeofenceEnforcement": True,
                "requireDeviceGPS": True,
                "offlineModeAllowed": True,
                "antiSpoofingProtection": True,
                "systemAlertsActive": True,
                "autoCheckoutAtMidnight": True
            }
        })
