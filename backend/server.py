from fastapi import FastAPI, APIRouter, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Models
class Material(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    quantite: int
    date_ajout: datetime = Field(default_factory=datetime.utcnow)

class MaterialCreate(BaseModel):
    nom: str
    quantite: int

class MaterialUpdate(BaseModel):
    nom: Optional[str] = None
    quantite: Optional[int] = None

class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    matricule: str

class AgentCreate(BaseModel):
    nom: str
    matricule: str

class Superviseur(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    matricule: str

class SuperviseurCreate(BaseModel):
    nom: str
    matricule: str

class ChefSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    matricule: str

class ChefSectionCreate(BaseModel):
    nom: str
    matricule: str

class DemandeSortie(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    superviseur_id: str
    superviseur_nom: str
    superviseur_matricule: str
    agent1_id: str
    agent1_nom: str
    agent1_matricule: str
    agent2_id: str
    agent2_nom: str
    agent2_matricule: str
    date: datetime = Field(default_factory=datetime.utcnow)
    materiels_demandes: Dict[str, int]  # material_id -> quantite
    signature: Optional[str] = None
    status: str = "en_attente"

class DemandeSortieCreate(BaseModel):
    superviseur_id: str
    agent1_id: str
    agent2_id: str
    materiels_demandes: Dict[str, int]
    signature: Optional[str] = None

class AdminAuth(BaseModel):
    password: str

# Admin password (in production, use proper authentication)
ADMIN_PASSWORD = "admin123"

# Routes

# Authentication
@api_router.post("/login")
async def login(auth: AdminAuth):
    if auth.password == ADMIN_PASSWORD:
        return {"status": "success", "role": "admin", "token": "admin-token"}
    else:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

# Materials CRUD
@api_router.get("/materials", response_model=List[Material])
async def get_materials():
    materials = await db.materials.find().to_list(1000)
    return [Material(**material) for material in materials]

@api_router.post("/materials", response_model=Material)
async def create_material(material: MaterialCreate):
    material_dict = material.dict()
    material_obj = Material(**material_dict)
    await db.materials.insert_one(material_obj.dict())
    return material_obj

@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, material_update: MaterialUpdate):
    update_data = {k: v for k, v in material_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    
    result = await db.materials.update_one(
        {"id": material_id}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matériel non trouvé")
    
    updated_material = await db.materials.find_one({"id": material_id})
    return Material(**updated_material)

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Matériel non trouvé")
    return {"message": "Matériel supprimé avec succès"}

# Agents CRUD
@api_router.get("/agents", response_model=List[Agent])
async def get_agents():
    agents = await db.agents.find().to_list(1000)
    return [Agent(**agent) for agent in agents]

@api_router.post("/agents", response_model=Agent)
async def create_agent(agent: AgentCreate):
    agent_dict = agent.dict()
    agent_obj = Agent(**agent_dict)
    await db.agents.insert_one(agent_obj.dict())
    return agent_obj

@api_router.put("/agents/{agent_id}", response_model=Agent)
async def update_agent(agent_id: str, agent_update: AgentCreate):
    result = await db.agents.update_one(
        {"id": agent_id}, 
        {"$set": agent_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent non trouvé")
    
    updated_agent = await db.agents.find_one({"id": agent_id})
    return Agent(**updated_agent)

@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    result = await db.agents.delete_one({"id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent non trouvé")
    return {"message": "Agent supprimé avec succès"}

# Superviseurs CRUD
@api_router.get("/superviseurs", response_model=List[Superviseur])
async def get_superviseurs():
    superviseurs = await db.superviseurs.find().to_list(1000)
    return [Superviseur(**superviseur) for superviseur in superviseurs]

@api_router.post("/superviseurs", response_model=Superviseur)
async def create_superviseur(superviseur: SuperviseurCreate):
    superviseur_dict = superviseur.dict()
    superviseur_obj = Superviseur(**superviseur_dict)
    await db.superviseurs.insert_one(superviseur_obj.dict())
    return superviseur_obj

@api_router.put("/superviseurs/{superviseur_id}", response_model=Superviseur)
async def update_superviseur(superviseur_id: str, superviseur_update: SuperviseurCreate):
    result = await db.superviseurs.update_one(
        {"id": superviseur_id}, 
        {"$set": superviseur_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Superviseur non trouvé")
    
    updated_superviseur = await db.superviseurs.find_one({"id": superviseur_id})
    return Superviseur(**updated_superviseur)

@api_router.delete("/superviseurs/{superviseur_id}")
async def delete_superviseur(superviseur_id: str):
    result = await db.superviseurs.delete_one({"id": superviseur_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Superviseur non trouvé")
    return {"message": "Superviseur supprimé avec succès"}

# Chef Section CRUD
@api_router.get("/chef-section", response_model=List[ChefSection])
async def get_chef_section():
    chefs = await db.chef_section.find().to_list(1000)
    return [ChefSection(**chef) for chef in chefs]

@api_router.post("/chef-section", response_model=ChefSection)
async def create_chef_section(chef: ChefSectionCreate):
    chef_dict = chef.dict()
    chef_obj = ChefSection(**chef_dict)
    await db.chef_section.insert_one(chef_obj.dict())
    return chef_obj

@api_router.put("/chef-section/{chef_id}", response_model=ChefSection)
async def update_chef_section(chef_id: str, chef_update: ChefSectionCreate):
    result = await db.chef_section.update_one(
        {"id": chef_id}, 
        {"$set": chef_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chef de section non trouvé")
    
    updated_chef = await db.chef_section.find_one({"id": chef_id})
    return ChefSection(**updated_chef)

@api_router.delete("/chef-section/{chef_id}")
async def delete_chef_section(chef_id: str):
    result = await db.chef_section.delete_one({"id": chef_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chef de section non trouvé")
    return {"message": "Chef de section supprimé avec succès"}

# Demandes de sortie
@api_router.get("/demandes", response_model=List[DemandeSortie])
async def get_demandes():
    demandes = await db.demandes_sortie.find().sort("date", -1).to_list(1000)
    return [DemandeSortie(**demande) for demande in demandes]

@api_router.post("/demandes", response_model=DemandeSortie)
async def create_demande(demande_create: DemandeSortieCreate):
    # Get supervisor info
    superviseur = await db.superviseurs.find_one({"id": demande_create.superviseur_id})
    if not superviseur:
        raise HTTPException(status_code=404, detail="Superviseur non trouvé")
    
    # Get agent1 info
    agent1 = await db.agents.find_one({"id": demande_create.agent1_id})
    if not agent1:
        raise HTTPException(status_code=404, detail="Agent 1 non trouvé")
    
    # Get agent2 info
    agent2 = await db.agents.find_one({"id": demande_create.agent2_id})
    if not agent2:
        raise HTTPException(status_code=404, detail="Agent 2 non trouvé")
    
    # Create demande with full info
    demande_dict = demande_create.dict()
    demande_dict.update({
        "superviseur_nom": superviseur["nom"],
        "superviseur_matricule": superviseur["matricule"],
        "agent1_nom": agent1["nom"],
        "agent1_matricule": agent1["matricule"],
        "agent2_nom": agent2["nom"],
        "agent2_matricule": agent2["matricule"]
    })
    
    demande_obj = DemandeSortie(**demande_dict)
    await db.demandes_sortie.insert_one(demande_obj.dict())
    
    # Update stock quantities
    for material_id, quantite in demande_create.materiels_demandes.items():
        if quantite > 0:
            await db.materials.update_one(
                {"id": material_id},
                {"$inc": {"quantite": -quantite}}
            )
    
    return demande_obj

# Stock alerts
@api_router.get("/stock-alerts")
async def get_stock_alerts():
    materials = await db.materials.find().to_list(1000)
    alerts = []
    for material in materials:
        level = "normal"
        if material["quantite"] <= 5:
            level = "critique"
        elif material["quantite"] <= 15:
            level = "bas"
        
        alerts.append({
            "material": material,
            "level": level
        })
    return alerts

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()