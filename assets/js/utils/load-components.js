async function loadComponent(elementId, filePath) {
    try {
        const isSubfolder = window.location.pathname.includes('/pages/');
        const finalPath = isSubfolder ? '../' + filePath : filePath;

        const response = await fetch(finalPath);
        if (!response.ok) throw new Error(`Không thể tải ${finalPath}`);

        let html = await response.text();

        // Tự động điều chỉnh đường dẫn linh hoạt khi nằm trong thư mục /pages/
        if (isSubfolder) {
            html = html.replace(/src=(["'])assets\//g, 'src=$1../assets/');
            html = html.replace(/href=(["'])index.html/g, 'href=$1../index.html');
            html = html.replace(/href=(["'])pages\//g, 'href=$1../pages/');
            // Cập nhật đường dẫn cho hình ảnh Logo Kim Nhỏ trong Header
            html = html.replace(/src=(["'])assets\/images\//g, 'src=$1../assets/images/');
        }

        // Bắt lỗi an toàn & ÉP THAY THẾ (outerHTML) ĐỂ XÓA THẺ PLACEHOLDER THỪA
        const targetEl = document.getElementById(elementId);
        if (targetEl) {
            // Thay vì nhét <nav> vào trong <div id="header-placeholder">
            // Chúng ta thay thế cái <div id="header-placeholder"> bằng <nav> luôn!
            targetEl.outerHTML = html; 
        } else {
            console.warn(`Cảnh báo: Không tìm thấy phần tử #${elementId} trên trang hiện tại.`);
        }
    } catch (error) {
        console.error("Lỗi tải component:", error);
    }
}

// Tắt cơ chế tự động ghi nhớ vị trí cuộn cũ của trình duyệt
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
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
        if (iconEl) iconEl.className = `fa ${pageIcon} fa-fw header-icon`;
    }

    // Khởi chạy đồng hồ và Dark Mode
    if (typeof updateClock === "function") {
        setInterval(updateClock, 1000);
        updateClock();
    }

    if (typeof initDarkMode === "function") {
        initDarkMode();
    }
});