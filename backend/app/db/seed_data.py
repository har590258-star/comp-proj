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
                "employeeId": "EMP001",
                "name": "Rohit Sharma",
                "email": "rohit.sharma@adani.com",
                "phone": "9876543210",
                "designation": "Field Technician",
                "role": "technician",
                "assignedSiteId": "site_2949e4fc",
                "assignedSiteName": "Surat ST-1",
                "status": "Present"
            },
            {
                "id": "emp_002",
                "employeeId": "EMP002",
                "name": "Amit Kumar",
                "email": "amit.kumar@adani.com",
                "phone": "9876543211",
                "designation": "Field Technician",
                "role": "technician",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Present"
            },
            {
                "id": "emp_003",
                "employeeId": "EMP003",
                "name": "Sandeep Yadav",
                "email": "sandeep.yadav@adani.com",
                "phone": "9876543212",
                "designation": "Field Technician",
                "role": "technician",
                "assignedSiteId": "site_pune_2",
                "assignedSiteName": "Pune - Phase 2",
                "status": "Present"
            },
            {
                "id": "emp_004",
                "employeeId": "EMP004",
                "name": "Vikash Singh",
                "email": "vikash.singh@adani.com",
                "phone": "9876543213",
                "designation": "Field Technician",
                "role": "technician",
                "assignedSiteId": "site_pune_2",
                "assignedSiteName": "Pune - Phase 2",
                "status": "Absent"
            },
            {
                "id": "emp_005",
                "employeeId": "EMP005",
                "name": "Neha Patil",
                "email": "neha.patil@adani.com",
                "phone": "9876543214",
                "designation": "Supervisor",
                "role": "technician",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Present"
            },
            {
                "id": "emp_admin",
                "employeeId": "ADMIN01",
                "name": "Adani Operations Admin",
                "email": "admin@adani.com",
                "phone": "9800000000",
                "designation": "Project Operations Lead",
                "role": "admin",
                "assignedSiteId": "site_pune_1",
                "assignedSiteName": "Pune - Phase 1",
                "status": "Present"
            }
        ]

        for emp in employees_data:
            await employees_col.insert_one(emp)
            user_doc = {
                "id": f"usr_{emp['employeeId'].lower()}",
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
        # Ensure EMP001 is updated with Rohit Sharma and Surat ST-1
        await employees_col.update_one(
            {"employeeId": "EMP001"},
            {"$set": {"name": "Rohit Sharma", "assignedSiteId": "site_2949e4fc", "assignedSiteName": "Surat ST-1"}}
        )
        await users_col.update_one(
            {"employeeId": "EMP001"},
            {"$set": {"name": "Rohit Sharma", "assignedSiteId": "site_2949e4fc", "assignedSiteName": "Surat ST-1"}}
        )

    # 3. Settings
    if await settings_col.count_documents({}) == 0:
        await settings_col.insert_one({
            "id": "app_settings",
            "settings": {
                "attendanceRadiusMeters": 500,
                "shiftStartTime": "09:00",
                "shiftEndTime": "18:00",
                "gracePeriodMinutes": 15,
                "enableGeofenceEnforcement": True,
                "requireDeviceGPS": True,
                "offlineModeAllowed": True,
                "antiSpoofingProtection": True,
                "systemAlertsActive": True,
                "autoCheckoutAtMidnight": True
            }
        })
