from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import pymongo
import os
from typing import Optional

app = FastAPI(title="Rick & Morty Backend API")

app.add_middleware (
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI" , "mongodb://localhost:27017/")

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()
    db = client["rickmorty_db"]
    favorites_collection = db["favorites"]
    print("Conectado exitosamente a MongoDB")
except Exception as e:
    favorites_collection = None
    print(f"Error al conectar a MongoDB: {e}")


RICK_MORTY_API = "https://rickandmortyapi.com/api/character"


class FavoriteCharacter(BaseModel):
    id: int
    name: str
    status: str
    species: str
    image: str


@app.get("/api/characters")
async def get_character(
    name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    species: Optional[str] = Query(None),
    page: int = Query(1, ge=1)
):
    """Proxy hacia Rick & Morty API con filtros"""
    safe_page = max(1, page)
    params: dict = {"page": safe_page}
    if name: params["name"] = name
    if status: params["status"] = status
    if species: params["species"] = species

    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(RICK_MORTY_API, params=params)
        if response.status_code == 404:
            return {"results": [], "info": {"pages": 0}}
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Error consumiendo la API externa")
        return response.json()
    
@app.get("/api/characters/{character_id}")
async def get_character_detail(character_id: int):
    """Obtener el detalle de un personaje específico."""
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(f"{RICK_MORTY_API}/{character_id}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Personaje no encontrado")
        return response.json()

@app.get("/api/favorites")
def list_favorites():
    """Listar todos los personajes guardados como favoritos en MongoDB."""
    if favorites_collection is None:
        raise HTTPException(status_code=503, detail="Servicio de favoritos no disponible")
    favs = list(favorites_collection.find({},{"_id": 0}))
    return favs

@app.post("/api/favorites")
def add_favorite(character: FavoriteCharacter):
    """Guardar un personaje en la base de datos"""
    if favorites_collection is None:
        raise HTTPException(status_code=503, detail="Servicio de favoritos no disponible")
    if favorites_collection.find_one({"id": character.id}):
        return {"message": "El personaje ya esta en favoritos"}
    favorites_collection.insert_one(character.model_dump())
    return {"message": "Añadido a favoritos exitosamente"}

@app.delete("/api/favorites/{character_id}")
def remove_favorite(character_id: int):
    """Eliminar un personaje de favoritos"""
    if favorites_collection is None:
        raise HTTPException(status_code=503, detail="Servicio de favoritos no disponible")
    favorites_collection.delete_one({"id": character_id})
    return {"message": "Eliminado de favoritos exitosamente"}