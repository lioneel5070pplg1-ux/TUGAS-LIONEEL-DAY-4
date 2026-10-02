/**
 * DAPUR LIONEEL - RESTAURANT FRONTEND APPLICATION
 * Vanilla JS Application for Menu Management & Browsing
 */

// Otomatis deteksi URL API: gunakan relative path jika disajikan dari host yang sama, atau fallback ke http://localhost:3000/api
const API_BASE = (window.location.origin && window.location.origin.includes(':3000'))
    ? '/api'
    : 'http://localhost:3000/api';

// Application State
const state = {
    search: '',
    category: 'Semua',
    status: 'semua',
    sortBy: 'id',
    order: 'DESC',
    page: 1,
    limit: 12,
    totalPages: 1,
    totalItems: 0,
    items: [],
    categories: [],
    stats: null,
    deleteTargetId: null,
    currentDetailItem: null
};

// DOM Elements
const elements = {
    serverStatus: document.getElementById('serverStatus'),
    searchInput: document.getElementById('searchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    sortSelect: document.getElementById('sortSelect'),
    statusFilter: document.getElementById('statusFilter'),
    btnResetFilters: document.getElementById('btnResetFilters'),
    categoriesContainer: document.getElementById('categoriesContainer'),
    badgeAll: document.getElementById('badgeAll'),
    resultInfoText: document.getElementById('resultInfoText'),
    limitSelect: document.getElementById('limitSelect'),
    menuGrid: document.getElementById('menuGrid'),
    emptyState: document.getElementById('emptyState'),
    btnEmptyReset: document.getElementById('btnEmptyReset'),
    paginationContainer: document.getElementById('paginationContainer'),
    btnPrevPage: document.getElementById('btnPrevPage'),
    btnNextPage: document.getElementById('btnNextPage'),
    pageNumbers: document.getElementById('pageNumbers'),

    // Stats
    statTotalMenu: document.getElementById('statTotalMenu'),
    statTotalKategori: document.getElementById('statTotalKategori'),
    statHargaMin: document.getElementById('statHargaMin'),
    statTersedia: document.getElementById('statTersedia'),

    // Modals
    btnOpenAddModal: document.getElementById('btnOpenAddModal'),
    menuModal: document.getElementById('menuModal'),
    modalTitle: document.getElementById('modalTitle'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCancelModal: document.getElementById('btnCancelModal'),
    menuForm: document.getElementById('menuForm'),
    menuId: document.getElementById('menuId'),
    inputNama: document.getElementById('inputNama'),
    inputKategori: document.getElementById('inputKategori'),
    inputHarga: document.getElementById('inputHarga'),
    inputStatus: document.getElementById('inputStatus'),
    inputDeskripsi: document.getElementById('inputDeskripsi'),
    inputGambar: document.getElementById('inputGambar'),
    imagePreview: document.getElementById('imagePreview'),
    btnSubmitMenu: document.getElementById('btnSubmitMenu'),

    // Detail Modal
    detailModal: document.getElementById('detailModal'),
    btnCloseDetail: document.getElementById('btnCloseDetail'),
    detailHeroImage: document.getElementById('detailHeroImage'),
    detailCategory: document.getElementById('detailCategory'),
    detailNama: document.getElementById('detailNama'),
    detailHarga: document.getElementById('detailHarga'),
    detailStatus: document.getElementById('detailStatus'),
    detailDeskripsi: document.getElementById('detailDeskripsi'),
    detailId: document.getElementById('detailId'),
    detailCreatedAt: document.getElementById('detailCreatedAt'),
    btnEditFromDetail: document.getElementById('btnEditFromDetail'),
    btnDeleteFromDetail: document.getElementById('btnDeleteFromDetail'),

    // Confirm Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteTargetName: document.getElementById('deleteTargetName'),
    btnCancelDelete: document.getElementById('btnCancelDelete'),
    btnConfirmDelete: document.getElementById('btnConfirmDelete'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ========================================================
// FORMATTERS & UTILITIES
// ========================================================

function formatRupiah(number) {
    const num = Math.round(Number(number) || 0);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '🔔'}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

// ========================================================
// API INTERACTIONS
// ========================================================

async function checkServerHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            elements.serverStatus.className = 'server-status online';
            elements.serverStatus.querySelector('.status-text').textContent = 'API Terhubung';
        } else {
            throw new Error();
        }
    } catch {
        elements.serverStatus.className = 'server-status offline';
        elements.serverStatus.querySelector('.status-text').textContent = 'API Terputus';
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/menu/stats`);
        const json = await res.json();
        if (json.success && json.data) {
            state.stats = json.data;
            elements.statTotalMenu.textContent = json.data.totalMenu || 0;
            elements.statTotalKategori.textContent = json.data.totalKategori || 0;
            elements.statHargaMin.textContent = formatRupiah(json.data.hargaTerendah);
            elements.statTersedia.textContent = `${json.data.totalTersedia} Menu`;
            if (elements.badgeAll) {
                elements.badgeAll.textContent = json.data.totalMenu;
            }
        }
    } catch (err) {
        console.warn('Gagal memuat statistik:', err);
    }
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/menu/categories`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            state.categories = json.data;
            renderCategories();
        }
    } catch (err) {
        console.warn('Gagal memuat kategori:', err);
    }
}

