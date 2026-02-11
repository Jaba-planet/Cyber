/* --- JABA PLANET SYSTEM LOGIC --- */

const serviceList = [
    { cat: "Services", name: "Photocopy (Black)", price: 5 },
    { cat: "Services", name: "Photocopy (Colored)", price: 10 },
    { cat: "Services", name: "Scanning (Alone)", price: 30 },
    { cat: "Services", name: "Scanning (Sending)", price: 20 },
    { cat: "Services", name: "Lamination (Original)", price: 50 },
    { cat: "Services", name: "Lamination (Damaged)", price: 80 },
    { cat: "Services", name: "Browsing (per min)", price: 2 },
    { cat: "Services", name: "Typesetting", price: 30 },
    { cat: "Services", name: "Binding (Max 50pgs)", price: 100 },
    { cat: "KRA", name: "KRA PIN (Individual)", price: 250 },
    { cat: "KRA", name: "KRA PIN (Groups)", price: 2000 },
    { cat: "KRA", name: "KRA Retrieval", price: 200 },
    { cat: "KRA", name: "KRA Nil Returns", price: 150 },
    { cat: "KRA", name: "KRA Taxable Return", price: 250 },
    { cat: "Gov Services", name: "Good Conduct App", price: 1350 },
    { cat: "Gov Services", name: "SHA Registration", price: 300 },
    { cat: "Gov Services", name: "SHA Dependants", price: 150 },
    { cat: "Gov Services", name: "KUCCPS Application", price: 2000 },
    { cat: "Gov Services", name: "HELB Application", price: 700 },
    { cat: "Gov Services", name: "Driving Licence App", price: 900 },
    { cat: "Gov Services", name: "Passport (4 pcs)", price: 100 },
    { cat: "Gov Services", name: "Etims Account", price: 150 },
    { cat: "Gov Services", name: "NSSF Account", price: 300 },
    { cat: "Gov Services", name: "eCitizen Account", price: 50 },
    { cat: "Gov Services", name: "Birth Cert Form", price: 50 },
    { cat: "Gov Services", name: "ID Reg Form", price: 50 },
    { cat: "Gov Services", name: "Death Cert Form", price: 50 },
    { cat: "Gov Services", name: "Police Abstract", price: 100 },
    { cat: "Gov Services", name: "Nemis Retrieve", price: 400 },
    { cat: "General", name: "Email Account Create", price: 150 },
    { cat: "General", name: "Payslip Download", price: 100 },
    { cat: "General", name: "Troubleshooting", price: 200 },
    { cat: "General", name: "Software Install", price: 200 },
    { cat: "Entertainment", name: "Music (Single)", price: 5 },
    { cat: "Entertainment", name: "Music (Mix)", price: 10 },
    { cat: "Entertainment", name: "Movie", price: 30 },
    { cat: "Design", name: "Proforma Design", price: 100 },
    { cat: "Design", name: "Receipt Design", price: 100 },
    { cat: "Design", name: "Poster Design", price: 300 },
    { cat: "Design", name: "Card (Harambee)", price: 100 },
    { cat: "Design", name: "Card (Invitation)", price: 100 },
    { cat: "Design", name: "Letter Head", price: 20 }
];

let currentMode = 'today'; 
let currentFilter = 'All'; 
let currentType = 'income'; 
let currentMethod = 'Cash';
let cart = []; 
let editingId = null; // State to track if we are editing

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dateInput').valueAsDate = new Date();
    const savedTarget = localStorage.getItem('jabaTarget') || 5000;
    document.getElementById('targetInput').value = savedTarget;
    populateServiceDropdown();
    loadData();
});

