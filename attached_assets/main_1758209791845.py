from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import re
import shutil
import subprocess
import signal
from datetime import datetime
import random
from typing import Optional

app = FastAPI(title="Netflix Clone API", version="1.0.0")
# Track running game processes by name
running_games: Dict[str, int] = {}

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
"""Serve built React static assets under /assets if present (ReactRecreation build)."""
try:
    SPA_DIR_OVERRIDE = os.path.join(os.getcwd(), "ReactRecreation", "ReactRecreation", "dist", "public")
    SPA_ASSETS = os.path.join(SPA_DIR_OVERRIDE, "assets")
    if os.path.isdir(SPA_ASSETS):
        app.mount("/assets", StaticFiles(directory=SPA_ASSETS), name="spa_assets")
except Exception:
    pass

# Templates no longer used (legacy removed), but keep for safety if needed
templates = Jinja2Templates(directory="templates")

# React build directory (uploaded project)
SPA_DIR = os.path.join(os.getcwd(), "ReactRecreation", "ReactRecreation", "dist", "public")
SPA_INDEX = os.path.join(SPA_DIR, "index.html")
SPA_VITE_SVG = os.path.join(SPA_DIR, "vite.svg")

# --------------------
# Search API
# --------------------
def normalize_text(text: str) -> str:
    return (text or "").strip().lower()

def index_items_for_search():
    items = []
    # Movies
    for m in movies_db:
        items.append({
            "type": "movie",
            "id": m.get("id"),
            "title": m.get("title"),
            "description": m.get("description"),
            "year": m.get("year"),
            "category": m.get("category")
        })
    # Videos and songs are represented in frontend_videos
    for v in frontend_videos:
        vdict = v.dict() if hasattr(v, "dict") else dict(v)
        item_type = "song" if (vdict.get("category") or "").lower() == "audio" else "video"
        items.append({
            "type": item_type,
            "id": vdict.get("id"),
            "title": vdict.get("title"),
            "description": vdict.get("description") or "",
            "category": vdict.get("category")
        })
    return items

def score_match(item: dict, q: str) -> int:
    score = 0
    title = normalize_text(item.get("title", ""))
    desc = normalize_text(item.get("description", ""))
    if q in title:
        score += 10
    if q in desc:
        score += 5
    return score

@app.get("/api/search")
async def search(query: Optional[str] = None, category: Optional[str] = None, limit: int = 20):
    """Unified search across movies, videos, and songs.
    - query: text to search
    - category: optional filter (movie|video|song|yoga|meditation etc.)
    """
    q = normalize_text(query or "")
    if not q:
        return {"results": []}
    items = index_items_for_search()
    results = []
    for it in items:
        if category and normalize_text(category) not in [normalize_text(it.get("type")), normalize_text(it.get("category", ""))]:
            continue
        s = score_match(it, q)
        if s > 0:
            it_copy = dict(it)
            it_copy["score"] = s
            results.append(it_copy)
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"results": results[:max(1, min(limit, 50))]}

# Pydantic models
class Movie(BaseModel):
    id: int
    title: str
    description: str
    genre: str
    year: int
    rating: float
    poster_url: str
    backdrop_url: str
    cast: List[str]
    director: str
    duration: str

class RecreationVideo(BaseModel):
    id: int
    title: str
    description: str
    category: str
    duration: str
    thumbnail: str
    video_file: str
    created_at: str
    user_id: Optional[str] = None

class MovieCreate(BaseModel):
    title: str
    description: str
    genre: str
    year: int
    rating: float
    poster_url: str
    backdrop_url: str
    cast: List[str]
    director: str
    duration: str

# Coin System Models
class User(BaseModel):
    id: str
    username: str
    email: str
    coins: int = 0
    level: int = 1
    experience: int = 0
    streak_days: int = 0
    last_activity: str
    achievements: List[str] = []
    created_at: str

class CoinTransaction(BaseModel):
    id: str
    user_id: str
    amount: int
    transaction_type: str  # "earn", "spend", "bonus"
    source: str  # "video", "song", "recreation", "daily", "achievement"
    source_id: Optional[str] = None
    description: str
    timestamp: str

class Reward(BaseModel):
    id: str
    name: str
    description: str
    cost: int
    category: str  # "premium_content", "customization", "physical", "digital"
    type: str  # "video", "theme", "badge", "product"
    data: dict  # Additional data like video_id, theme_data, etc.
    is_available: bool = True
    created_at: str

class UserReward(BaseModel):
    id: str
    user_id: str
    reward_id: str
    redeemed_at: str
    is_used: bool = False

# In-memory database (replace with real database in production)
movies_db = []
recreation_videos_db = []

# Simple video catalog for ReactRecreation frontend
class FrontendVideo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    duration: str
    poster_url: Optional[str] = None
    video_url: Optional[str] = None
    created_at: str

