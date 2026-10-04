import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.mongodb import db_manager
from app.db.seed_data import seed_initial_data

from app.routes.auth import router as auth_router
from app.routes.employees import router as employees_router
from app.routes.sites import router as sites_router
from app.routes.attendance import router as attendance_router
from app.routes.locations import router as locations_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reports import router as reports_router
from app.routes.settings import router as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and seed
    logger.info("Starting up GPS Based Attendance & Tracking Application backend...")
    await db_manager.connect_to_database()
    await seed_initial_data()
    logger.info("Database initialized and initial seed completed.")
    yield
    # Shutdown
    await db_manager.close_database_connection()
    logger.info("Application shutdown completed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise REST API for GPS Based Attendance & Tracking Application - Adani Smart Meter Project",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure database is initialized even on serverless cold starts
@app.middleware("http")
async def ensure_db_initialized(request: Request, call_next):
    if not db_manager._initialized:
        await db_manager.connect_to_database()
        try:
            await seed_initial_data()
        except Exception as e:
            logger.warning(f"Initial seed notice: {e}")
    response = await call_next(request)
    return response

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again or contact operations support."}
    )

# Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(employees_router, prefix=api_v1)
app.include_router(sites_router, prefix=api_v1)
app.include_router(attendance_router, prefix=api_v1)
app.include_router(locations_router, prefix=api_v1)
app.include_router(dashboard_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)
app.include_router(settings_router, prefix=api_v1)

@app.get("/")
@app.get("/api")
@app.get(f"{api_v1}/")
async def root():
    return {
        "status": "online",
        "service": "Adani Smart Meter Tracking API",
        "version": "1.0.0",
        "database": "Atlas" if db_manager.is_atlas else "Operational",
        "docs": "/docs"
    }

@app.get("/health")
@app.get(f"{api_v1}/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Adani Smart Meter Tracking API",
        "version": "1.0.0",
        "database": "Atlas" if db_manager.is_atlas else "Operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
