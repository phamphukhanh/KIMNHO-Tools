async function loadComponent(elementId, filePath) {
    try {
        const isSubfolder = window.location.pathname.includes('/pages/');
        const finalPath = isSubfolder ? '../' + filePath : filePath;

        const response = await fetch(finalPath);
        if (!response.ok) throw new Error(`Không thể tải ${finalPath}`);

        let html = await response.text();

        // Nếu ở trong thư mục pages/, tự động sửa lại toàn bộ đường dẫn ảnh và liên kết trong Header
        if (isSubfolder) {
            html = html.replace(/src="assets\//g, 'src="../assets/');
            html = html.replace(/href="index.html"/g, 'href="../index.html"');
            html = html.replace(/href="pages\//g, 'href="../pages/');
        }

        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải component:", error);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    await loadComponent("header-placeholder", "components/header.html");
    await loadComponent("footer-placeholder", "components/footer.html");

    // Đổi Tiêu đề và Icon ở Header theo thuộc tính data của thẻ <body>
    const pageTitle = document.body.getAttribute("data-page-title");
    const pageIcon = document.body.getAttribute("data-page-icon");

    if (pageTitle) {
        const titleEl = document.getElementById("header-page-title");
        if (titleEl) titleEl.textContent = pageTitle;
    }

    if (pageIcon) {
        const iconEl = document.getElementById("header-page-icon");
        if (iconEl) iconEl.className = `fa ${pageIcon} mr-2 header-icon`;
    }

    // Khởi chạy các tiện ích Header
    if (typeof updateClock === "function") {
        setInterval(updateClock, 1000);
        updateClock();
    }

    if (typeof initDarkMode === "function") {
        initDarkMode();
    }
});