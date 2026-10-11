function initDarkMode() {
    const toggleBtn = document.getElementById("toggle-dark-mode");
    const isDark = localStorage.getItem("theme") === "dark" || localStorage.getItem("darkMode") === "enabled";

    // Hàm phụ trợ để cập nhật giao diện của nút
    function updateButtonUI(darkActive) {
        if (!toggleBtn) return;
        
        if (darkActive) {
            // Khi đang ở Dark Mode -> Nút hiển thị chữ "Sáng", nền trắng, icon mặt trời vàng
            toggleBtn.innerHTML = `<i class="fa fa-sun-o mr-1 text-warning"></i> Sáng`;
            toggleBtn.classList.remove("btn-dark");
            toggleBtn.classList.add("btn-light");
        } else {
            // Khi đang ở Light Mode -> Nút hiển thị chữ "Tối", nền đen, icon mặt trăng trắng
            toggleBtn.innerHTML = `<i class="fa fa-moon-o mr-1"></i> Tối`;
            toggleBtn.classList.remove("btn-light");
            toggleBtn.classList.add("btn-dark");
        }
    }

    // 1. Đồng bộ class ngay khi tải trang
    if (isDark) {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
    } else {
        document.documentElement.classList.remove("dark-mode");
        document.body.classList.remove("dark-mode");
    }
    
    // Cập nhật giao diện nút lần đầu tiên
    updateButtonUI(isDark);

    if (!toggleBtn) return;

    // 2. Xử lý khi người dùng Click vào nút
    toggleBtn.onclick = function () {
        const hasDark = document.documentElement.classList.contains("dark-mode");

        if (hasDark) {
            // Đang tối -> Bấm để chuyển sang Sáng
            document.documentElement.classList.remove("dark-mode");
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
            localStorage.setItem("darkMode", "disabled");
            
            updateButtonUI(false); // Cập nhật nút thành màu đen (Tối)
        } else {
            // Đang sáng -> Bấm để chuyển sang Tối
            document.documentElement.classList.add("dark-mode");
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
            localStorage.setItem("darkMode", "enabled");
            
            updateButtonUI(true); // Cập nhật nút thành màu trắng (Sáng)
        }
    };
}