// Xử lý bật/tắt & lưu trạng thái Chế độ tối (Dark Mode)
function initDarkMode() {
    const darkModeBtn = document.getElementById("toggle-dark-mode");
    if (!darkModeBtn) return;

    function setDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add("dark-mode");
            darkModeBtn.innerHTML = '<i class="fa fa-sun-o text-warning mr-1"></i> Sáng';
            darkModeBtn.classList.remove("btn-dark");
            darkModeBtn.classList.add("btn-outline-light");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            darkModeBtn.innerHTML = '<i class="fa fa-moon-o mr-1"></i> Tối';
            darkModeBtn.classList.remove("btn-outline-light");
            darkModeBtn.classList.add("btn-dark");
            localStorage.setItem("theme", "light");
        }
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        setDarkMode(true);
    }

    darkModeBtn.addEventListener("click", function () {
        const isDark = !document.body.classList.contains("dark-mode");
        setDarkMode(isDark);
    });
}