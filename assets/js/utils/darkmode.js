function initDarkMode() {
    const toggleBtn = document.getElementById("toggle-dark-mode");
    const isDark = localStorage.getItem("theme") === "dark" || localStorage.getItem("darkMode") === "enabled";

    // Đồng bộ class ngay khi Header vừa bơm xong
    if (isDark) {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fa fa-sun-o mr-1"></i> Sáng`;
    } else {
        document.documentElement.classList.remove("dark-mode");
        document.body.classList.remove("dark-mode");
        if (toggleBtn) toggleBtn.innerHTML = `<i class="fa fa-moon-o mr-1"></i> Tối`;
    }

    if (!toggleBtn) return;

    // Xử lý click chuyển đổi
    toggleBtn.onclick = function () {
        const hasDark = document.documentElement.classList.contains("dark-mode");

        if (hasDark) {
            document.documentElement.classList.remove("dark-mode");
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
            localStorage.setItem("darkMode", "disabled");
            toggleBtn.innerHTML = `<i class="fa fa-moon-o mr-1"></i> Tối`;
        } else {
            document.documentElement.classList.add("dark-mode");
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
            localStorage.setItem("darkMode", "enabled");
            toggleBtn.innerHTML = `<i class="fa fa-sun-o mr-1"></i> Sáng`;
        }
    };
}