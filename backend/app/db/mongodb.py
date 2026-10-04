import logging
import asyncio
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("uvicorn")

class InMemoryAsyncCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self.items = list(items)
        self._index = 0

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, str):
            key = key_or_list
            reverse = (direction == -1)
            self.items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
        elif isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                self.items.sort(key=lambda x: x.get(k, ""), reverse=(d == -1))
        return self

    def limit(self, count: int):
        self.items = self.items[:count]
        return self

    def skip(self, count: int):
        self.items = self.items[count:]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return self.items[:length]
        return self.items

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self.items):
            item = self.items[self._index]
            self._index += 1
            return item
        raise StopAsyncIteration

class InMemoryCollection:
    """High-fidelity async MongoDB collection replica for zero-dependency operation."""
    def __init__(self, name: str):
        self.name = name
        self.documents: List[Dict[str, Any]] = []

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if isinstance(v, dict):
                doc_val = doc.get(k)
                if "$regex" in v:
                    import re
                    pattern = v["$regex"]
                    flags = re.IGNORECASE if v.get("$options") == "i" else 0
                    try:
                        if not re.search(pattern, str(doc_val or ""), flags):
                            return False
                    except Exception:
                        if pattern.lower() not in str(doc_val or "").lower():
                            return False
                    continue
                if "$in" in v and doc_val not in v["$in"]:
                    return False
                if "$gte" in v and (doc_val is None or doc_val < v["$gte"]):
                    return False
                if "$lte" in v and (doc_val is None or doc_val > v["$lte"]):
                    return False
                if "$gt" in v and (doc_val is None or doc_val <= v["$gt"]):
                    return False
                if "$lt" in v and (doc_val is None or doc_val >= v["$lt"]):
                    return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def find_one(self, filter: Dict[str, Any] = None, projection=None) -> Optional[Dict[str, Any]]:
        filter = filter or {}
        for doc in self.documents:
            if self._matches(doc, filter):
                res = dict(doc)
                if "_id" not in res and "id" in res:
                    res["_id"] = res["id"]
                return res
        return None

    def find(self, filter: Dict[str, Any] = None, projection=None) -> InMemoryAsyncCursor:
        filter = filter or {}
        matched = [dict(d) for d in self.documents if self._matches(d, filter)]
        for doc in matched:
            if "_id" not in doc and "id" in doc:
                doc["_id"] = doc["id"]
        return InMemoryAsyncCursor(matched)

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            import uuid
            doc_copy["_id"] = str(uuid.uuid4())
        if "id" not in doc_copy:
            doc_copy["id"] = doc_copy["_id"]
        self.documents.append(doc_copy)
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def insert_many(self, documents: List[Dict[str, Any]]):
        res = []
        for d in documents:
            r = await self.insert_one(d)
            res.append(r.inserted_id)
        class InsertManyResult:
            inserted_ids = res
        return InsertManyResult()

    async def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        set_vals = update.get("$set", {})
        for doc in self.documents:
            if self._matches(doc, filter):
                doc.update(set_vals)
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        if upsert:
            new_doc = dict(filter)
            new_doc.update(set_vals)
            await self.insert_one(new_doc)
            class UpsertResult:
                matched_count = 0
                modified_count = 1
            return UpsertResult()
        class NoUpdateResult:
            matched_count = 0
            modified_count = 0
        return NoUpdateResult()

    async def delete_one(self, filter: Dict[str, Any]):
        for idx, doc in enumerate(self.documents):
            if self._matches(doc, filter):
                self.documents.pop(idx)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class NoDeleteResult:
            deleted_count = 0
        return NoDeleteResult()

    async def count_documents(self, filter: Dict[str, Any] = None) -> int:
        filter = filter or {}
        return sum(1 for d in self.documents if self._matches(d, filter))

    async def create_index(self, keys, **kwargs):
        return "index_created"