function renderCategories() {
    // Pertahankan tombol "Semua"
    const isAllActive = state.category === 'Semua';
    let html = `
        <button class="cat-pill ${isAllActive ? 'active' : ''}" data-category="Semua">
            Semua Menu <span class="badge" id="badgeAll">${state.stats ? state.stats.totalMenu : '...'}</span>
        </button>
    `;

    state.categories.forEach(cat => {
        const isActive = state.category === cat.kategori;
        html += `
            <button class="cat-pill ${isActive ? 'active' : ''}" data-category="${escapeHtml(cat.kategori)}">
                ${escapeHtml(cat.kategori)} <span class="badge">${cat.count}</span>
            </button>
        `;
    });

    elements.categoriesContainer.innerHTML = html;

    // Attach listeners
    elements.categoriesContainer.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            if (state.category !== cat) {
                state.category = cat;
                state.page = 1;
                renderCategories();
                loadMenu();
            }
        });
    });
}

async function loadMenu() {
    renderLoadingSkeletons();

    try {
        const params = new URLSearchParams();
        params.append('page', state.page);
        params.append('limit', state.limit);
        params.append('sortBy', state.sortBy);
        params.append('order', state.order);

        if (state.search.trim()) {
            params.append('search', state.search.trim());
        }
        if (state.category && state.category !== 'Semua') {
            params.append('kategori', state.category);
        }
        if (state.status && state.status !== 'semua') {
            params.append('status', state.status);
        }

        const res = await fetch(`${API_BASE}/menu?${params.toString()}`);
        if (!res.ok) throw new Error('Gagal mengambil data menu');

        const json = await res.json();
        state.items = json.data || [];
        state.totalItems = json.pagination.totalItems;
        state.totalPages = json.pagination.totalPages;
        state.page = json.pagination.currentPage;

        renderMenuGrid();
        renderPagination();
        updateResultInfo();

    } catch (err) {
        console.error('Error loadMenu:', err);
        elements.menuGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠️</div>
                <h3>Gagal Memuat Menu</h3>
                <p>Pastikan server backend di port 3000 sedang berjalan.</p>
                <button class="btn btn-primary" onclick="loadMenu()">Coba Lagi</button>
            </div>
        `;
        elements.emptyState.classList.add('hidden');
        elements.paginationContainer.classList.add('hidden');
    }
}

function renderLoadingSkeletons() {
    const count = state.limit > 0 ? Math.min(state.limit, 6) : 6;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += '<div class="skeleton-card"></div>';
    }
    elements.menuGrid.innerHTML = html;
    elements.emptyState.classList.add('hidden');
}

function updateResultInfo() {
    if (state.totalItems === 0) {
        elements.resultInfoText.textContent = 'Tidak ada hidangan yang ditemukan';
        return;
    }
    const start = state.limit === 0 ? 1 : ((state.page - 1) * state.limit) + 1;
    const end = state.limit === 0 ? state.totalItems : Math.min(state.page * state.limit, state.totalItems);
    elements.resultInfoText.textContent = `Menampilkan ${start} - ${end} dari ${state.totalItems} hidangan`;
}

function renderMenuGrid() {
    if (state.items.length === 0) {
        elements.menuGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        elements.paginationContainer.classList.add('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');
    elements.paginationContainer.classList.remove('hidden');

    let html = '';
    state.items.forEach(item => {
        const isTersedia = item.status === 'tersedia';
        const imgUrl = item.gambar || DEFAULT_FOOD_IMAGE;

        html += `
            <article class="menu-card" data-id="${item.id}">
                <div class="card-image-box">
                    <img 
                        src="${escapeHtml(imgUrl)}" 
                        alt="${escapeHtml(item.nama)}" 
                        class="card-img" 
                        loading="lazy" 
                        onerror="this.onerror=null; this.src='${DEFAULT_FOOD_IMAGE}';"
                    >
                    <span class="card-category-badge">${escapeHtml(item.kategori)}</span>
                    <span class="card-status-badge ${isTersedia ? 'status-tersedia' : 'status-habis'}">
                        ${isTersedia ? 'Tersedia' : 'Habis'}
                    </span>
                </div>
                <div class="card-content">
                    <h3 class="card-title" title="Klik untuk lihat detail">${escapeHtml(item.nama)}</h3>
                    <p class="card-desc">${escapeHtml(item.deskripsi || 'Hidangan istimewa khas racikan chef berpengalaman.')}</p>
                    <div class="card-footer">
                        <div class="card-price">${formatRupiah(item.harga)}</div>
                        <div class="card-actions">
                            <button class="action-btn view-btn" title="Detail Lengkap" data-id="${item.id}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                            <button class="action-btn edit-btn" title="Edit Hidangan" data-id="${item.id}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="action-btn delete-btn" title="Hapus Hidangan" data-id="${item.id}" data-name="${escapeHtml(item.nama)}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    });

    elements.menuGrid.innerHTML = html;

    // Attach card event listeners
    elements.menuGrid.querySelectorAll('.menu-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const item = state.items.find(i => String(i.id) === String(id));

        // Click title to view detail
        card.querySelector('.card-title').addEventListener('click', () => openDetailModal(item));

        // View detail button
        card.querySelector('.view-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openDetailModal(item);
        });

        // Edit button
        card.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(item);
        });

        // Delete button
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(item);
        });
    });
}