frontend_videos: List[FrontendVideo] = []

# Coin System Database
users_db = []
coin_transactions_db = []
rewards_db = []
user_rewards_db = []

# Initialize default user
default_user = {
    "id": "user_123",
    "username": "WellnessUser",
    "email": "user@wellness.com",
    "coins": 5,  # Starting coins
    "level": 1,
    "experience": 0,
    "streak_days": 0,
    "last_activity": datetime.now().isoformat(),
    "achievements": [],
    "created_at": datetime.now().isoformat()
}
users_db.append(default_user)

# Initialize rewards catalog
default_rewards = [
    {
        "id": "reward_001",
        "name": "Premium Meditation Pack",
        "description": "Unlock 5 exclusive guided meditation sessions",
        "cost": 10,  # 5 videos = 10 coins
        "category": "premium_content",
        "type": "video",
        "data": {"video_ids": ["premium_med_1", "premium_med_2", "premium_med_3", "premium_med_4", "premium_med_5"]},
        "is_available": True,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "reward_002",
        "name": "Dark Theme Unlock",
        "description": "Unlock beautiful dark theme for the app",
        "cost": 6,  # 3 videos = 6 coins
        "category": "customization",
        "type": "theme",
        "data": {"theme_name": "dark_premium", "colors": {"primary": "#1a1a1a", "accent": "#e50914"}},
        "is_available": True,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "reward_003",
        "name": "Zen Master Badge",
        "description": "Show off your meditation mastery with this exclusive badge",
        "cost": 15,  # 7-8 videos = 15 coins
        "category": "digital",
        "type": "badge",
        "data": {"badge_name": "zen_master", "icon": "🧘", "rarity": "rare"},
        "is_available": True,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "reward_004",
        "name": "Wellness Journal Download",
        "description": "Download our premium wellness journal template",
        "cost": 8,  # 4 videos = 8 coins
        "category": "digital",
        "type": "download",
        "data": {"file_type": "pdf", "file_name": "wellness_journal.pdf"},
        "is_available": True,
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "reward_005",
        "name": "Yoga Mat (Physical)",
        "description": "Redeem for a premium yoga mat (shipping required)",
        "cost": 50,  # 25 videos = 50 coins
        "category": "physical",
        "type": "product",
        "data": {"product_name": "Premium Yoga Mat", "requires_shipping": True},
        "is_available": True,
        "created_at": datetime.now().isoformat()
    }
]
rewards_db.extend(default_rewards)

# Create directories for recreation videos
os.makedirs("static/recreation/videos", exist_ok=True)
os.makedirs("static/recreation/thumbnails", exist_ok=True)

# Sample movie data
sample_movies = [
    {
        "id": 1,
        "title": "Stranger Things",
        "description": "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
        "genre": "Sci-Fi, Horror",
        "year": 2016,
        "rating": 8.7,
        "poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
        "cast": ["Millie Bobby Brown", "Finn Wolfhard", "Gaten Matarazzo"],
        "director": "The Duffer Brothers",
        "duration": "50 min",
        "category": "trending"
    },
    {
        "id": 2,
        "title": "The Crown",
        "description": "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the 20th century.",
        "genre": "Drama, Biography",
        "year": 2016,
        "rating": 8.6,
        "poster_url": "https://image.tmdb.org/t/p/w500/1M876Kj8Vfz7T8sSfGB0m4qFb61.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/1M876Kj8Vfz7T8sSfGB0m4qFb61.jpg",
        "cast": ["Claire Foy", "Matt Smith", "Tobias Menzies"],
        "director": "Peter Morgan",
        "duration": "60 min",
        "category": "trending"
    },
    {
        "id": 3,
        "title": "Money Heist",
        "description": "An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history - stealing 2.4 billion euros from the Royal Mint of Spain.",
        "genre": "Crime, Thriller",
        "year": 2017,
        "rating": 8.3,
        "poster_url": "https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
        "cast": ["Úrsula Corberó", "Álvaro Morte", "Itziar Ituño"],
        "director": "Álex Pina",
        "duration": "70 min",
        "category": "trending"
    },
    {
        "id": 4,
        "title": "The Witcher",
        "description": "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.",
        "genre": "Fantasy, Action",
        "year": 2019,
        "rating": 8.2,
        "poster_url": "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
        "cast": ["Henry Cavill", "Anya Chalotra", "Freya Allan"],
        "director": "Lauren Schmidt Hissrich",
        "duration": "60 min",
        "category": "action"
    },
    {
        "id": 5,
        "title": "Ozark",
        "description": "A financial advisor drags his family from Chicago to the Missouri Ozarks, where he must launder money to appease a Mexican cartel.",
        "genre": "Crime, Drama",
        "year": 2017,
        "rating": 8.1,
        "poster_url": "https://image.tmdb.org/t/p/w500/miqV0Lc8oH6g4v0Y4R3qZ1uYtI8.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/miqV0Lc8oH6g4v0Y4R3qZ1uYtI8.jpg",
        "cast": ["Jason Bateman", "Laura Linney", "Julia Garner"],
        "director": "Bill Dubuque",
        "duration": "60 min",
        "category": "drama"
    },
    {
        "id": 6,
        "title": "Dark",
        "description": "A family saga with a supernatural twist, set in a German town, where the disappearance of two young children exposes the relationships among four families.",
        "genre": "Sci-Fi, Thriller",
        "year": 2017,
        "rating": 8.7,
        "poster_url": "https://image.tmdb.org/t/p/w500/5Vz8VhJ8VhJ8VhJ8VhJ8VhJ8VhJ8.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/5Vz8VhJ8VhJ8VhJ8VhJ8VhJ8VhJ8.jpg",
        "cast": ["Louis Hofmann", "Karoline Eichhorn", "Lisa Vicari"],
        "director": "Baran bo Odar",
        "duration": "50 min",
        "category": "sci-fi"
    }
]

