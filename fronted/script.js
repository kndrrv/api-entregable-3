//configura la API
const API_BASE_URL = 'http://localhost:8000';

let app = {
    currentSection: 'explorar',
    razas: [],
    mascotas: [],
    filteredRazas: []
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    showSection('explorar');
    setupNavigation();
    setupModal();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.id.replace('btn-', '');
            showSection(sectionId);

            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.seccion');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(`seccion-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        app.currentSection = sectionId;

        switch(sectionId) {
            case 'explorar':
                if (app.razas.length === 0) {
                    loadRazas();
                }
                break;
            case 'refugio':
                loadMascotas();
                break;
            case 'agregar':
                loadRazasForForm();
                break;
        }
    }
}

function setupEventListeners() {

    document.getElementById('buscar-raza').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        filterRazas(query);
    });
    
    document.getElementById('btn-buscar').addEventListener('click', function() {
        const query = document.getElementById('buscar-raza').value;
        if (query) {
            searchRazaImage(query);
        }
    });
    
    document.getElementById('btn-aleatorio').addEventListener('click', loadRandomImages);
    
    document.getElementById('form-mascota').addEventListener('submit', handleMascotaSubmit);
    
    document.getElementById('btn-imagen-raza').addEventListener('click', getImageForSelectedRaza);

    document.getElementById('buscar-raza').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value;
            if (query) {
                searchRazaImage(query);
            }
        }
    });
}

function loadInitialData() {
    loadRazas();
    loadRandomImages();
}

async function loadRazas() {
    try {
        showLoading('lista-razas');
        const response = await fetch(`${API_BASE_URL}/api/razas`);
        
        if (!response.ok) {
            throw new Error('Error al cargar razas');
        }
        
        const data = await response.json();
        app.razas = data.razas;
        app.filteredRazas = data.razas;
        displayRazas(app.filteredRazas);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar las razas de perros');
        document.getElementById('lista-razas').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar razas</h3>
                <p>No se pudieron cargar las razas. Verifica tu conexión.</p>
            </div>
        `;
    }
}

function displayRazas(razas) {
    const container = document.getElementById('lista-razas');
    
    if (razas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No se encontraron razas</h3>
                <p>Intenta con otro término de búsqueda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = razas.map(raza => `
        <div class="raza-item" onclick="searchRazaImage('${raza}')">
            <i class="fas fa-dog"></i>
            <h3>${raza}</h3>
            <p>Click para ver imagen</p>
        </div>
    `).join('');
}

function filterRazas(query) {
    app.filteredRazas = app.razas.filter(raza => 
        raza.toLowerCase().includes(query)
    );
    displayRazas(app.filteredRazas);
}

async function searchRazaImage(raza) {
    try {
        showLoading('galeria-imagenes');
        const response = await fetch(`${API_BASE_URL}/api/imagen-raza/${encodeURIComponent(raza)}`);
        
        if (!response.ok) {
            throw new Error('Raza no encontrada');
        }
        
        const data = await response.json();
        displaySingleImage(data.message, raza);
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error al buscar imagen para la raza: ${raza}`);
        document.getElementById('galeria-imagenes').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Imagen no encontrada</h3>
                <p>No se pudo encontrar una imagen para esta raza</p>
            </div>
        `;
    }
}

function displaySingleImage(imageUrl, raza) {
    const container = document.getElementById('galeria-imagenes');
    container.innerHTML = `
        <div class="imagen-item fade-in">
            <img src="${imageUrl}" alt="${raza}" onclick="showImageModal('${imageUrl}', '${raza}')">
            <div class="imagen-info">
                <h3>${raza}</h3>
                <p>Click en la imagen para verla en grande</p>
            </div>
        </div>
    `;
}

async function loadRandomImages() {
    try {
        showLoading('galeria-imagenes');
        const response = await fetch(`${API_BASE_URL}/api/imagenes-aleatorias?cantidad=6`);
        
        if (!response.ok) {
            throw new Error('Error al cargar imágenes');
        }
        
        const data = await response.json();
        displayRandomImages(data.message);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar imágenes aleatorias');
    }
}

function displayRandomImages(images) {
    const container = document.getElementById('galeria-imagenes');
    container.innerHTML = images.map((imageUrl, index) => `
        <div class="imagen-item fade-in" style="animation-delay: ${index * 0.1}s">
            <img src="${imageUrl}" alt="Perro aleatorio" onclick="showImageModal('${imageUrl}', 'Perro aleatorio')">
            <div class="imagen-info">
                <h3>Perro aleatorio</h3>
                <p>Click para ver en grande</p>
            </div>
        </div>
    `).join('');
}

async function loadMascotas() {
    try {
        showLoading('mascotas-refugio');
        const response = await fetch(`${API_BASE_URL}/api/mascotas`);
        
        if (!response.ok) {
            throw new Error('Error al cargar mascotas');
        }
        
        const mascotas = await response.json();
        app.mascotas = mascotas;
        displayMascotas(mascotas);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar las mascotas del refugio');
        document.getElementById('mascotas-refugio').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar mascotas</h3>
                <p>No se pudieron cargar las mascotas del refugio</p>
            </div>
        `;
    }
}

