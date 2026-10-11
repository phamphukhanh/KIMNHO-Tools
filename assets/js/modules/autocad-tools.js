document.addEventListener("DOMContentLoaded", function () {
    // Thư mục gốc chứa các file VLX/ARX thực tế
    const TOOLS_BASE_PATH = "../assets/tools/";

    // ==========================================
    // DATA: DANH SÁCH CÔNG CỤ 
    // (Bổ sung thông tin mô tả chi tiết tại đây)
    // ==========================================
    const CAD_TOOLS = [
        { file: "C2Q.VLX", desc: "Chức năng thay thế của lệnh C2Q", cmd: "C2Q" },
        { file: "CINT.VLX", desc: "Chức năng thay thế của lệnh CINT", cmd: "CINT" },
        { file: "FILES TAB AUTOCAD 2007.arx", desc: "Tạo thanh Tab duyệt file (File Tabs) tương tự bản AutoCAD đời mới dành cho AutoCAD 2007. Load bằng lệnh APPLOAD.", cmd: "APPLOAD" },
        { file: "JJ.VLX", desc: "Chức năng thay thế của lệnh JJ", cmd: "JJ" },
        { file: "MP.VLX", desc: "Chức năng thay thế của lệnh MP", cmd: "MP" },
        { file: "P2C - C2P.VLX", desc: "Chuyển đổi linh hoạt qua lại giữa đường đa tuyến (Polyline) và đường cong (Circle).", cmd: "P2C" },
        { file: "PC.VLX", desc: "Chức năng thay thế của lệnh PC", cmd: "PC" },
        { file: "PD.VLX", desc: "Chức năng thay thế của lệnh PD", cmd: "PD" },
        { file: "PDA.VLX", desc: "Chức năng thay thế của lệnh PDA", cmd: "PDA" },
        { file: "SD.VLX", desc: "Chức năng thay thế của lệnh SD", cmd: "SD" },
        { file: "SDA.VLX", desc: "Chức năng thay thế của lệnh SDA", cmd: "SDA" }
    ];

    // ==========================================
    // 1. RENDER BẢNG GIAO DIỆN TỪ DATA
    // ==========================================
    function renderToolsTable() {
        const tbody = document.getElementById("tools-table-body");
        if (!tbody) return;

        tbody.innerHTML = CAD_TOOLS.map((tool, index) => {
            const isArx = tool.file.toLowerCase().endsWith(".arx");
            const iconClass = isArx ? "fa-cogs text-danger" : "fa-file-code-o text-primary";
            const nameClass = isArx ? "text-danger" : "text-primary";

            // Badge hiển thị câu lệnh
            const cmdBadge = tool.cmd
                ? `<span class="badge badge-light border text-dark font-weight-bold px-2 py-1" style="font-size: 12px;"><code>${tool.cmd}</code></span>`
                : `<span class="text-muted">&mdash;</span>`;

            return `
            <tr>
                <td class="text-center align-middle">
                    <div class="custom-control custom-checkbox ml-2">
                        <input type="checkbox" class="custom-control-input tool-checkbox" id="tool-cb-${index}" data-filename="${tool.file}">
                        <label class="custom-control-label" for="tool-cb-${index}"></label>
                    </div>
                </td>
                <td class="align-middle font-weight-bold ${nameClass}">
                    <i class="fa ${iconClass} mr-2"></i>${tool.file}
                </td>
                <td class="align-middle text-muted">
                    ${tool.desc}
                </td>
                <td class="text-center align-middle">
                    ${cmdBadge}
                </td>
                <td class="text-center align-middle">
                    <a href="${TOOLS_BASE_PATH}${tool.file}" download class="btn btn-sm btn-outline-primary font-weight-bold">
                        <i class="fa fa-download mr-1"></i>Tải
                    </a>
                </td>
            </tr>
        `;
        }).join("");

        initCheckboxEvents();
    }

    // ==========================================
    // 2. XỬ LÝ SỰ KIỆN CHECKBOX VÀ NÚT TẢI VỀ
    // ==========================================
    function initCheckboxEvents() {
        const checkAllBox = document.getElementById("check-all-tools");
        const toolCheckboxes = document.querySelectorAll(".tool-checkbox");
        const downloadBtn = document.getElementById("btn-download-selected");
        const countBadge = document.getElementById("selected-count-badge");

        // Hàm cập nhật màu nút tải về
        function updateDownloadState() {
            const selected = document.querySelectorAll(".tool-checkbox:checked");
            const count = selected.length;

            if (countBadge) countBadge.textContent = count;

            if (downloadBtn) {
                downloadBtn.disabled = count === 0;
                if (count > 0) {
                    downloadBtn.classList.replace("btn-secondary", "btn-success");
                    countBadge.classList.replace("text-dark", "text-success");
                    countBadge.style.backgroundColor = "white"; // Sáng text lên
                } else {
                    downloadBtn.classList.replace("btn-success", "btn-secondary");
                    countBadge.classList.replace("text-success", "text-dark");
                    countBadge.style.backgroundColor = ""; // Về mặc định
                }
            }
        }

        // Chọn tất cả
        if (checkAllBox) {
            checkAllBox.addEventListener("change", function () {
                toolCheckboxes.forEach(cb => cb.checked = this.checked);
                updateDownloadState();
            });
        }

        // Chọn từng mục
        toolCheckboxes.forEach(cb => {
            cb.addEventListener("change", function () {
                if (!this.checked && checkAllBox) {
                    checkAllBox.checked = false;
                } else if (checkAllBox) {
                    checkAllBox.checked = Array.from(toolCheckboxes).every(c => c.checked);
                }
                updateDownloadState();
            });
        });

        // Bắt sự kiện tải hàng loạt
        if (downloadBtn) {
            downloadBtn.addEventListener("click", function () {
                const selected = document.querySelectorAll(".tool-checkbox:checked");

                selected.forEach((cb, index) => {
                    const filename = cb.getAttribute("data-filename");

                    // Timeout giúp trình duyệt tải nhiều file mà không bị chặn (popup blocker)
                    setTimeout(() => {
                        const link = document.createElement("a");
                        link.href = TOOLS_BASE_PATH + filename;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }, index * 300);
                });
            });
        }
    }

    // Khởi chạy render bảng
    renderToolsTable();
});