// ========================================================
// PAGINATION
// ========================================================

function renderPagination() {
    if (state.totalPages <= 1) {
        elements.paginationContainer.classList.add('hidden');
        return;
    }

    elements.paginationContainer.classList.remove('hidden');
    elements.btnPrevPage.disabled = state.page <= 1;
    elements.btnNextPage.disabled = state.page >= state.totalPages;

    let html = '';
    const total = state.totalPages;
    const current = state.page;

    const range = [];
    range.push(1);

    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        range.push(i);
    }

    if (total > 1) {
        range.push(total);
    }

    // Buat array unik yang sudah diurutkan
    const uniquePages = [...new Set(range)].sort((a, b) => a - b);

    let last = 0;
    uniquePages.forEach(p => {
        if (p - last > 1) {
            html += `<span class="num-ellipsis">...</span>`;
        }
        html += `
            <button class="num-btn ${p === current ? 'active' : ''}" data-page="${p}">
                ${p}
            </button>
        `;
        last = p;
    });

    elements.pageNumbers.innerHTML = html;

    elements.pageNumbers.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageNum = parseInt(btn.getAttribute('data-page'));
            if (pageNum !== state.page) {
                state.page = pageNum;
                loadMenu();
                window.scrollTo({ top: 350, behavior: 'smooth' });
            }
        });
    });
}

// ========================================================
// MODAL HANDLERS
// ========================================================

function openAddModal() {
    elements.modalTitle.textContent = 'Tambah Menu Baru';
    elements.menuForm.reset();
    elements.menuId.value = '';
    elements.inputStatus.value = 'tersedia';
    elements.imagePreview.src = '';
    elements.imagePreview.classList.add('hidden');
    elements.menuModal.classList.remove('hidden');
    elements.inputNama.focus();
}