# Initialize database with sample data
movies_db = sample_movies.copy()

# Seed simple frontend videos list from sample movies so React UI has data
if not frontend_videos:
    for m in movies_db:
        frontend_videos.append(FrontendVideo(
            id=str(m["id"]),
            title=m["title"],
            description=m["description"],
            category=(m.get("category") or "General").title(),
            duration=m.get("duration") or "",
            poster_url=m.get("poster_url"),
            video_url=None,
            created_at=datetime.now().isoformat()
        ))
    
    # Add some audio content for the React app
    frontend_videos.extend([
        FrontendVideo(
            id="audio_1",
            title="Healing Meditation",
            description="Relaxing sounds for meditation and stress relief.",
            category="Audio",
            duration="5:00",
            poster_url="/static/images/song_thumbnails/healing_meditation_thumb.jpg",
            video_url="/static/songs/432hz-healing-meditation-396482.mp3",
            created_at=datetime.now().isoformat()
        ),
        FrontendVideo(
            id="audio_2",
            title="Nature Sounds",
            description="Soothing nature sounds for sleep and relaxation.",
            category="Audio",
            duration="10:00",
            poster_url="/static/images/song_thumbnails/nature_meditation_thumb.jpg",
            video_url="/static/songs/nature-sounds-slow-meditation-healing-frequency-432hz-368787.mp3",
            created_at=datetime.now().isoformat()
        ),
        FrontendVideo(
            id="audio_3",
            title="Alpha Music",
            description="432Hz frequency music for deep focus and meditation.",
            category="Audio",
            duration="8:00",
            poster_url="/static/images/song_thumbnails/alpha_music_thumb.jpg",
            video_url="/static/songs/alpha-music-432hz-the-first-314853.mp3",
            created_at=datetime.now().isoformat()
        )
    ])

# Auto-index local media from static/videos and static/songs
def _safe_title_from_filename(filename: str) -> str:
    base = os.path.splitext(os.path.basename(filename))[0]
    # Replace separators with spaces and normalize
    return re.sub(r"[_-]+", " ", base).strip().title()

def index_static_media():
    try:
        existing_ids = {v.id for v in frontend_videos}

        # Videos
        videos_dir = os.path.join("static", "videos")
        if os.path.isdir(videos_dir):
            for name in os.listdir(videos_dir):
                if not any(name.lower().endswith(ext) for ext in [".mp4", ".webm", ".mov", ".mkv"]):
                    continue
                vid_id = f"vid_{name}"
                if vid_id in existing_ids:
                    continue
                poster = None
                # Try to find a matching thumbnail in static/images/thumbnails
                thumb_dir = os.path.join("static", "images", "thumbnails")
                base = os.path.splitext(name)[0]
                possible_thumbs = [
                    f"{base}_thumb.jpg",
                    f"{base}.jpg",
                    f"{base}.png",
                ]
                for t in possible_thumbs:
                    candidate = os.path.join(thumb_dir, t)
                    if os.path.isfile(candidate):
                        poster = f"/static/images/thumbnails/{t}"
                        break
                frontend_videos.append(FrontendVideo(
                    id=vid_id,
                    title=_safe_title_from_filename(name),
                    description=None,
                    category="Videos",
                    duration="",
                    poster_url=poster,
                    video_url=f"/static/videos/{name}",
                    created_at=datetime.now().isoformat()
                ))
                existing_ids.add(vid_id)

        # Songs (as Audio category)
        songs_dir = os.path.join("static", "songs")
        default_song_thumb = "/static/images/song_thumbnails/meditation_thumb.jpg"
        if os.path.isdir(songs_dir):
            for name in os.listdir(songs_dir):
                if not any(name.lower().endswith(ext) for ext in [".mp3", ".wav", ".aac", ".ogg", ".m4a"]):
                    continue
                song_id = f"audio_{name}"
                if song_id in existing_ids:
                    continue
                # Try to map thumbnails by simple heuristics
                poster = default_song_thumb
                lower = name.lower()
                thumb_map = [
                    ("alpha", "/static/images/song_thumbnails/alpha_music_thumb.jpg"),
                    ("nature", "/static/images/song_thumbnails/nature_meditation_thumb.jpg"),
                    ("comfort", "/static/images/song_thumbnails/comfort_sounds_thumb.jpg"),
                    ("healing", "/static/images/song_thumbnails/healing_meditation_thumb.jpg"),
                ]
                for key, url in thumb_map:
                    if key in lower:
                        poster = url
                        break
                frontend_videos.append(FrontendVideo(
                    id=song_id,
                    title=_safe_title_from_filename(name),
                    description=None,
                    category="Audio",
                    duration="",
                    poster_url=poster,
                    video_url=f"/static/songs/{name}",
                    created_at=datetime.now().isoformat()
                ))
                existing_ids.add(song_id)
    except Exception:
        # Non-fatal: keep app running even if indexing fails
        pass

