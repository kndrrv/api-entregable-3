from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

#configuración de MySQL
DATABASE_URL = "mysql+mysqlconnector://root:051200@localhost:3306/refugio_mascotas"

#crea el engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

#modelo de la tabla mascotas
class Mascota(Base):
    __tablename__ = "mascotas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    raza = Column(String(100), nullable=False)
    edad = Column(Integer, nullable=False)
    descripcion = Column(Text)
    imagen_url = Column(String(500))
    fecha_ingreso = Column(DateTime, default=datetime.utcnow)

#obtiene la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#crea las tablas y datos iniciales
def create_tables_and_data():
    try:
        #crea todas las tablas
        Base.metadata.create_all(bind=engine)
        
        #agrega datos de ejemplo si no existen
        db = SessionLocal()
        if db.query(Mascota).count() == 0:
            mascotas_ejemplo = [
                Mascota(
                    nombre="Max",
                    raza="golden retriever",
                    edad=3,
                    descripcion="Perro muy cariñoso y juguetón. Le encanta jugar con pelotas y nadar.",
                    imagen_url="https://images.dog.ceo/breeds/retriever-golden/n02099601_1004.jpg"
                ),
                Mascota(
                    nombre="Luna",
                    raza="labrador",
                    edad=2,
                    descripcion="Perra muy inteligente y obediente. Perfecta para ser entrenada.",
                    imagen_url="https://images.dog.ceo/breeds/labrador/n02099712_332.jpg"
                ),
                Mascota(
                    nombre="Rocky",
                    raza="bulldog",
                    edad=4,
                    descripcion="Aunque su aspecto es rudo, es muy gentil y tranquilo.",
                    imagen_url="https://images.dog.ceo/breeds/bulldog-english/n02096585_1023.jpg"
                ),
                Mascota(
                    nombre="Bella",
                    raza="beagle",
                    edad=1,
                    descripcion="Cachorra muy enérgica y curiosa. Necesita ejercicio diario.",
                    imagen_url="https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg"
                )
            ]
            
            for mascota in mascotas_ejemplo:
                db.add(mascota)
            db.commit()
            print("✅ Datos de ejemplo agregados a la base de datos")
        
        db.close()
        print("✅ Base de datos configurada correctamente")
        
    except Exception as e:
        print(f"❌ Error al configurar la base de datos: {e}")
        print("💡 Asegúrate de que:")
        print("   - MySQL esté corriendo")
        print("   - La base de datos 'refugio_mascotas' exista")
        print("   - Las credenciales sean correctas")