// --- LOAD & CALCULATE DATA ---
function loadData() {
    const dateInputVal = document.getElementById('dateInput').value;
    const allData = JSON.parse(localStorage.getItem('jabaProData')) || {};
    
    let displayData = [];

    if (currentMode === 'today') {
        displayData = allData[dateInputVal] || [];
        document.getElementById('balanceLabel').innerText = "Net Balance (Today)";
    } 
    else if (currentMode === 'week') {
        displayData = getWeekData(allData);
        document.getElementById('balanceLabel').innerText = "Net Balance (This Week)";
    }
    else if (currentMode === 'all') {
        Object.keys(allData).forEach(key => {
            const dayItems = allData[key].map(item => ({...item, date: key}));
            displayData = displayData.concat(dayItems);
        });
        document.getElementById('balanceLabel').innerText = "Total Lifetime Balance";
    }

    displayData.sort((a, b) => b.id - a.id);
    checkSecurity(dateInputVal);
    calculateStats(displayData);
    renderList(displayData);
}

function getWeekData(allData) {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMon);
    monday.setHours(0,0,0,0);
    
    let weekData = [];
    Object.keys(allData).forEach(dateStr => {
        const d = new Date(dateStr);
        if(d >= monday && d <= today) {
            const dayItems = allData[dateStr].map(item => ({...item, date: dateStr}));
            weekData = weekData.concat(dayItems);
        }
    });
    return weekData;
}

function checkSecurity(viewDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    const fab = document.getElementById('addBtn');
    // Only show ADD button if looking at today
    fab.style.display = (currentMode === 'today' && viewDate === todayStr) ? 'flex' : 'none';
}

