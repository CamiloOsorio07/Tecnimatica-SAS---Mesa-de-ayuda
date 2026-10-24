(() => {
  "use strict";

  const STORAGE_KEY = "tecnimatica_helpdesk_tickets_v1";
  const initialTickets = [
    { id: "TEC-1004", requester: "Juliana Morales", email: "juliana.morales@tecnimatica.co", category: "Software industrial", subject: "Error al sincronizar datos de producción", priority: "Crítica", status: "En proceso", description: "El sistema no está sincronizando los datos del turno. Se requiere revisar la conexión con la base de datos.", createdAt: "2026-10-24T08:42:00" },
    { id: "TEC-1003", requester: "Andrés Muñoz", email: "andres.munoz@tecnimatica.co", category: "Accesos y usuarios", subject: "Restablecimiento de acceso al sistema", priority: "Media", status: "Resuelto", description: "El usuario no podía ingresar a la aplicación corporativa. Acceso restablecido y validado.", createdAt: "2026-10-23T15:10:00" },
    { id: "TEC-1002", requester: "Laura Gómez", email: "laura.gomez@tecnimatica.co", category: "Equipos y periféricos", subject: "Impresora de etiquetas sin respuesta", priority: "Alta", status: "Pendiente", description: "La impresora del área de empaque no responde a los trabajos enviados.", createdAt: "2026-10-23T11:25:00" },
    { id: "TEC-1001", requester: "Carlos Ramírez", email: "carlos.ramirez@tecnimatica.co", category: "Automatización / planta", subject: "Revisión de comunicación con equipo de planta", priority: "Crítica", status: "En proceso", description: "Se reporta intermitencia en la comunicación con un equipo de planta. Se solicita revisión técnica.", createdAt: "2026-10-22T09:05:00" },
    { id: "TEC-1000", requester: "Sofía Restrepo", email: "sofia.restrepo@tecnimatica.co", category: "Red e infraestructura", subject: "Conexión de red intermitente", priority: "Media", status: "Pendiente", description: "La conexión de red presenta interrupciones durante la jornada.", createdAt: "2026-10-21T13:40:00" }
  ];

  const categoryMeta = [
    { name: "Software industrial", icon: "▦" },
    { name: "Equipos y periféricos", icon: "▣" },
    { name: "Red e infraestructura", icon: "⌁" },
    { name: "Accesos y usuarios", icon: "⌘" },
    { name: "Automatización / planta", icon: "⚙" },
    { name: "Otros", icon: "◈" }
  ];
  const priorityMeta = [
    { name: "Crítica", className: "critical" },
    { name: "Alta", className: "high" },
    { name: "Media", className: "medium" },
    { name: "Baja", className: "low" }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  let tickets = loadTickets();
  let currentTicketId = null;
  let currentView = "dashboard";

  function loadTickets() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) { console.warn("No fue posible leer los tickets guardados.", error); }
    return initialTickets.map(ticket => ({ ...ticket }));
  }
  function saveTickets() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); }
    catch (error) { showToast("No se pudo guardar en este navegador. Revisa el almacenamiento disponible."); }
  }
  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function statusClass(status) { return `status-${normalize(status).replace(/\s+/g, "-")}`; }
  function priorityClass(priority) { return `priority-${normalize(priority).replace(/\s+/g, "-")}`; }
  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Fecha no disponible";
    return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }
  function nextTicketId() {
    const maxNumber = tickets.reduce((max, ticket) => {
      const match = String(ticket.id).match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 1000);
    return `TEC-${maxNumber + 1}`;
  }
  function showToast(message) {
    const region = $("#toastRegion");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="toast-mark">✓</span><span>${escapeHTML(message)}</span>`;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3600);
  }

  function renderMetrics() {
    $("#metricTotal").textContent = tickets.length;
    $("#metricPending").textContent = tickets.filter(t => t.status === "Pendiente").length;
    $("#metricProgress").textContent = tickets.filter(t => t.status === "En proceso").length;
    $("#metricResolved").textContent = tickets.filter(t => t.status === "Resuelto").length;
    $("#navTicketCount").textContent = tickets.filter(t => t.status !== "Resuelto").length;
  }
  function renderCategories() {
    const counts = categoryMeta.map(category => ({ ...category, count: tickets.filter(t => t.category === category.name).length }));
    $("#categoryList").innerHTML = counts.map((category, index) => `
      <div class="category-item">
        <span class="category-symbol" style="background:${index % 2 ? "#eaf8f5" : "#eaf3fc"};color:${index % 2 ? "#249884" : "#2e75b2"}">${category.icon}</span>
        <span class="category-name">${escapeHTML(category.name)}</span>
        <span class="category-count">${category.count}</span>
      </div>`).join("");
  }
  function renderPriorities() {
    const counts = priorityMeta.map(p => ({ ...p, count: tickets.filter(t => t.priority === p.name && t.status !== "Resuelto").length }));
    const max = Math.max(1, ...counts.map(p => p.count));
    $("#priorityList").innerHTML = counts.map(p => `
      <div class="priority-row">
        <span class="priority-label">${p.name}</span>
        <div class="priority-track"><div class="priority-fill priority-${p.className}" style="width:${p.count ? Math.max(5, p.count / max * 100) : 0}%"></div></div>
        <span class="priority-count">${p.count}</span>
      </div>`).join("");
  }
  function renderTable() {
    const search = normalize($("#searchInput").value.trim());
    const status = $("#statusFilter").value;
    const priority = $("#priorityFilter").value;
    const filtered = tickets.filter(ticket => {
      const matchesSearch = !search || normalize([ticket.id, ticket.requester, ticket.email, ticket.category, ticket.subject, ticket.description].join(" ")).includes(search);
      return matchesSearch && (!status || ticket.status === status) && (!priority || ticket.priority === priority);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    $("#ticketsTableBody").innerHTML = filtered.map(ticket => `
      <tr>
        <td><span class="ticket-code">${escapeHTML(ticket.id)}</span></td>
        <td><span class="requester-cell">${escapeHTML(ticket.requester)}</span></td>
        <td>${escapeHTML(ticket.category)}</td>
        <td><div class="ticket-subject">${escapeHTML(ticket.subject)}</div></td>
        <td><span class="badge ${priorityClass(ticket.priority)}">${escapeHTML(ticket.priority)}</span></td>
        <td><span class="badge ${statusClass(ticket.status)}">${escapeHTML(ticket.status)}</span></td>
        <td><button class="view-ticket" data-ticket-id="${escapeHTML(ticket.id)}">Ver ↗</button></td>
      </tr>`).join("");
    $("#emptyState").hidden = filtered.length !== 0;
    $("#tableCount").textContent = `Mostrando ${filtered.length} de ${tickets.length} solicitudes`;
  }
  function renderAll() {
    renderMetrics();
    renderCategories();
    renderPriorities();
    renderTable();
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const focusTarget = modal.querySelector("input, button, select, textarea");
    if (focusTarget) window.setTimeout(() => focusTarget.focus(), 30);
  }
  function closeModal(modal) {
    modal.hidden = true;
    if ($$(".modal-backdrop:not([hidden])").length === 0) document.body.style.overflow = "";
  }
  function openNewTicket() {
    $("#ticketForm").reset();
    openModal("ticketModal");
  }
  function openTicketDetail(id) {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;
    currentTicketId = id;
    $("#detailCode").textContent = ticket.id;
    $("#detailTitle").textContent = ticket.subject;
    $("#detailSubtitle").textContent = `Registrado el ${formatDate(ticket.createdAt)}`;
    $("#detailContent").innerHTML = `
      <div class="detail-grid">
        <div class="detail-field"><small>Solicitante</small><strong>${escapeHTML(ticket.requester)}</strong></div>
        <div class="detail-field"><small>Correo</small><strong>${escapeHTML(ticket.email)}</strong></div>
        <div class="detail-field"><small>Categoría</small><strong>${escapeHTML(ticket.category)}</strong></div>
        <div class="detail-field"><small>Prioridad / estado</small><p><span class="badge ${priorityClass(ticket.priority)}">${escapeHTML(ticket.priority)}</span> <span class="badge ${statusClass(ticket.status)}">${escapeHTML(ticket.status)}</span></p></div>
      </div>
      <div class="detail-field"><small>Descripción</small><p class="detail-description">${escapeHTML(ticket.description)}</p></div>`;
    $("#nextStatusBtn").textContent = ticket.status === "Pendiente" ? "Marcar en proceso" : ticket.status === "En proceso" ? "Marcar resuelto" : "Reabrir ticket";
    openModal("detailModal");
  }
  function advanceStatus() {
    const ticket = tickets.find(t => t.id === currentTicketId);
    if (!ticket) return;
    ticket.status = ticket.status === "Pendiente" ? "En proceso" : ticket.status === "En proceso" ? "Resuelto" : "Pendiente";
    saveTickets();
    renderAll();
    openTicketDetail(ticket.id);
    showToast(`${ticket.id}: estado actualizado a ${ticket.status.toLowerCase()}.`);
  }
  function exportCSV() {
    const headers = ["Código", "Solicitante", "Correo", "Categoría", "Asunto", "Prioridad", "Estado", "Descripción", "Fecha"];
    const rows = tickets.map(t => [t.id, t.requester, t.email, t.category, t.subject, t.priority, t.status, t.description, formatDate(t.createdAt)]);
    const csvCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets-tecnimatica-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Archivo CSV generado correctamente.");
  }
  function switchView(view) {
    currentView = view;
    const isKnowledge = view === "knowledge";
    const isTickets = view === "tickets";
    $("#dashboardOverview").hidden = isKnowledge || isTickets;
    $("#ticketsSection").hidden = isKnowledge;
    $("#knowledgeSection").hidden = !isKnowledge;
    $("#pageTitle").textContent = isKnowledge ? "Base de conocimiento" : isTickets ? "Todos los tickets" : "Panel de control";
    $("#breadcrumbCurrent").textContent = $("#pageTitle").textContent;
    $("#pageSubtitle").textContent = isKnowledge ? "Recomendaciones y guías rápidas de soporte." : isTickets ? "Busca, filtra y actualiza las solicitudes registradas." : "Visibilidad y seguimiento de las solicitudes de soporte de Tecnimática.";
    $$(".nav-link[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    if (isTickets) $("#searchInput").focus({ preventScroll: true });
    if (window.innerWidth <= 850) $("#sidebar").classList.remove("open");
  }

  $("#ticketForm").addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ticket = {
      id: nextTicketId(),
      requester: String(formData.get("requester") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      category: String(formData.get("category") || ""),
      priority: String(formData.get("priority") || "Media"),
      description: String(formData.get("description") || "").trim(),
      status: "Pendiente",
      createdAt: new Date().toISOString()
    };
    if (!ticket.requester || !ticket.email || !ticket.subject || !ticket.category || !ticket.description) {
      showToast("Completa todos los campos obligatorios.");
      return;
    }
    tickets.push(ticket);
    saveTickets();
    renderAll();
    closeModal($("#ticketModal"));
    switchView("tickets");
    $("#searchInput").value = ticket.id;
    renderTable();
    showToast(`Solicitud ${ticket.id} registrada correctamente.`);
    event.currentTarget.reset();
  });

  document.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-action]");
    if (actionButton?.dataset.action === "new-ticket") { openNewTicket(); return; }
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { switchView(viewButton.dataset.view); return; }
    const ticketButton = event.target.closest("[data-ticket-id]");
    if (ticketButton) { openTicketDetail(ticketButton.dataset.ticketId); return; }
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) { closeModal(closeButton.closest(".modal-backdrop")); return; }
    const articleButton = event.target.closest("[data-article]");
    if (articleButton) {
      const guides = {
        accesos: "Confirma que estás usando tu cuenta corporativa y que el teclado no tenga Bloq Mayús activado. Si el acceso continúa bloqueado, crea un ticket e indica el sistema al que intentas ingresar. Nunca compartas tu contraseña.",
        software: "Anota el nombre de la aplicación, el mensaje exacto de error y la hora del incidente. Si el sistema está conectado a producción, no reinicies ni cambies configuraciones sin autorización del equipo responsable.",
        red: "Indica si el problema afecta a una persona o a un área completa. Registra la ubicación, la hora aproximada de inicio y si otros servicios de red siguen funcionando.",
        equipos: "Identifica el equipo y su ubicación, revisa conexiones visibles solo si es seguro hacerlo y describe las señales o mensajes observados. No manipules tableros eléctricos ni equipos industriales energizados."
      };
      showToast(guides[articleButton.dataset.article] || "Consulta al equipo de soporte para recibir orientación.");
      return;
    }
    if (event.target.classList.contains("modal-backdrop")) closeModal(event.target);
  });

  $("#nextStatusBtn").addEventListener("click", advanceStatus);
  $("#searchInput").addEventListener("input", renderTable);
  $("#statusFilter").addEventListener("change", renderTable);
  $("#priorityFilter").addEventListener("change", renderTable);
  $("#exportBtn").addEventListener("click", exportCSV);
  $("#viewAllBtn").addEventListener("click", () => switchView(currentView === "tickets" ? "dashboard" : "tickets"));
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#helpButton").addEventListener("click", () => showToast("Registra un ticket con el botón «Nuevo ticket». Para incidentes de planta, indica el impacto operativo en la descripción."));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $$(".modal-backdrop:not([hidden])").forEach(closeModal);
      $("#sidebar").classList.remove("open");
    }
  });
  $("#currentYear").textContent = new Date().getFullYear();
  renderAll();
})();