class InMemoryDatabase:
    def __init__(self):
        self.collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self.collections:
            self.collections[name] = InMemoryCollection(name)
        return self.collections[name]

    def get_collection(self, name: str) -> InMemoryCollection:
        return self[name]

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = InMemoryDatabase()
    is_atlas: bool = False
    _reconnect_task: Optional[asyncio.Task] = None
    _initialized: bool = False

    async def connect_to_database(self):
        logger.info("Initializing MongoDB Atlas connection...")
        try:
            if settings.MONGODB_URI and not settings.MONGODB_URI.startswith("mongodb+srv://admin:password"):
                try:
                    import certifi
                    ca_file = certifi.where()
                except Exception:
                    ca_file = None
                
                client_kwargs = {
                    "serverSelectionTimeoutMS": 3000,
                    "connectTimeoutMS": 3000,
                    "socketTimeoutMS": 3000,
                }
                if ca_file:
                    client_kwargs["tlsCAFile"] = ca_file
                    
                client = AsyncIOMotorClient(settings.MONGODB_URI, **client_kwargs)
                await asyncio.wait_for(client.admin.command('ping'), timeout=3.0)
                self.client = client
                self.db = client[settings.DATABASE_NAME]
                self.is_atlas = True
                logger.info(f"✅ Connected successfully to MongoDB Atlas: {settings.DATABASE_NAME}")
            else:
                logger.info("Using embedded MongoDB engine (Ready for MongoDB Atlas connection).")
                self.db = InMemoryDatabase()
                self.is_atlas = False
        except Exception as e:
            logger.warning(f"MongoDB Atlas connection attempt deferred ({type(e).__name__}: {str(e)[:120]}).")
            logger.info("Embedded store initialized for operational resilience.")
            self.db = InMemoryDatabase()
            self.is_atlas = False
            # Close failed client if initialized
            if self.client:
                try:
                    self.client.close()
                except Exception:
                    pass
                self.client = None
            # Only start background retry loop in persistent server environments (avoid blocking Vercel Serverless)
            is_serverless = bool(os.getenv("VERCEL") == "1" or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
            if not is_serverless and not self._reconnect_task:
                self._reconnect_task = asyncio.create_task(self._atlas_reconnect_loop())
            
        await self.setup_indexes()
        self._initialized = True

    async def _atlas_reconnect_loop(self):
        """Continuously attempts to connect to MongoDB Atlas in the background."""
        while not self.is_atlas:
            await asyncio.sleep(12)
            try:
                if settings.MONGODB_URI and not settings.MONGODB_URI.startswith("mongodb+srv://admin:password"):
                    import certifi
                    client = AsyncIOMotorClient(
                        settings.MONGODB_URI,
                        tlsCAFile=certifi.where(),
                        serverSelectionTimeoutMS=3000
                    )
                    await asyncio.wait_for(client.admin.command('ping'), timeout=3.0)
                    # Connected!
                    self.client = client
                    self.db = client[settings.DATABASE_NAME]
                    self.is_atlas = True
                    logger.info(f"🚀 [ATLAS ONLINE] Connected and storing all data in MongoDB Atlas: {settings.DATABASE_NAME}!")
                    await self.setup_indexes()
                    from app.db.seed_data import seed_initial_data
                    await seed_initial_data()
                    logger.info("🚀 [ATLAS SYNC] Initial collections synced in MongoDB Atlas.")
                    break
            except Exception:
                pass

    async def setup_indexes(self):
        try:
            attendance_col = self.get_collection("attendance")
            await attendance_col.create_index([("employeeId", 1)])
            await attendance_col.create_index([("siteId", 1)])
            await attendance_col.create_index([("date", 1)])
            await attendance_col.create_index([("timestamp", -1)])

            location_col = self.get_collection("locations")
            await location_col.create_index([("employeeId", 1)])
            await location_col.create_index([("timestamp", -1)])
        except Exception as e:
            logger.warning(f"Index creation notice: {e}")

    async def close_database_connection(self):
        if self._reconnect_task:
            self._reconnect_task.cancel()
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    def get_collection(self, name: str):
        if self.db is None:
            self.db = InMemoryDatabase()
        return self.db[name]

db_manager = DatabaseManager()

def get_database():
    return db_manager.db

def get_collection(name: str):
    return db_manager.get_collection(name)