function calculateStats(data) {
    let income = 0; let expense = 0;
    let cashIn = 0, cashOut = 0;
    let elecIn = 0, elecOut = 0;

    data.forEach(item => {
        const type = item.type || 'income'; 
        if(type === 'income') {
            income += item.amount;
            if(item.method === 'Cash') cashIn += item.amount; else elecIn += item.amount;
        } else {
            expense += item.amount;
            if(item.method === 'Cash') cashOut += item.amount; else elecOut += item.amount;
        }
    });

    const net = income - expense;
    document.getElementById('displayNet').innerText = "KSh " + net.toLocaleString();
    document.getElementById('displayIn').innerText = income.toLocaleString();
    document.getElementById('displayOut').innerText = expense.toLocaleString();
    document.getElementById('stripTotal').innerText = net.toLocaleString();
    document.getElementById('stripCash').innerText = (cashIn - cashOut).toLocaleString();
    document.getElementById('stripElec').innerText = (elecIn - elecOut).toLocaleString();

    if(currentMode === 'today') {
        const target = parseFloat(document.getElementById('targetInput').value) || 5000;
        let percent = (income / target) * 100;
        const bar = document.getElementById('progressBar');
        const pctText = document.getElementById('percentText');
        const msgText = document.getElementById('targetMsg');
        const card = document.getElementById('targetCard');

        bar.style.width = Math.min(percent, 100) + '%';
        if(percent >= 100) {
            bar.style.backgroundColor = 'var(--success)';
            pctText.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${Math.floor(percent)}%`;
            pctText.style.color = 'var(--success)';
            msgText.innerText = "Target Hit!";
            card.classList.add('goal-hit');
        } else {
            card.classList.remove('goal-hit');
            pctText.innerText = Math.floor(percent) + '%';
            bar.style.backgroundColor = percent < 50 ? 'var(--danger)' : 'var(--warning)';
            pctText.style.color = percent < 50 ? 'var(--danger)' : 'var(--warning)';
            msgText.innerText = "Keep going!";
        }
    }
}

function calculateMonthlyStats() {
    const dateInput = document.getElementById('dateInput').value;
    const dateObj = new Date(dateInput);
    const monthPrefix = dateInput.substring(0, 7); 
    const allData = JSON.parse(localStorage.getItem('jabaProData')) || {};
    let inc = 0, exp = 0;

    Object.keys(allData).forEach(key => {
        if(key.startsWith(monthPrefix)) {
            allData[key].forEach(t => {
                if(t.type === 'expense') exp += t.amount;
                else inc += t.amount;
            });
        }
    });

    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('monthTitle').innerText = monthName;
    document.getElementById('monthNet').innerText = "KSh " + (inc - exp).toLocaleString();
    document.getElementById('monthIn').innerText = inc.toLocaleString();
    document.getElementById('monthOut').innerText = exp.toLocaleString();
}

function renderList(data) {
    const list = document.getElementById('transactionList');
    list.innerHTML = '';
    
    const filtered = data.filter(item => {
        if(currentFilter === 'All') return true;
        if(currentFilter === 'Cash') return item.method === 'Cash';
        if(currentFilter === 'Electronic') return item.method !== 'Cash';
        return true;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const viewDate = document.getElementById('dateInput').value;
    const isTodayView = (currentMode === 'today' && viewDate === todayStr);

    filtered.forEach(item => {
        const type = item.type || 'income';
        const isInc = type === 'income';
        const sign = isInc ? '+' : '-';
        const colorClass = isInc ? 'income' : 'expense';
        const d = new Date(item.id);
        const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let displayTitle = item.service;
        let detailsHTML = '';

        if (item.details && item.details.length > 0) {
            const firstItemName = item.details[0].name;
            displayTitle = firstItemName.split('(')[0].trim();
            if(item.details.length > 1) displayTitle += " & Others";

            detailsHTML = item.details.map(det => 
                `<div style="display:flex; justify-content:space-between; margin-bottom:4px; padding-bottom:4px; border-bottom:1px dashed #eee;">
                    <span>${det.name}</span>
                    <span>x${det.qty}</span>
                 </div>`
            ).join('');
        }

        // --- ACTION BUTTONS (Edit / Delete) ---
        let buttonsHTML = '';
        if (isTodayView) {
            buttonsHTML = `
                <div class="actions-row">
                    <button class="edit-btn" onclick="editEntry(event, ${item.id})"><i class="fa-solid fa-pencil"></i> Edit</button>
                    <button class="action-btn" onclick="deleteEntry(event, ${item.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            `;
        }

        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.onclick = function() { toggleDetails(item.id); };
        
        li.innerHTML = `
            <div class="t-header">
                <span class="t-service">${displayTitle}</span>
                <span class="t-amount ${colorClass}">${sign} ${item.amount.toLocaleString()}</span>
            </div>
            <div id="details-${item.id}" class="t-details" style="display:none;">
                <div class="t-row-detail" style="margin-bottom:10px;">
                    <span>Time: ${timeStr}</span> 
                    <span>${item.method}</span>
                </div>
                ${detailsHTML ? `<div class="t-breakdown" style="margin-bottom:10px;">${detailsHTML}</div>` : ''}
                ${buttonsHTML}
            </div>
        `;
        list.appendChild(li);
    });

    if(filtered.length === 0) list.innerHTML = `<div style="text-align:center; padding:30px; color:#9ca3af; font-size:0.9rem;">No transactions found.</div>`;
}

function toggleDetails(id) {
    const el = document.getElementById(`details-${id}`);
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
}

// --- MODAL & POS ---
function openModal() {
    // Reset State for New Entry
    editingId = null; 
    document.getElementById('modalTitle').innerText = "New Sale";
    document.getElementById('saveBtn').innerText = "Complete Transaction";

    const todayStr = new Date().toISOString().split('T')[0];
    if(document.getElementById('dateInput').value !== todayStr) {
        alert("You can only add transactions for TODAY.");
        return;
    }
    
    // Clear Inputs
    cart = []; 
    document.getElementById('manualDesc').value = "";
    document.getElementById('manualAmount').value = "";
    renderCart();
    
    document.getElementById('entryModal').classList.add('active');
    setType('income'); setMethod('Cash');
    document.getElementById('serviceSelect').value = "";
}

function closeModal() { document.getElementById('entryModal').classList.remove('active'); }