function openEditModal(item) {
    if (!item) return;
    elements.modalTitle.textContent = 'Edit Hidangan';
    elements.menuId.value = item.id;
    elements.inputNama.value = item.nama;
    elements.inputKategori.value = item.kategori;
    elements.inputHarga.value = item.harga;
    elements.inputStatus.value = item.status || 'tersedia';
    elements.inputDeskripsi.value = item.deskripsi || '';
    elements.inputGambar.value = item.gambar || '';

    if (item.gambar) {
        elements.imagePreview.src = item.gambar;
        elements.imagePreview.classList.remove('hidden');
    } else {
        elements.imagePreview.src = '';
        elements.imagePreview.classList.add('hidden');
    }

    elements.menuModal.classList.remove('hidden');
    elements.inputNama.focus();
}

function closeMenuModal() {
    elements.menuModal.classList.add('hidden');
}

function openDetailModal(item) {
    if (!item) return;
    state.currentDetailItem = item;

    const imgUrl = item.gambar || DEFAULT_FOOD_IMAGE;
    elements.detailHeroImage.style.backgroundImage = `url('${imgUrl}')`;
    elements.detailCategory.textContent = item.kategori;
    elements.detailNama.textContent = item.nama;
    elements.detailHarga.textContent = formatRupiah(item.harga);

    const isTersedia = item.status === 'tersedia';
    elements.detailStatus.textContent = isTersedia ? 'Tersedia' : 'Habis';
    elements.detailStatus.className = `status-badge ${isTersedia ? 'status-tersedia' : 'status-habis'}`;

    elements.detailDeskripsi.textContent = item.deskripsi || 'Tidak ada deskripsi khusus untuk menu ini.';
    elements.detailId.textContent = `#${item.id}`;
    elements.detailCreatedAt.textContent = formatDate(item.created_at);

    elements.detailModal.classList.remove('hidden');
}

function closeDetailModal() {
    elements.detailModal.classList.add('hidden');
    state.currentDetailItem = null;
}

function openDeleteModal(item) {
    if (!item) return;
    state.deleteTargetId = item.id;
    elements.deleteTargetName.textContent = `"${item.nama}"`;
    elements.deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    elements.deleteModal.classList.add('hidden');
    state.deleteTargetId = null;
}

// ========================================================
// FORM SUBMIT & CRUD OPERATIONS
// ========================================================

async function handleMenuSubmit(e) {
    e.preventDefault();

    const id = elements.menuId.value;
    const isEdit = Boolean(id);

    const payload = {
        nama: elements.inputNama.value.trim(),
        kategori: elements.inputKategori.value.trim(),
        harga: parseFloat(elements.inputHarga.value),
        status: elements.inputStatus.value,
        deskripsi: elements.inputDeskripsi.value.trim(),
        gambar: elements.inputGambar.value.trim() || null
    };

    if (!payload.nama || !payload.kategori || isNaN(payload.harga) || payload.harga <= 0) {
        showToast('Mohon lengkapi nama, kategori, dan harga yang valid.', 'error');
        return;
    }

    elements.btnSubmitMenu.disabled = true;
    elements.btnSubmitMenu.querySelector('.btn-text').textContent = 'Menyimpan...';

    try {
        const url = isEdit ? `${API_BASE}/menu/${id}` : `${API_BASE}/menu`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Gagal menyimpan menu');
        }

        showToast(isEdit ? 'Menu berhasil diperbarui!' : 'Menu baru berhasil ditambahkan!', 'success');
        closeMenuModal();

        // Refresh stats, categories & current page
        await Promise.all([loadStats(), loadCategories()]);
        await loadMenu();

    } catch (err) {
        console.error('Submit error:', err);
        showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
        elements.btnSubmitMenu.disabled = false;
        elements.btnSubmitMenu.querySelector('.btn-text').textContent = 'Simpan Menu';
    }
}

