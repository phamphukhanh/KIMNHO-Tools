async function loadComponent(elementId, filePath) {
    try {
        // Tự động kiểm tra nếu trang đang nằm trong thư mục con (ví dụ: pages/)
        const isSubfolder = window.location.pathname.includes('/pages/');
        const finalPath = isSubfolder ? '../' + filePath : filePath;

        const response = await fetch(finalPath);
        if (!response.ok) throw new Error(`Không thể tải ${finalPath}`);
        
        let html = await response.text();

        // Nếu ở trong thư mục pages/, tự động sửa lại đường dẫn hình ảnh trong Header & Footer
        if (isSubfolder) {
            html = html.replace(/src="assets\//g, 'src="../assets/');
            html = html.replace(/href="index.html"/g, 'href="../index.html"');
        }

        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải component:", error);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    await loadComponent("header-placeholder", "components/header.html");
    await loadComponent("footer-placeholder", "components/footer.html");

    if (typeof updateClock === "function") {
        setInterval(updateClock, 1000);
        updateClock();
    }
    
    if (typeof initDarkMode === "function") {
        initDarkMode();
    }
});