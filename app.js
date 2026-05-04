// State Management
const state = {
    currentTriage: null, // 'green', 'yellow', 'red'
    hospitals: [
        {
            id: 'h1',
            name: 'City General Clinic',
            tier: 'Level 3 (Basic)',
            etaMins: 5,
            isTraumaCenter: false,
            accepting: true,
            canToggle: false // Basic clinics don't usually go on trauma divert
        },
        {
            id: 'h2',
            name: 'Apollo Jubilee Hills',
            tier: 'Level 1 (Major Trauma)',
            etaMins: 12,
            isTraumaCenter: true,
            accepting: true,
            canToggle: true
        },
        {
            id: 'h3',
            name: 'CARE Hospitals Gachibowli',
            tier: 'Level 1 (Major Trauma)',
            etaMins: 15,
            isTraumaCenter: true,
            accepting: true,
            canToggle: true
        }
    ],
    activeRoute: null
};

// DOM Elements
const triageBtns = document.querySelectorAll('.triage-btn');
const hospitalListEl = document.getElementById('hospital-list');
const routingResultEl = document.getElementById('routing-result');
const routingDetailsEl = document.getElementById('routing-details');
const destNameEl = document.getElementById('dest-name');
const destEtaEl = document.getElementById('dest-eta');
const destTierEl = document.getElementById('dest-tier');
const bypassAlertEl = document.getElementById('bypass-alert');
const bypassReasonEl = document.getElementById('bypass-reason');

// Initialization
function init() {
    renderHospitals();
    attachTriageListeners();
}

// Logic: Core Routing Engine
function calculateRoute() {
    if (!state.currentTriage) return;

    let selectedHospital = null;
    let bypassReason = null;

    // Filter available hospitals
    const availableHospitals = state.hospitals.filter(h => h.accepting);

    if (availableHospitals.length === 0) {
        selectedHospital = { name: "ERROR", etaMins: "--", tier: "NO HOSPITALS AVAILABLE" };
        bypassReason = "SYSTEM FAILURE: All regional hospitals on divert.";
    } else {
        if (state.currentTriage === 'green') {
            // Minor injury: Go to closest available, regardless of tier
            selectedHospital = availableHospitals.reduce((prev, curr) => prev.etaMins < curr.etaMins ? prev : curr);
        } else {
            // Red/Yellow (Urgent/Critical): MUST go to Level 1 Trauma Center
            const traumaCenters = availableHospitals.filter(h => h.isTraumaCenter);
            
            if (traumaCenters.length > 0) {
                selectedHospital = traumaCenters.reduce((prev, curr) => prev.etaMins < curr.etaMins ? prev : curr);
                
                // Check if we bypassed a closer hospital
                const closestOverall = availableHospitals.reduce((prev, curr) => prev.etaMins < curr.etaMins ? prev : curr);
                if (closestOverall.id !== selectedHospital.id) {
                    bypassReason = `Bypassed ${closestOverall.name} (+${selectedHospital.etaMins - closestOverall.etaMins} mins) - Required Level 1 Trauma Center.`;
                }

                // Check if the closest trauma center was on divert
                const closestTraumaOverall = state.hospitals.filter(h => h.isTraumaCenter).reduce((prev, curr) => prev.etaMins < curr.etaMins ? prev : curr);
                if (closestTraumaOverall.id !== selectedHospital.id && !closestTraumaOverall.accepting) {
                    bypassReason = `Bypassed ${closestTraumaOverall.name} (+${selectedHospital.etaMins - closestTraumaOverall.etaMins} mins) - Hospital currently on Divert/Full capacity.`;
                }

            } else {
                // Fallback if all trauma centers are full (should ideally never happen, but handle it)
                selectedHospital = availableHospitals.reduce((prev, curr) => prev.etaMins < curr.etaMins ? prev : curr);
                bypassReason = "CRITICAL WARNING: All Level 1 centers full. Routing to closest available basic facility.";
            }
        }
    }

    state.activeRoute = selectedHospital;
    updateRoutingUI(selectedHospital, bypassReason);
    renderHospitals(); // Re-render to highlight active route
}

// UI: Update Routing Dashboard
function updateRoutingUI(hospital, bypassReason) {
    routingResultEl.classList.remove('empty');
    routingResultEl.classList.add('active');
    
    let severityLabel = state.currentTriage.charAt(0).toUpperCase() + state.currentTriage.slice(1);
    routingResultEl.querySelector('span').innerText = `Routing active for ${severityLabel} trauma.`;

    routingDetailsEl.classList.remove('hidden');
    destNameEl.innerText = hospital.name;
    destEtaEl.innerText = `${hospital.etaMins} mins`;
    destTierEl.innerText = hospital.tier;

    if (bypassReason) {
        bypassAlertEl.classList.remove('hidden');
        bypassReasonEl.innerText = bypassReason;
    } else {
        bypassAlertEl.classList.add('hidden');
    }
}

// UI: Render Hospitals
function renderHospitals() {
    hospitalListEl.innerHTML = '';

    state.hospitals.forEach(h => {
        const isActiveRoute = state.activeRoute && state.activeRoute.id === h.id;
        
        const card = document.createElement('div');
        card.className = `hospital-card ${isActiveRoute ? 'active-route' : ''}`;
        
        let toggleHTML = '';
        if (h.canToggle) {
            toggleHTML = `
                <div class="status-control">
                    <span class="status-label ${h.accepting ? 'accepting' : 'divert'}">
                        ${h.accepting ? 'Accepting Trauma' : 'Divert (ER Full)'}
                    </span>
                    <label class="switch">
                        <input type="checkbox" data-id="${h.id}" ${h.accepting ? 'checked' : ''} onchange="toggleHospitalStatus(this)">
                        <span class="slider"></span>
                    </label>
                </div>
            `;
        } else {
            toggleHTML = `
                <div class="status-control" style="opacity: 0.6">
                    <span class="status-label accepting">Standard Intake</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div>
                <div class="hosp-header">
                    <div class="hosp-name">${h.name}</div>
                    <div class="hosp-eta">${h.etaMins}m</div>
                </div>
                <div class="hosp-tier"><span>${h.tier}</span></div>
            </div>
            ${toggleHTML}
        `;
        
        hospitalListEl.appendChild(card);
    });
}

// Event Listeners
function attachTriageListeners() {
    triageBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            triageBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked
            const clickedBtn = e.currentTarget;
            clickedBtn.classList.add('active');
            
            // Set state and calculate
            state.currentTriage = clickedBtn.getAttribute('data-level');
            calculateRoute();
        });
    });
}

// Global function for toggle switch
window.toggleHospitalStatus = function(checkbox) {
    const id = checkbox.getAttribute('data-id');
    const hospital = state.hospitals.find(h => h.id === id);
    if (hospital) {
        hospital.accepting = checkbox.checked;
        
        // Re-calculate route if there is an active triage
        if (state.currentTriage) {
            calculateRoute();
        } else {
            renderHospitals(); // Just update labels if no active route
        }
    }
};

// Start app
init();