async function handleDeleteMenu() {
    if (!state.deleteTargetId) return;

    elements.btnConfirmDelete.disabled = true;
    elements.btnConfirmDelete.textContent = 'Menghapus...';

    try {
        const res = await fetch(`${API_BASE}/menu/${state.deleteTargetId}`, {
            method: 'DELETE'
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Gagal menghapus menu');
        }

        showToast('Menu berhasil dihapus.', 'info');
        closeDeleteModal();
        closeDetailModal();

        // Refresh
        await Promise.all([loadStats(), loadCategories()]);
        await loadMenu();

    } catch (err) {
        console.error('Delete error:', err);
        showToast(err.message || 'Gagal menghapus menu', 'error');
    } finally {
        elements.btnConfirmDelete.disabled = false;
        elements.btnConfirmDelete.textContent = 'Ya, Hapus Sekarang';
    }
}

// ========================================================
// SEARCH & FILTER EVENTS
// ========================================================

let searchDebounceTimer = null;
elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    elements.btnClearSearch.style.display = val ? 'block' : 'none';

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        state.search = val;
        state.page = 1;
        loadMenu();
    }, 300);
});

elements.btnClearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.style.display = 'none';
    state.search = '';
    state.page = 1;
    loadMenu();
});

elements.sortSelect.addEventListener('change', (e) => {
    const [sortBy, order] = e.target.value.split('-');
    state.sortBy = sortBy;
    state.order = order.toUpperCase();
    state.page = 1;
    loadMenu();
});

elements.statusFilter.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    loadMenu();
});

elements.limitSelect.addEventListener('change', (e) => {
    state.limit = parseInt(e.target.value);
    state.page = 1;
    loadMenu();
});

function resetAllFilters() {
    state.search = '';
    state.category = 'Semua';
    state.status = 'semua';
    state.sortBy = 'id';
    state.order = 'DESC';
    state.page = 1;

    elements.searchInput.value = '';
    elements.btnClearSearch.style.display = 'none';
    elements.sortSelect.value = 'id-desc';
    elements.statusFilter.value = 'semua';

    renderCategories();
    loadMenu();
}

elements.btnResetFilters.addEventListener('click', resetAllFilters);
elements.btnEmptyReset.addEventListener('click', resetAllFilters);

// Pagination Prev/Next
elements.btnPrevPage.addEventListener('click', () => {
    if (state.page > 1) {
        state.page--;
        loadMenu();
        window.scrollTo({ top: 350, behavior: 'smooth' });
    }
});

elements.btnNextPage.addEventListener('click', () => {
    if (state.page < state.totalPages) {
        state.page++;
        loadMenu();
        window.scrollTo({ top: 350, behavior: 'smooth' });
    }
});

// Image URL preview listener
elements.inputGambar.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
        elements.imagePreview.src = url;
        elements.imagePreview.classList.remove('hidden');
        elements.imagePreview.onerror = () => {
            elements.imagePreview.src = DEFAULT_FOOD_IMAGE;
        };
    } else {
        elements.imagePreview.src = '';
        elements.imagePreview.classList.add('hidden');
    }
});

// Modal Actions
elements.btnOpenAddModal.addEventListener('click', openAddModal);
elements.btnCloseModal.addEventListener('click', closeMenuModal);
elements.btnCancelModal.addEventListener('click', closeMenuModal);
elements.menuForm.addEventListener('submit', handleMenuSubmit);

// Detail Modal Actions
elements.btnCloseDetail.addEventListener('click', closeDetailModal);
elements.btnEditFromDetail.addEventListener('click', () => {
    const item = state.currentDetailItem;
    closeDetailModal();
    openEditModal(item);
});
elements.btnDeleteFromDetail.addEventListener('click', () => {
    const item = state.currentDetailItem;
    openDeleteModal(item);
});

// Delete Modal Actions
elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
elements.btnConfirmDelete.addEventListener('click', handleDeleteMenu);

// Close modals when clicking backdrop
[elements.menuModal, elements.detailModal, elements.deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// Close modals on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenuModal();
        closeDetailModal();
        closeDeleteModal();
    }
});

// ========================================================
// INITIALIZATION
// ========================================================