function editEntry(event, id) {
    event.stopPropagation(); // Don't collapse details
    const dateInput = document.getElementById('dateInput').value;
    const allData = JSON.parse(localStorage.getItem('jabaProData'));
    
    // Find item
    const item = allData[dateInput].find(x => x.id === id);
    if (!item) return;

    // Set Editing State
    editingId = id;
    document.getElementById('modalTitle').innerText = "Edit Transaction";
    document.getElementById('saveBtn').innerText = "Update Transaction";

    // Populate Data
    setType(item.type);
    setMethod(item.method);

    if (item.type === 'income') {
        cart = item.details || [];
        renderCart();
    } else {
        document.getElementById('manualDesc').value = item.details[0].name;
        document.getElementById('manualAmount').value = item.details[0].total;
    }

    document.getElementById('entryModal').classList.add('active');
}

function addToCart() {
    const select = document.getElementById('serviceSelect');
    const qtyInput = document.getElementById('qtyInput');
    const priceInput = document.getElementById('priceInput');
    const serviceName = select.value;
    const price = parseFloat(priceInput.value);
    const qty = parseInt(qtyInput.value);

    if(!serviceName || isNaN(price) || isNaN(qty) || qty < 1) {
        alert("Please check service and quantity.");
        return;
    }
    const total = price * qty;
    cart.push({ name: serviceName, price: price, qty: qty, total: total });
    select.value = ""; qtyInput.value = 1; priceInput.value = "";
    renderCart();
}

function removeFromCart(index) { cart.splice(index, 1); renderCart(); }

function renderCart() {
    const list = document.getElementById('cartList');
    const totalDisplay = document.getElementById('cartTotalDisplay');
    list.innerHTML = "";
    let grandTotal = 0;
    cart.forEach((item, index) => {
        grandTotal += item.total;
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `<span>${item.name} <small>x${item.qty}</small></span>
            <div style="display:flex; align-items:center; gap:10px;"><strong>${item.total}</strong>
            <button class="cart-del-btn" onclick="removeFromCart(${index})"><i class="fa-solid fa-times"></i></button></div>`;
        list.appendChild(li);
    });
    totalDisplay.innerText = grandTotal.toLocaleString();
}

function saveTransaction() {
    const date = new Date().toISOString().split('T')[0];
    let description = "";
    let amount = 0;
    let details = [];

    if(currentType === 'income') {
        if(cart.length === 0) { alert("Cart is empty!"); return; }
        description = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
        amount = cart.reduce((sum, item) => sum + item.total, 0);
        details = [...cart];
    } else {
        description = document.getElementById('manualDesc').value;
        amount = parseFloat(document.getElementById('manualAmount').value);
        if(!description || isNaN(amount)) { alert("Enter valid details"); return; }
        details = [{name: description, qty: 1, total: amount}];
    }

    const allData = JSON.parse(localStorage.getItem('jabaProData')) || {};
    if(!allData[date]) allData[date] = [];
    
    // Construct Entry Object
    const entry = { 
        id: editingId ? editingId : Date.now(), // Use existing ID if editing, else new
        service: description, 
        amount: amount, 
        method: currentMethod, 
        type: currentType, 
        details: details 
    };

    if (editingId) {
        // UPDATE Existing
        const index = allData[date].findIndex(x => x.id === editingId);
        if(index !== -1) {
            allData[date][index] = entry;
        }
    } else {
        // CREATE New
        allData[date].push(entry);
    }

    localStorage.setItem('jabaProData', JSON.stringify(allData));
    closeModal();
    loadData();
}

