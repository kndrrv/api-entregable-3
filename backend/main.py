from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, Mascota, create_tables_and_data
from pydantic import BaseModel
import requests
from typing import Optional

app = FastAPI(title="Refugio de Mascotas API", version="1.0.0")

#configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#modelo pydantic para respuestas
class MascotaResponse(BaseModel):
    id: int
    nombre: str
    raza: str
    edad: int
    descripcion: Optional[str]
    imagen_url: Optional[str]
    fecha_ingreso: str

#inicializa la base de datos al arrancar
@app.on_event("startup")
async def startup_event():
    print("🚀 Iniciando aplicación...")
    create_tables_and_data()

#endpoints para la api externa
@app.get("/api/razas")
async def obtener_razas():
    #obtiene todas las razas de perros desde Dog CEO API
    try:
        response = requests.get("https://dog.ceo/api/breeds/list/all", timeout=10)
        if response.status_code == 200:
            data = response.json()
            razas = []
            for raza, sub_razas in data["message"].items():
                if sub_razas:
                    for sub_raza in sub_razas:
                        razas.append(f"{raza} {sub_raza}")
                else:
                    razas.append(raza)
            return {"razas": sorted(razas)}
        else:
            raise HTTPException(status_code=500, detail="Error al obtener razas")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")

@app.get("/api/imagen-raza/{raza}")
async def obtener_imagen_raza(raza: str):
    #obtiene las imagenes aleatorias de una raza específica
    try:
        #convierte el formato de raza para la API
        raza_partes = raza.lower().replace(" ", "-").split("-")
        if len(raza_partes) > 1:
            url = f"https://dog.ceo/api/breed/{raza_partes[0]}/{raza_partes[1]}/images/random"
        else:
            url = f"https://dog.ceo/api/breed/{raza_partes[0]}/images/random"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=404, detail="Raza no encontrada")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener imagen: {str(e)}")

@app.get("/api/imagenes-aleatorias")
async def obtener_imagenes_aleatorias(cantidad: int = 6):
    #obtiene múltiples imágenes aleatorias de perros
    try:
        response = requests.get(f"https://dog.ceo/api/breeds/image/random/{cantidad}", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=500, detail="Error al obtener imágenes")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")

@app.post("/api/mascotas", response_model=MascotaResponse)
async def crear_mascota(
    nombre: str = Form(...),
    raza: str = Form(...),
    edad: int = Form(...),
    descripcion: str = Form(""),
    imagen_url: str = Form(""),
    db: Session = Depends(get_db)
):
    #crea una nueva mascota en el refugio
    try:
        nueva_mascota = Mascota(
            nombre=nombre,
            raza=raza,
            edad=edad,
            descripcion=descripcion,
            imagen_url=imagen_url
        )
        db.add(nueva_mascota)
        db.commit()
        db.refresh(nueva_mascota)
        
        return MascotaResponse(
            id=nueva_mascota.id,
            nombre=nueva_mascota.nombre,
            raza=nueva_mascota.raza,
            edad=nueva_mascota.edad,
            descripcion=nueva_mascota.descripcion,
            imagen_url=nueva_mascota.imagen_url,
            fecha_ingreso=nueva_mascota.fecha_ingreso.isoformat()
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear mascota: {str(e)}")

@app.get("/api/mascotas")
async def obtener_mascotas(db: Session = Depends(get_db)):
    #obtienne todas las mascotas del refugio
    try:
        mascotas = db.query(Mascota).all()
        return [
            MascotaResponse(
                id=mascota.id,
                nombre=mascota.nombre,
                raza=mascota.raza,
                edad=mascota.edad,
                descripcion=mascota.descripcion,
                imagen_url=mascota.imagen_url,
                fecha_ingreso=mascota.fecha_ingreso.isoformat() if mascota.fecha_ingreso else ""
            )
            for mascota in mascotas
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener mascotas: {str(e)}")

@app.get("/api/mascotas/{mascota_id}", response_model=MascotaResponse)
async def obtener_mascota(mascota_id: int, db: Session = Depends(get_db)):
    #obtiene una mascota específica por ID
    mascota = db.query(Mascota).filter(Mascota.id == mascota_id).first()
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    
    return MascotaResponse(
        id=mascota.id,
        nombre=mascota.nombre,
        raza=mascota.raza,
        edad=mascota.edad,
        descripcion=mascota.descripcion,
        imagen_url=mascota.imagen_url,
        fecha_ingreso=mascota.fecha_ingreso.isoformat() if mascota.fecha_ingreso else ""
    )

@app.delete("/api/mascotas/{mascota_id}")
async def eliminar_mascota(mascota_id: int, db: Session = Depends(get_db)):
    #elimina una mascota del refugio
    mascota = db.query(Mascota).filter(Mascota.id == mascota_id).first()
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    
    try:
        db.delete(mascota)
        db.commit()
        return {"mensaje": "Mascota eliminada exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar mascota: {str(e)}")

@app.get("/")
async def root():
    return {
        "mensaje": "🐾 API del Refugio de Mascotas funcionando correctamente",
        "version": "1.0.0",
        "database": "MySQL",
        "endpoints": {
            "documentacion": "/docs",
            "razas_externas": "/api/razas",
            "mascotas_refugio": "/api/mascotas"
        }
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    #verifica el estado de la aplicación y base de datos
    try:
        db.execute("SELECT 1") #prueba la conexion con la base de datos
        
        total_mascotas = db.query(Mascota).count()
        
        return {
            "status": "healthy",
            "database": "connected",
            "total_mascotas": total_mascotas,
            "timestamp": "2024-01-01T00:00:00"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión a la base de datos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🐾 Iniciando Refugio de Mascotas...")
    print("📡 API disponible en: http://localhost:8000")
    print("📖 Documentación en: http://localhost:8000/docs")
    print("💾 Base de datos: MySQL")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)