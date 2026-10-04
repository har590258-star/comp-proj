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

    # Check if already seeded
    existing_users = await users_col.count_documents({})
    if existing_users > 0:
        return

    # 1. Sites
    sites_data = [
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
        }
    ]
    for s in sites_data:
        await sites_col.insert_one(s)

    # 2. Employees & Users
    employees_data = [
        {
            "id": "emp_001",
            "employeeId": "EMP001",
            "name": "Rahul Sharma",
            "email": "rahul.sharma@adani.com",
            "phone": "9876543210",
            "designation": "Field Technician",
            "role": "technician",
            "assignedSiteId": "site_pune_1",
            "assignedSiteName": "Pune - Phase 1",
            "status": "Active"
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
            "status": "Active"
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
            "status": "Active"
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
            "status": "Active"
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
            "status": "Active"
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
            "status": "Active"
        }
    ]

    default_hashed_pw = hash_password("adani123")
    for emp in employees_data:
        await employees_col.insert_one(emp)
        user_record = {
            "id": f"usr_{emp['employeeId'].lower()}",
            "username": emp["employeeId"],
            "password": default_hashed_pw,
            "name": emp["name"],
            "email": emp["email"],
            "phone": emp["phone"],
            "role": emp["role"],
            "designation": emp.get("designation", "Field Technician"),
            "employeeId": emp["employeeId"],
            "assignedSiteId": emp["assignedSiteId"],
            "assignedSiteName": emp["assignedSiteName"],
            "status": emp["status"]
        }
        await users_col.insert_one(user_record)

    # 3. Settings
    await settings_col.insert_one({
        "id": "app_settings",
        "settings": {
            "attendanceRadiusMeters": 500.0,
            "workingHoursStart": "09:00 AM",
            "workingHoursEnd": "06:00 PM",
            "lateThresholdMinutes": 15,
            "requireGps": True,
            "allowMultipleCheckIns": False,
            "autoCheckOutEnabled": False,
            "autoCheckOutTime": "19:00",
            "companyName": "Adani Energy Solutions",
            "projectName": "Adani Smart Meter Project"
        },
        "updatedAt": datetime.utcnow().isoformat(),
        "updatedBy": "ADMIN01"
    })
    # Attendance and Location collections start empty for real-world operations.
    # Shifts and GPS breadcrumbs are created dynamically when real check-ins occur.
    return
