-- tabla para almacenar las mascotas del refugio
CREATE TABLE IF NOT EXISTS mascotas (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    raza VARCHAR(100) NOT NULL,
    edad INTEGER NOT NULL CHECK (edad >= 0),
    descripcion TEXT,
    imagen_url VARCHAR(500),
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- indices que mejoran el rendimiento
    INDEX idx_raza (raza),
    INDEX idx_edad (edad),
    INDEX idx_fecha_ingreso (fecha_ingreso)
);

-- ejemplos para pruebas
INSERT INTO mascotas (nombre, raza, edad, descripcion, imagen_url) VALUES
('Max', 'golden retriever', 3, 'Perro muy cariñoso y juguetón. Le encanta jugar con pelotas y nadar. Ideal para familias con niños.', 'https://images.dog.ceo/breeds/retriever-golden/n02099601_1004.jpg'),
('Luna', 'labrador', 2, 'Perra muy inteligente y obediente. Perfecta para ser entrenada. Busca una familia activa.', 'https://images.dog.ceo/breeds/labrador/n02099712_332.jpg'),
('Rocky', 'bulldog', 4, 'Aunque su aspecto es rudo, es muy gentil y tranquilo. Ideal para apartamentos.', 'https://images.dog.ceo/breeds/bulldog-english/n02096585_1023.jpg'),
('Bella', 'beagle', 1, 'Cachorra muy enérgica y curiosa. Necesita ejercicio diario y mucho amor.', 'https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg'),
('Charlie', 'husky', 5, 'Perro con mucha energía que necesita ejercicio constante. Muy leal y protector.', 'https://images.dog.ceo/breeds/husky/n02110185_1469.jpg');

-- datos iniciales 
INSERT INTO tipos_mascota (nombre, descripcion) VALUES
('Perro', 'Perros de todas las razas y tamaños'),
('Gato', 'Gatos domésticos y de diferentes razas'),
('Conejo', 'Conejos domésticos'),
('Otro', 'Otras mascotas pequeñas');

-- vistas para algunas consultas
CREATE VIEW IF NOT EXISTS vista_mascotas_resumen AS
SELECT 
    id,
    nombre,
    raza,
    edad,
    CASE 
        WHEN edad <= 1 THEN 'Cachorro'
        WHEN edad <= 3 THEN 'Joven'
        WHEN edad <= 7 THEN 'Adulto'
        ELSE 'Senior'
    END as categoria_edad,
    descripcion,
    fecha_ingreso,
    DATEDIFF(CURRENT_DATE, fecha_ingreso) as dias_en_refugio
FROM mascotas;

-- indices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_nombre ON mascotas(nombre);
CREATE INDEX IF NOT EXISTS idx_raza_edad ON mascotas(raza, edad);

-- comentarios para identificar mejor las tablas
COMMENT ON TABLE mascotas IS 'Tabla principal que almacena información de las mascotas en el refugio';
COMMENT ON COLUMN mascotas.nombre IS 'Nombre de la mascota';
COMMENT ON COLUMN mascotas.raza IS 'Raza de la mascota';
COMMENT ON COLUMN mascotas.edad IS 'Edad de la mascota en años';
COMMENT ON COLUMN mascotas.descripcion IS 'Descripción detallada de la mascota';
COMMENT ON COLUMN mascotas.imagen_url IS 'URL de la imagen de la mascota';
COMMENT ON COLUMN mascotas.fecha_ingreso IS 'Fecha de ingreso al refugio';