async function init() {
    await checkServerHealth();
    await Promise.all([
        loadStats(),
        loadCategories()
    ]);
    await loadMenu();

    // Check health periodically every 30 seconds
    setInterval(checkServerHealth, 30000);
}

document.addEventListener('DOMContentLoaded', init);


// Fitur unik Dapur Lioneel: rekomendasi berdasarkan mood.
(() => {
  const button = document.getElementById('btnMoodPick');
  const select = document.getElementById('moodSelect');
  const result = document.getElementById('moodResult');
  if (!button || !select || !result) return;
  const moodLabels = {
    comfort: { title: 'Comfort food time!', terms: ['mie', 'soto', 'sup', 'nasi', 'ayam'], fallback: 'Coba hidangan hangat seperti soto, mie, atau nasi ayam.' },
    fresh: { title: 'Segar dan ringan 🌿', terms: ['salad', 'jus', 'sayur', 'ikan', 'buah'], fallback: 'Cari menu sayuran, salad, ikan, atau minuman buah.' },
    bold: { title: 'Saatnya rasa berani 🌶️', terms: ['pedas', 'sambal', 'rica', 'balado', 'cabe'], fallback: 'Coba menu bercita rasa pedas atau berbumbu rempah.' },
    sweet: { title: 'Manis untuk harimu 🍰', terms: ['dessert', 'cake', 'cokelat', 'es krim', 'puding'], fallback: 'Lihat kategori dessert atau minuman manis untuk penutup.' },
    thrifty: { title: 'Enak tanpa bikin boros 💛', terms: [], fallback: 'Urutkan menu berdasarkan harga untuk menemukan pilihan yang pas di kantong.' }
  };
  button.addEventListener('click', async () => {
    const mood = moodLabels[select.value] || moodLabels.comfort;
    button.disabled = true; button.textContent = 'Mencari rasa yang cocok...';
    try {
      const response = await fetch('/api/menu?limit=100');
      const payload = await response.json();
      const candidates = Array.isArray(payload) ? payload : (payload.data || payload.items || payload.menu || []);
      let found = [];
      if (Array.isArray(candidates) && candidates.length) {
        if (select.value === 'thrifty') {
          found = [...candidates].sort((a,b) => Number(a.harga || a.price || 0) - Number(b.harga || b.price || 0)).slice(0,1);
        } else {
          found = candidates.filter(item => {
            const text = [item.nama, item.name, item.kategori, item.category, item.deskripsi, item.description].join(' ').toLowerCase();
            return mood.terms.some(term => text.includes(term));
          });
          if (!found.length) found = candidates;
          found = found.slice(0,1);
        }
      }
      if (found.length) {
        const item = found[0];
        const name = item.nama || item.name || item.nama_menu || 'Menu pilihan';
        const price = Number(item.harga || item.price || item.harga_menu || 0);
        result.innerHTML = '<span class="mood-result-icon">✨</span><div><strong>' + mood.title + '</strong><p>Rekomendasi untukmu: <b>' + escapeMoodText(name) + '</b></p>' + (price ? '<p class="mood-price">' + new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(price) + '</p>' : '') + '<a class="mood-search-link" href="#menuGrid" id="moodJump">Lihat koleksi menu ↓</a></div>';
        document.getElementById('moodJump')?.addEventListener('click', () => { const search = document.getElementById('searchInput'); if(search){search.value=name;search.dispatchEvent(new Event('input',{bubbles:true}));} });
      } else {
        result.innerHTML = '<span class="mood-result-icon">🍽️</span><div><strong>' + mood.title + '</strong><p>' + mood.fallback + ' Pastikan API dan database sudah berjalan agar rekomendasi menu bisa diambil.</p></div>';
      }
    } catch (error) {
      result.innerHTML = '<span class="mood-result-icon">🍽️</span><div><strong>' + mood.title + '</strong><p>' + mood.fallback + ' Sambungkan server API untuk rekomendasi otomatis.</p></div>';
    } finally { button.disabled = false; button.textContent = '✨ Temukan Menu'; }
  });
  function escapeMoodText(value) { const el = document.createElement('span'); el.textContent = String(value ?? ''); return el.innerHTML; }
})();
