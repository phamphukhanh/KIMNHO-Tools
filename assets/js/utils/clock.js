// Xử lý đồng hồ thời gian thực ở Header
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN');
    const clockEl = document.getElementById('live-clock');
    if (clockEl) clockEl.textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();