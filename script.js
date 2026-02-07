/* ================== إعدادات وبيانات أولية ================== */
const ADMIN_USER = "admin";
const ADMIN_PASS = "123456"; // كلمة مرور الأدمن الافتراضية

// تحميل البيانات من LocalStorage أو إنشاء بيانات وهمية للتجربة
let users = JSON.parse(localStorage.getItem('mowalid_users')) || [];
let payments = JSON.parse(localStorage.getItem('mowalid_payments')) || [];

// حفظ البيانات
function saveData() {
    localStorage.setItem('mowalid_users', JSON.stringify(users));
    localStorage.setItem('mowalid_payments', JSON.stringify(payments));
}

/* ================== نظام الدخول والخروج ================== */

function switchLoginTab(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (type === 'user') {
        document.getElementById('user-login-form').classList.remove('hidden');
        document.getElementById('admin-login-form').classList.add('hidden');
    } else {
        document.getElementById('user-login-form').classList.add('hidden');
        document.getElementById('admin-login-form').classList.remove('hidden');
    }
}

function loginAdmin() {
    const user = document.getElementById('admin-username').value;
    const pass = document.getElementById('admin-password').value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        showScreen('admin-dashboard');
        renderAdminStats();
        renderUsersList();
        renderPaymentsList();
    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

function loginUser() {
    const key = document.getElementById('user-input-key').value.trim();
    const user = users.find(u => u.recordNum === key || u.code === key);

    if (user) {
        showScreen('user-portal');
        loadUserPortal(user);
    } else {
        alert("رقم السجل أو الرمز غير صحيح!");
    }
}

function logout() {
    showScreen('login-screen');
    // تفريغ الحقول
    document.getElementById('admin-username').value = "";
    document.getElementById('admin-password').value = "";
    document.getElementById('user-input-key').value = "";
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

/* ================== لوحة الأدمن ================== */

function switchAdminTab(tabId) {
    // تبديل الأزرار السفلية
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // تبديل المحتوى
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';

    if(tabId === 'admin-home') renderAdminStats();
}

// 1. الإحصائيات
function renderAdminStats() {
    document.getElementById('total-users').innerText = users.length;
    
    let totalDebt = 0;
    let totalCollected = 0;

    payments.forEach(p => {
        totalCollected += parseFloat(p.paid);
        totalDebt += (parseFloat(p.req) - parseFloat(p.paid));
    });

    document.getElementById('total-debt').innerText = totalDebt.toLocaleString();
    document.getElementById('total-collected').innerText = totalCollected.toLocaleString();
}

// 2. إدارة المشتركين
function renderUsersList() {
    const container = document.getElementById('users-list');
    container.innerHTML = '';
    
    users.forEach((u, index) => {
        const div = document.createElement('div');
        div.className = 'card-item neumorphic';
        div.innerHTML = `
            <div class="card-header">
                <b>${u.name}</b>
                <span style="color: var(--cyan)">#${u.recordNum}</span>
            </div>
            <div class="card-details">
                ${u.type} | ${u.amps} أمبير | ${u.price} د.ع<br>
                الكود: ${u.code}
            </div>
            <div class="card-actions">
                <i class="fa-solid fa-trash action-icon red" onclick="deleteUser(${index})"></i>
            </div>
        `;
        container.appendChild(div);
    });
}

function showAddUserModal() {
    document.getElementById('modal-user').classList.remove('hidden');
}

function saveUser() {
    const name = document.getElementById('new-name').value;
    const record = document.getElementById('new-record').value;
    const code = document.getElementById('new-code').value;
    const type = document.getElementById('new-type').value;
    const amps = document.getElementById('new-amps').value;
    const price = document.getElementById('new-price').value;

    if(!name || !record || !code) return alert("يرجى ملء البيانات الأساسية");

    users.push({ name, recordNum: record, code, type, amps, price, id: Date.now() });
    saveData();
    closeModals();
    renderUsersList();
    renderAdminStats();
    
    // تفريغ الحقول
    document.getElementById('new-name').value = '';
    document.getElementById('new-record').value = '';
    document.getElementById('new-code').value = '';
}

function deleteUser(index) {
    if(confirm("هل أنت متأكد من حذف المشترك؟")) {
        users.splice(index, 1);
        saveData();
        renderUsersList();
        renderAdminStats();
    }
}

// 3. إدارة التسديدات
function renderPaymentsList() {
    const container = document.getElementById('payments-list');
    container.innerHTML = '';
    
    // ترتيب تنازلي (الأحدث أولاً)
    payments.sort((a,b) => b.id - a.id).forEach((p, index) => {
        const user = users.find(u => u.id === p.userId);
        const userName = user ? user.name : "مستخدم محذوف";
        const remain = p.req - p.paid;
        
        const div = document.createElement('div');
        div.className = `card-item neumorphic ${remain > 0 ? 'debt' : ''}`;
        div.innerHTML = `
            <div class="card-header">
                <b>${userName}</b>
                <small>${p.month} ${p.year}</small>
            </div>
            <div class="card-details">
                المطلوب: ${p.req}<br>
                المدفوع: ${p.paid}<br>
                المتبقي: <b class="${remain > 0 ? 'red' : 'green'}">${remain}</b>
            </div>
            <div class="card-actions">
                 <i class="fa-solid fa-trash action-icon red" onclick="deletePayment(${index})"></i>
            </div>
        `;
        container.appendChild(div);
    });
}

function showAddPaymentModal() {
    const select = document.getElementById('pay-user-select');
    select.innerHTML = '<option value="">اختر المشترك...</option>';
    users.forEach(u => {
        select.innerHTML += `<option value="${u.id}">${u.name} (${u.recordNum})</option>`;
    });
    document.getElementById('modal-payment').classList.remove('hidden');
}

function savePayment() {
    const userId = parseInt(document.getElementById('pay-user-select').value);
    const month = document.getElementById('pay-month').value;
    const year = document.getElementById('pay-year').value;
    const req = document.getElementById('pay-amount-req').value;
    const paid = document.getElementById('pay-amount-paid').value;

    if(!userId || !month) return alert("تأكد من اختيار المشترك والشهر");

    payments.push({
        id: Date.now(),
        userId: userId,
        month, year, req, paid
    });
    saveData();
    closeModals();
    renderPaymentsList();
    renderAdminStats();
}

function deletePayment(index) {
    if(confirm("حذف هذا القسط؟")) {
        payments.splice(index, 1); // ملاحظة: الحذف هنا يعتمد على ترتيب العرض، يفضل استخدام الـ ID في مشروع حقيقي
        saveData();
        renderPaymentsList();
        renderAdminStats();
    }
}

/* ================== واجهة الزبون ================== */

function loadUserPortal(user) {
    // 1. البيانات الأساسية
    document.getElementById('user-portal-name').innerText = user.name;
    document.getElementById('u-record-num').innerText = user.recordNum;
    document.getElementById('u-type').innerText = user.type;
    document.getElementById('u-amps').innerText = user.amps;
    document.getElementById('u-price').innerText = user.price + " د.ع";

    // 2. تصفية الفواتير الخاصة بهذا المستخدم
    const myPayments = payments.filter(p => p.userId === user.id);
    
    let totalReq = 0;
    let totalPaid = 0;
    
    const list = document.getElementById('user-invoices-list');
    list.innerHTML = '';

    if (myPayments.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد سجلات دفع حالياً</p>';
    }

    myPayments.forEach(p => {
        totalReq += parseFloat(p.req);
        totalPaid += parseFloat(p.paid);
        const remain = p.req - p.paid;
        let statusText = remain <= 0 ? "واصل" : "متبقي بذمتك";
        let statusColor = remain <= 0 ? "green" : "var(--red)";

        const div = document.createElement('div');
        div.className = `card-item neumorphic ${remain > 0 ? 'debt' : ''}`;
        div.innerHTML = `
            <div class="card-header">
                <b>${p.month} ${p.year}</b>
                <span style="color:${statusColor}; font-size:0.8rem;">${statusText}</span>
            </div>
            <div class="card-details">
                <div style="display:flex; justify-content:space-between;">
                    <span>المبلغ: ${p.req}</span>
                    <span>المدفوع: ${p.paid}</span>
                </div>
                <div style="margin-top:5px; border-top:1px dashed #ccc; padding-top:5px;">
                    المتبقي: <b style="color:${statusColor}">${remain}</b>
                </div>
            </div>
        `;
        list.appendChild(div);
    });

    // 3. الملخص
    document.getElementById('u-total-req').innerText = totalReq.toLocaleString();
    document.getElementById('u-total-paid').innerText = totalPaid.toLocaleString();
    document.getElementById('u-total-remain').innerText = (totalReq - totalPaid).toLocaleString();
}

/* ================== أدوات مساعدة ================== */

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// تهيئة أولية
document.addEventListener('DOMContentLoaded', () => {
    // إخفاء جميع التبويبات في البداية ما عدا الرئيسية للأدمن
    document.getElementById('admin-home').style.display = 'block';
    document.getElementById('admin-users').style.display = 'none';
    document.getElementById('admin-payments').style.display = 'none';
});