// --- REPORT PRINTING ---
function printReport() {
    const allData = JSON.parse(localStorage.getItem('jabaProData')) || {};
    let dataToPrint = [];
    let title = "";
    let filenameDate = "";
    const dateInputVal = document.getElementById('dateInput').value;

    if (currentMode === 'today') {
        dataToPrint = allData[dateInputVal] || [];
        dataToPrint = dataToPrint.map(i => ({...i, date: dateInputVal})); 
        title = "Daily Report";
        filenameDate = dateInputVal;
    } else if (currentMode === 'week') {
        dataToPrint = getWeekData(allData);
        title = "Weekly Report";
        filenameDate = `Week_${new Date().toISOString().split('T')[0]}`;
    } else {
        Object.keys(allData).forEach(key => {
            const items = allData[key].map(i => ({...i, date: key}));
            dataToPrint = dataToPrint.concat(items);
        });
        title = "Full History Report";
        filenameDate = "All_Time";
    }

    document.getElementById('printReportTitle').innerText = title;
    document.getElementById('printDateDisplay').innerText = new Date().toLocaleDateString();
    
    let inc=0, exp=0, cash=0, mpesa=0;
    dataToPrint.forEach(i => {
        const type = i.type || 'income';
        if(type==='income') { inc+=i.amount; if(i.method==='Cash') cash+=i.amount; else mpesa+=i.amount; }
        else { exp+=i.amount; if(i.method==='Cash') cash-=i.amount; else mpesa-=i.amount; }
    });
    document.getElementById('p-inc').innerText = inc.toLocaleString();
    document.getElementById('p-exp').innerText = exp.toLocaleString();
    document.getElementById('p-net').innerText = (inc-exp).toLocaleString();
    document.getElementById('p-cash').innerText = cash.toLocaleString();
    document.getElementById('p-mpesa').innerText = mpesa.toLocaleString();

    const tbody = document.getElementById('printTableBody');
    tbody.innerHTML = '';
    dataToPrint.sort((a,b) => a.id - b.id);

    dataToPrint.forEach(item => {
        const isInc = (item.type || 'income') === 'income';
        const d = new Date(item.id);
        const timeStr = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.date} ${timeStr}</td><td>${item.service}</td><td>${item.method}</td><td>${isInc ? 'IN' : 'OUT'}</td><td style="text-align:right">${item.amount.toLocaleString()}</td>`;
        tbody.appendChild(tr);
    });

    const originalTitle = document.title;
    document.title = `Jaba_${title}_${filenameDate}`;
    window.print();
    document.title = originalTitle;
}

// --- HELPERS ---
function setMode(mode) {
    currentMode = mode;
    document.getElementById('btnToday').classList.remove('active-blue');
    document.getElementById('btnWeek').classList.remove('active-blue');
    document.getElementById('btnHistory').classList.remove('active-blue');
    
    const targetCard = document.getElementById('targetCard');
    if(mode === 'today') {
        document.getElementById('btnToday').classList.add('active-blue');
        targetCard.style.display = 'flex';
    } else if (mode === 'week') {
        document.getElementById('btnWeek').classList.add('active-blue');
        targetCard.style.display = 'none';
    } else {
        document.getElementById('btnHistory').classList.add('active-blue');
        targetCard.style.display = 'none';
    }
    loadData();
}

function setFilter(filter) {
    currentFilter = filter;
    document.getElementById('btnAll').classList.remove('active');
    document.getElementById('btnCash').classList.remove('active');
    document.getElementById('btnElec').classList.remove('active');
    
    if(filter==='All') document.getElementById('btnAll').classList.add('active');
    if(filter==='Cash') document.getElementById('btnCash').classList.add('active');
    if(filter==='Electronic') document.getElementById('btnElec').classList.add('active');
    
    const cTotal = document.getElementById('cardTotal');
    const cCash = document.getElementById('cardCash');
    const cElec = document.getElementById('cardMpesa');
    
    if(filter === 'All') {
        cTotal.style.display = 'flex';
        cCash.style.display = 'flex';
        cElec.style.display = 'flex';
    } else if (filter === 'Cash') {
        cTotal.style.display = 'none';
        cCash.style.display = 'flex';
        cElec.style.display = 'none';
    } else if (filter === 'Electronic') {
        cTotal.style.display = 'none';
        cCash.style.display = 'none';
        cElec.style.display = 'flex';
    }
    loadData();
}

function populateServiceDropdown() {
    const select = document.getElementById('serviceSelect');
    select.innerHTML = '<option value="">-- Select Service --</option>';
    const categories = {};
    serviceList.forEach(item => { if(!categories[item.cat]) categories[item.cat] = []; categories[item.cat].push(item); });
    for(const cat in categories) {
        const group = document.createElement('optgroup'); group.label = cat;
        categories[cat].forEach(item => {
            const opt = document.createElement('option'); opt.value = item.name; opt.innerText = `${item.name} - ${item.price}`; opt.dataset.price = item.price;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
}
function updatePriceFromSelect() {
    const select = document.getElementById('serviceSelect');
    const opt = select.options[select.selectedIndex];
    if(opt.dataset.price) document.getElementById('priceInput').value = opt.dataset.price;
}
function setType(type) {
    currentType = type;
    const incBtn = document.getElementById('typeInc');
    const expBtn = document.getElementById('typeExp');
    const posSec = document.getElementById('posSection');
    const manSec = document.getElementById('manualSection');
    if(type === 'income') {
        incBtn.classList.add('active-inc'); expBtn.classList.remove('active-exp');
        posSec.style.display = 'block'; manSec.style.display = 'none';
        document.getElementById('modalTitle').innerText = "New Sale";
    } else {
        incBtn.classList.remove('active-inc'); expBtn.classList.add('active-exp');
        posSec.style.display = 'none'; manSec.style.display = 'block';
        document.getElementById('modalTitle').innerText = "New Expense";
    }
}
function setMethod(method) {
    currentMethod = method;
    const cashBtn = document.getElementById('methodCash');
    const elecBtn = document.getElementById('methodElec');
    if(method === 'Cash') { cashBtn.classList.add('active-method'); elecBtn.classList.remove('active-method'); }
    else { cashBtn.classList.remove('active-method'); elecBtn.classList.add('active-method'); }
}
function saveTarget() { localStorage.setItem('jabaTarget', document.getElementById('targetInput').value); loadData(); }
function deleteEntry(event, id) {
    event.stopPropagation();
    if(!confirm("Delete transaction?")) return;
    const date = document.getElementById('dateInput').value;
    const allData = JSON.parse(localStorage.getItem('jabaProData'));
    if(allData[date]) {
        const idx = allData[date].findIndex(x => x.id === id);
        if(idx !== -1) allData[date].splice(idx, 1);
    }
    localStorage.setItem('jabaProData', JSON.stringify(allData));
    loadData();
}
function openSettings() { document.getElementById('settingsModal').classList.add('active'); }
function backupData() {
    const data = localStorage.getItem('jabaProData');
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `jaba_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function restoreData(input) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { localStorage.setItem('jabaProData', e.target.result); alert("Restored!"); location.reload(); };
    reader.readAsText(file);
}
function showMonthlyStats() { 
    calculateMonthlyStats();
    document.getElementById('monthModal').classList.add('active'); 
}
function printMonthReport() { printReport(); }
function clearMonthData() {
    const dateInput = document.getElementById('dateInput').value;
    const dateObj = new Date(dateInput);
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    if(confirm(`⚠️ DANGER: Are you sure you want to DELETE ALL transactions for ${monthName}?`)) {
        const monthPrefix = dateInput.substring(0, 7);
        const allData = JSON.parse(localStorage.getItem('jabaProData')) || {};
        Object.keys(allData).forEach(key => { if(key.startsWith(monthPrefix)) delete allData[key]; });
        localStorage.setItem('jabaProData', JSON.stringify(allData));
        alert(`Data for ${monthName} has been cleared.`);
        document.getElementById('monthModal').classList.remove('active');
        loadData();
    }
}