function displayMascotas(mascotas) {
    const container = document.getElementById('mascotas-refugio');
    
    if (mascotas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>No hay mascotas registradas</h3>
                <p>Agrega la primera mascota al refugio</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = mascotas.map(mascota => `
        <div class="mascota-card fade-in">
            ${mascota.imagen_url ? 
                `<img src="${mascota.imagen_url}" alt="${mascota.nombre}" class="mascota-imagen">` :
                `<div class="mascota-imagen"><i class="fas fa-paw"></i></div>`
            }
            <div class="mascota-info">
                <h3>${mascota.nombre}</h3>
                <div class="mascota-meta">
                    <span><i class="fas fa-dog"></i> ${mascota.raza}</span>
                    <span><i class="fas fa-calendar"></i> ${mascota.edad} años</span>
                </div>
                <div class="mascota-descripcion">
                    ${mascota.descripcion || 'Sin descripción disponible'}
                </div>
                <div class="mascota-acciones">
                    <button class="btn-eliminar" onclick="deleteMascota(${mascota.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadRazasForForm() {
    if (app.razas.length === 0) {
        await loadRazas();
    }
    
    const select = document.getElementById('raza');
    select.innerHTML = '<option value="">Selecciona una raza</option>' + 
        app.razas.map(raza => `<option value="${raza}">${raza}</option>`).join('');
}

async function handleMascotaSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/mascotas`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Error al crear mascota');
        }
        
        const nuevaMascota = await response.json();
        showSuccess('Mascota agregada exitosamente');
       
        e.target.reset();
        
        if (app.currentSection === 'refugio') {
            loadMascotas();
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al agregar la mascota');
    }
}

async function getImageForSelectedRaza() {
    const razaSelect = document.getElementById('raza');
    const raza = razaSelect.value;
    
    if (!raza) {
        showError('Por favor selecciona una raza primero');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/imagen-raza/${encodeURIComponent(raza)}`);
        
        if (!response.ok) {
            throw new Error('Error al obtener imagen');
        }
        
        const data = await response.json();
        document.getElementById('imagen_url').value = data.message;
        showSuccess('Imagen cargada exitosamente');
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al obtener imagen de la raza');
    }
}

async function deleteMascota(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/mascotas/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar mascota');
        }
        
        showSuccess('Mascota eliminada exitosamente');
        loadMascotas();
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar la mascota');
    }
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Cargando...
        </div>
    `;
}

function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showImageModal(imageUrl, title) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h2>${title}</h2>
        <img src="${imageUrl}" alt="${title}" style="width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;">
    `;
    
    modal.style.display = 'block';
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificaciones');
    const notification = document.createElement('div');
    notification.className = `notificacion ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
        ${message}
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