# Perform indexing at startup
index_static_media()

# Routes
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Serve ReactRecreation SPA
    if os.path.exists(SPA_INDEX):
        return FileResponse(SPA_INDEX)
    return HTMLResponse("<h3>React build not found. Please build the app in ReactRecreation/ReactRecreation.</h3>")

@app.get("/api/movies", response_model=List[Movie])
async def get_movies(category: Optional[str] = None):
    if category:
        return [movie for movie in movies_db if movie["category"] == category]
    return movies_db

@app.get("/api/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: int):
    for movie in movies_db:
        if movie["id"] == movie_id:
            return movie
    return {"error": "Movie not found"}

@app.post("/api/movies", response_model=Movie)
async def create_movie(movie: MovieCreate):
    new_id = max([m["id"] for m in movies_db], default=0) + 1
    new_movie = {
        "id": new_id,
        **movie.dict()
    }
    movies_db.append(new_movie)
    return new_movie

@app.put("/api/movies/{movie_id}", response_model=Movie)
async def update_movie(movie_id: int, movie: MovieCreate):
    for i, existing_movie in enumerate(movies_db):
        if existing_movie["id"] == movie_id:
            movies_db[i] = {"id": movie_id, **movie.dict()}
            return movies_db[i]
    return {"error": "Movie not found"}

@app.delete("/api/movies/{movie_id}")
async def delete_movie(movie_id: int):
    for i, movie in enumerate(movies_db):
        if movie["id"] == movie_id:
            deleted_movie = movies_db.pop(i)
            return {"message": f"Movie '{deleted_movie['title']}' deleted successfully"}
    return {"error": "Movie not found"}

@app.get("/api/categories")
async def get_categories():
    categories = list(set([movie["category"] for movie in movies_db]))
    return {"categories": categories}

# ---------- Minimal endpoints expected by ReactRecreation ----------
@app.get("/api/videos")
async def api_videos_all():
    return [v.dict() for v in frontend_videos]

@app.get("/api/videos/category")
async def api_videos_by_category(q: Optional[str] = None):
    # React uses queryKey ['/api/videos/category', 'Audio'] - mimic by reading query param `q`
    # If q not provided, return empty for safety
    if not q:
        return []
    return [v.dict() for v in frontend_videos if (v.category or '').lower() == (q or '').lower()]

@app.get("/api/videos/category/{category}")
async def api_videos_by_category_path(category: str):
    cat = (category or '').lower()
    return [v.dict() for v in frontend_videos if (v.category or '').lower() == cat]

# ---------- Recreation content API (used by React Recreation page) ----------
# Storage directory for recorded/uploaded short videos
RECREATION_DIR = os.path.join("static", "recreation", "videos")
os.makedirs(RECREATION_DIR, exist_ok=True)

def _list_recreation_videos() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    if not os.path.isdir(RECREATION_DIR):
        return items

    for name in os.listdir(RECREATION_DIR):
        file_path = os.path.join(RECREATION_DIR, name)
        if not os.path.isfile(file_path):
            continue
        if not any(name.lower().endswith(ext) for ext in [".webm", ".mp4", ".mov", ".mkv"]):
            continue
        stat = os.stat(file_path)
        items.append({
            "id": name,
            "title": os.path.splitext(name)[0],
            "url": f"/static/recreation/videos/{name}",
            "size_bytes": stat.st_size,
            "created_at": datetime.fromtimestamp(max(stat.st_ctime, stat.st_mtime)).isoformat(),
        })
    # Newest first
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items

@app.get("/api/recreation/videos")
async def api_recreation_list_videos():
    """List uploaded/recorded recreation videos. Returns [] if none."""
    return _list_recreation_videos()

@app.post("/api/recreation/upload")
async def api_recreation_upload_video(file: UploadFile = File(...)):
    """Upload a short video (multipart/form-data). Returns the saved item."""
    try:
        print(f"Upload attempt: filename={file.filename}, content_type={file.content_type}")
        
        # Ensure directory exists
        os.makedirs(RECREATION_DIR, exist_ok=True)
        
        ext = os.path.splitext(file.filename or "")[1] or ".webm"
        if ext.lower() not in [".webm", ".mp4", ".mov", ".mkv"]:
            ext = ".webm"
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", os.path.splitext(file.filename or "recording")[0])
        filename = f"{ts}_{safe_name}{ext}"
        dest_path = os.path.join(RECREATION_DIR, filename)
        
        print(f"Saving to: {dest_path}")
        
        # Read file content and save
        content = await file.read()
        with open(dest_path, "wb") as out:
            out.write(content)
        
        file_size = os.path.getsize(dest_path)
        print(f"File saved successfully: {file_size} bytes")
        
        item = {
            "id": filename,
            "title": os.path.splitext(filename)[0],
            "url": f"/static/recreation/videos/{filename}",
            "size_bytes": file_size,
            "created_at": datetime.now().isoformat(),
        }
        return item
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

@app.post("/api/recreation/videos")
async def api_recreation_upload_video_alt(file: UploadFile = File(...)):
    """Alternative upload endpoint for compatibility."""
    return await api_recreation_upload_video(file)

@app.delete("/api/recreation/videos/{video_id}")
async def api_recreation_delete_video(video_id: str):
    """Delete a recreation video by filename id."""
    try:
        target = os.path.join(RECREATION_DIR, video_id)
        if not os.path.isfile(target):
            raise HTTPException(status_code=404, detail="Video not found")
        os.remove(target)
        return {"deleted": True, "id": video_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")

# Recreation endpoints
@app.get("/recreation", response_class=HTMLResponse)
async def recreation_page(request: Request):
    if os.path.exists(SPA_INDEX):
        return FileResponse(SPA_INDEX)
    return HTMLResponse("<h3>React build not found. Please build the app in ReactRecreation/ReactRecreation.</h3>")


@app.get("/api/recreation/videos", response_model=List[RecreationVideo])
async def get_recreation_videos(category: Optional[str] = None):
    if category:
        return [video for video in recreation_videos_db if video["category"] == category]
    return recreation_videos_db

@app.post("/api/recreation/upload")
async def upload_recreation_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...)
):
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = f"static/recreation/videos/{filename}"
        
        # Save video file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate thumbnail (placeholder for now)
        thumbnail_filename = f"thumb_{timestamp}.jpg"
        thumbnail_path = f"static/recreation/thumbnails/{thumbnail_filename}"
        
        # Create a simple placeholder thumbnail
        with open(thumbnail_path, "wb") as f:
            f.write(b"")  # Placeholder - in real app, generate actual thumbnail
        
        # Create video record
        new_id = max([v["id"] for v in recreation_videos_db], default=0) + 1
        video_record = {
            "id": new_id,
            "title": title,
            "description": description,
            "category": category,
            "duration": "0:00",  # Will be updated when video is processed
            "thumbnail": thumbnail_filename,
            "video_file": filename,
            "created_at": datetime.now().isoformat(),
            "user_id": "user_123"  # In real app, get from session/auth
        }
        
        recreation_videos_db.append(video_record)
        
        return {
            "message": "Video uploaded successfully",
            "video": video_record
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.delete("/api/recreation/videos/{video_id}")
async def delete_recreation_video(video_id: int):
    for i, video in enumerate(recreation_videos_db):
        if video["id"] == video_id:
            deleted_video = recreation_videos_db.pop(i)
            
            # Delete files
            try:
                os.remove(f"static/recreation/videos/{deleted_video['video_file']}")
                os.remove(f"static/recreation/thumbnails/{deleted_video['thumbnail']}")
            except:
                pass  # Files might not exist
            
            return {"message": f"Video '{deleted_video['title']}' deleted successfully"}
    return {"error": "Video not found"}

# ==================== COIN SYSTEM FUNCTIONS ====================

def get_user(user_id: str):
    """Get user by ID"""
    for user in users_db:
        if user["id"] == user_id:
            return user
    return None

def add_coins(user_id: str, amount: int, source: str, source_id: str = None, description: str = ""):
    """Add coins to user account and create transaction record"""
    user = get_user(user_id)
    if not user:
        return False
    
    # Add coins
    user["coins"] += amount
    
    # Add experience (1 XP per coin)
    user["experience"] += amount
    
    # Check for level up (every 20 XP = 1 level)
    new_level = (user["experience"] // 20) + 1
    if new_level > user["level"]:
        user["level"] = new_level
        # Bonus coins for leveling up
        bonus_coins = new_level * 2
        user["coins"] += bonus_coins
        amount += bonus_coins
    
    # Update last activity
    user["last_activity"] = datetime.now().isoformat()
    
    # Create transaction record
    transaction = {
        "id": f"txn_{len(coin_transactions_db) + 1}",
        "user_id": user_id,
        "amount": amount,
        "transaction_type": "earn",
        "source": source,
        "source_id": source_id,
        "description": description,
        "timestamp": datetime.now().isoformat()
    }
    coin_transactions_db.append(transaction)
    
    return True

def spend_coins(user_id: str, amount: int, source: str, source_id: str = None, description: str = ""):
    """Spend coins from user account and create transaction record"""
    user = get_user(user_id)
    if not user or user["coins"] < amount:
        return False
    
    # Deduct coins
    user["coins"] -= amount
    
    # Create transaction record
    transaction = {
        "id": f"txn_{len(coin_transactions_db) + 1}",
        "user_id": user_id,
        "amount": -amount,
        "transaction_type": "spend",
        "source": source,
        "source_id": source_id,
        "description": description,
        "timestamp": datetime.now().isoformat()
    }
    coin_transactions_db.append(transaction)
    
    return True

def calculate_video_coins(duration_minutes: int, category: str) -> int:
    """Calculate coins earned for watching a video - 2 coins for full video"""
    # Fixed 2 coins for watching full video without skipping
    return 2

def calculate_song_coins(duration_minutes: int) -> int:
    """Calculate coins earned for listening to a song - 3 coins per song"""
    # Fixed 3 coins for listening to a song
    return 3

def calculate_recreation_coins(duration_minutes: int) -> int:
    """Calculate coins earned for creating recreation content - 3 coins per recreation"""
    # Fixed 3 coins for creating recreation content
    return 3

# ==================== COIN SYSTEM API ENDPOINTS ====================

@app.get("/api/user/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile with coin balance and stats"""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# SPA fallback for client-side routes (excluding API and static paths)
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    # Allow API and static to pass through 404 normally
    if full_path.startswith("api/") or full_path.startswith("static/") or full_path.startswith("Games/"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    # Only serve SPA for known frontend routes; avoid masking API 404s
    if os.path.exists(SPA_INDEX):
        return FileResponse(SPA_INDEX)
    return JSONResponse({"detail": "SPA not built"}, status_code=404)



# SPA fallback for client-side routes (excluding API and static paths)

@app.get("/api/user/{user_id}/transactions")
async def get_user_transactions(user_id: str, limit: int = 50):
    """Get user's coin transaction history"""
    user_transactions = [tx for tx in coin_transactions_db if tx["user_id"] == user_id]
    return sorted(user_transactions, key=lambda x: x["timestamp"], reverse=True)[:limit]

@app.post("/api/user/{user_id}/earn-coins")
async def earn_coins_endpoint(
    user_id: str,
    source: str = Form(...),
    source_id: str = Form(None),
    duration_minutes: int = Form(0),
    category: str = Form("general")
):
    """Earn coins for various activities"""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate coins based on source
    if source == "video":
        amount = calculate_video_coins(duration_minutes, category)
    elif source == "song":
        amount = calculate_song_coins(duration_minutes)
    elif source == "recreation":
        amount = calculate_recreation_coins(duration_minutes)
    elif source == "game":
        # For games, the frontend passes the awarded amount (validated server-side
        # by the game launcher + result polling). Trust small integer here.
        try:
            amount = int(duration_minutes)
        except Exception:
            amount = 0
        if amount < 0:
            amount = 0
        if amount > 5:
            amount = 5
    elif source == "daily":
        amount = 10  # Daily login bonus
    else:
        amount = 5  # Default amount
    
    # Add coins
    success = add_coins(user_id, amount, source, source_id, f"Earned {amount} coins from {source}")
    
    if success:
        return {"message": f"Earned {amount} coins!", "coins_earned": amount, "new_balance": user["coins"]}
    else:
        raise HTTPException(status_code=500, detail="Failed to add coins")

@app.get("/api/rewards")
async def get_rewards(category: Optional[str] = None):
    """Get available rewards"""
    if category:
        return [reward for reward in rewards_db if reward["category"] == category and reward["is_available"]]
    return [reward for reward in rewards_db if reward["is_available"]]

@app.post("/api/user/{user_id}/redeem-reward/{reward_id}")
async def redeem_reward(user_id: str, reward_id: str):
    """Redeem a reward using coins"""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find reward
    reward = None
    for r in rewards_db:
        if r["id"] == reward_id and r["is_available"]:
            reward = r
            break

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    if user["coins"] < reward["cost"]:
        raise HTTPException(status_code=400, detail="Insufficient coins")
    
    # Spend coins
    if not spend_coins(user_id, reward["cost"], "reward", reward_id, f"Redeemed {reward['name']}"):
        raise HTTPException(status_code=500, detail="Failed to process redemption")
    
    # Create user reward record
    user_reward = {
        "id": f"user_reward_{len(user_rewards_db) + 1}",
        "user_id": user_id,
        "reward_id": reward_id,
        "redeemed_at": datetime.now().isoformat(),
        "is_used": False
    }
    user_rewards_db.append(user_reward)
    
    return {
        "message": f"Successfully redeemed {reward['name']}!",
        "reward": reward,
        "new_balance": user["coins"]
    }

@app.get("/api/user/{user_id}/rewards")
async def get_user_rewards(user_id: str):
    """Get user's redeemed rewards"""
    user_rewards = [ur for ur in user_rewards_db if ur["user_id"] == user_id]
    
    # Add reward details
    result = []
    for ur in user_rewards:
        reward = next((r for r in rewards_db if r["id"] == ur["reward_id"]), None)
        if reward:
            result.append({
                **ur,
                "reward_details": reward
            })
    
    return result

@app.get("/api/user/{user_id}/achievements")
async def get_user_achievements(user_id: str):
    """Get user's achievements and progress"""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate achievements based on user stats
    achievements = []
    
    # Video watching achievements
    video_transactions = [tx for tx in coin_transactions_db if tx["user_id"] == user_id and tx["source"] == "video"]
    videos_watched = len(video_transactions)
    
    if videos_watched >= 5:
        achievements.append({"id": "video_master", "name": "Video Master", "description": "Watched 5+ videos", "unlocked": True})
    elif videos_watched >= 3:
        achievements.append({"id": "video_master", "name": "Video Master", "description": "Watched 5+ videos", "unlocked": False, "progress": f"{videos_watched}/5"})
    
    # Streak achievements
    if user["streak_days"] >= 7:
        achievements.append({"id": "week_warrior", "name": "Week Warrior", "description": "7-day streak", "unlocked": True})
    elif user["streak_days"] >= 3:
        achievements.append({"id": "week_warrior", "name": "Week Warrior", "description": "7-day streak", "unlocked": False, "progress": f"{user['streak_days']}/7"})
    
    # Level achievements
    if user["level"] >= 3:
        achievements.append({"id": "level_master", "name": "Level Master", "description": "Reached level 3", "unlocked": True})
    elif user["level"] >= 2:
        achievements.append({"id": "level_master", "name": "Level Master", "description": "Reached level 3", "unlocked": False, "progress": f"{user['level']}/3"})
    
    return {
        "achievements": achievements,
        "total_achievements": len([a for a in achievements if a["unlocked"]]),
        "user_level": user["level"],
        "user_experience": user["experience"],
        "next_level_xp": (user["level"] * 20) - user["experience"]
    }

# Game-related endpoints
@app.post("/api/launch-game/{game_name}")
async def launch_game(game_name: str):
    """Launch a Pygame application"""
    try:
        games_dir = os.path.join(os.getcwd(), "Games")
        
        # Map game names to their launcher scripts
        game_launchers = {
            "dino": "launch_dino_game.py",
            "2048": "launch_2048_game.py",
            "tetris": "launch_tetris_game.py",
            "snake": "launch_snake_game.py"
        }
        
        if game_name not in game_launchers:
            raise HTTPException(status_code=404, detail="Game not found")
        
        launcher_path = os.path.join(games_dir, game_launchers[game_name])
        
        if not os.path.exists(launcher_path):
            raise HTTPException(status_code=404, detail="Game launcher not found")
        
        # Reset game result so polling doesn't read stale results
        try:
            result_file = os.path.join(games_dir, "game_result.json")
            with open(result_file, 'w') as f:
                json.dump({
                    "game": game_name,
                    "completed": False,
                    "coins_earned": 0,
                    "score": 0,
                    "timestamp": datetime.now().isoformat()
                }, f)
        except Exception:
            pass

        # Start the game in a subprocess
        process = subprocess.Popen(
            ["python", launcher_path],
            cwd=games_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        # remember pid
        try:
            running_games[game_name] = process.pid
        except Exception:
            pass
        
        return {
            "success": True,
            "message": "Game launched successfully",
            "game": game_name,
            "pid": process.pid
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to launch game: {str(e)}")

@app.post("/api/terminate-game")
async def terminate_game(game: Optional[str] = Form(None), pid: Optional[int] = Form(None)):
    """Terminate a running game process by game name or PID (Windows-safe)."""
    try:
        target_pid: Optional[int] = None
        if pid:
            target_pid = int(pid)
        elif game and game in running_games:
            target_pid = running_games.get(game)
        if not target_pid:
            return {"terminated": False, "reason": "no pid"}
        # Try graceful terminate first
        try:
            os.kill(target_pid, signal.SIGTERM)
        except Exception:
            # Fallback to taskkill on Windows
            try:
                subprocess.run(["taskkill", "/PID", str(target_pid), "/F", "/T"], capture_output=True)
            except Exception:
                pass
        # Remove from registry
        for k, v in list(running_games.items()):
            if v == target_pid:
                running_games.pop(k, None)
        return {"terminated": True, "pid": target_pid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terminate failed: {e}")

@app.get("/api/games")
@app.get("/api/games/list")
@app.get("/games-api")
async def list_games():
    """Auto-discover available games in the Games/ folder by scanning for launch_*.py scripts."""
    games_dir = os.path.join(os.getcwd(), "Games")
    result = []
    try:
        if not os.path.isdir(games_dir):
            return {"games": []}

        for name in os.listdir(games_dir):
            if not name.lower().endswith(".py"):
                continue
            lower = name.lower()
            if not lower.startswith("launch_"):
                continue
            # Derive game id from filename, supporting patterns like launch_<id>_game.py or launch_<id>.py
            base = os.path.splitext(name)[0]
            core = base[len("launch_"):]
            if core.endswith("_game"):
                core = core[:-len("_game")]
            game_id = core

            # Friendly labels and descriptions for common games
            label_map = {
                "dino": "Chrome Dino",
                "2048": "2048",
                "tetris": "Tetris",
                "snake": "Snake",
            }
            desc_map = {
                "dino": "Jump and dodge obstacles.",
                "2048": "Combine tiles to reach 2048.",
                "tetris": "Stack blocks to clear lines.",
                "snake": "Grow by eating, avoid walls.",
            }

            result.append({
                "id": game_id,
                "label": label_map.get(game_id, game_id.title()),
                "description": desc_map.get(game_id, "Play the game"),
                "launcher": name,
            })
        # Sort for stable display
        result.sort(key=lambda x: x["label"].lower())
        return {"games": result}
    except Exception:
        return {"games": []}

@app.get("/api/game-result/{game_name}")
async def get_game_result(game_name: str):
    """Get the result of a completed game"""
    try:
        result_file = os.path.join(os.getcwd(), "Games", "game_result.json")
        
        if not os.path.exists(result_file):
            return {
                "completed": False,
                "coins_earned": 0,
                "score": 0
            }
        
        with open(result_file, 'r') as f:
            result_data = json.load(f)
        
        # Check if the result is for the requested game
        if result_data.get('game') != game_name:
            return {
                "completed": False,
                "coins_earned": 0,
                "score": 0
            }
        
        # Check if the result is recent (within last 5 minutes)
        result_time = datetime.fromisoformat(result_data.get('timestamp', '2000-01-01T00:00:00'))
        time_diff = datetime.now() - result_time
        
        if time_diff.total_seconds() > 300:  # 5 minutes
            return {
                "completed": False,
                "coins_earned": 0,
                "score": 0
            }
        
        # If file exists but not completed yet, still report not completed
        if not result_data.get('completed', False):
            return {
                "completed": False,
                "coins_earned": 0,
                "score": 0
            }

        result = {
            "completed": True,
            "coins_earned": result_data.get('coins_earned', 0),
            "score": result_data.get('score', 0),
            "timestamp": result_data.get('timestamp'),
            "game": result_data.get('game', game_name)
        }
        # Attempt to terminate leftover process
        try:
            pid = running_games.pop(game_name, None)
            if pid:
                try:
                    os.kill(pid, signal.SIGTERM)
                except Exception:
                    subprocess.run(["taskkill", "/PID", str(pid), "/F", "/T"], capture_output=True)
        except Exception:
            pass
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get game result: {e}")

@app.post("/api/report-game-result")
async def report_game_result(
    game: str = Form(...),
    score: int = Form(0),
    coins_earned: int = Form(0)
):
    """Allow React games to report results directly without relying on filesystem writes."""
    try:
        # Clamp coins for safety
        if coins_earned < 0:
            coins_earned = 0
        if coins_earned > 5:
            coins_earned = 5
        # Write the same file so existing polling still works
        games_dir = os.path.join(os.getcwd(), "Games")
        os.makedirs(games_dir, exist_ok=True)
        result = {
            "game": game,
            "completed": True,
            "coins_earned": int(coins_earned),
            "score": int(score),
            "timestamp": datetime.now().isoformat()
        }
        with open(os.path.join(games_dir, "game_result.json"), "w") as f:
            json.dump(result, f)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report failed: {e}")

if __name__ == "__main__":
    import uvicorn
    import os
    # Enable auto-reload so the server restarts when code changes are detected
    # Use the import string form so Uvicorn's reloader can re-import the app
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=[os.getcwd()])
