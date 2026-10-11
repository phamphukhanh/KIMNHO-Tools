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
    // 2. XỬ LÝ SỰ KIỆN CHECKBOX VÀ TẢI FILE / NÉN ZIP
    // ==========================================
    function initCheckboxEvents() {
        const checkAllBox = document.getElementById("check-all-tools");
        const toolCheckboxes = document.querySelectorAll(".tool-checkbox");
        const downloadBtn = document.getElementById("btn-download-selected");
        const countBadge = document.getElementById("selected-count-badge");

        // Cập nhật trạng thái nút bấm và badge đếm số lượng
        function updateDownloadState() {
            const selected = document.querySelectorAll(".tool-checkbox:checked");
            const count = selected.length;

            if (countBadge) countBadge.textContent = count;

            if (downloadBtn) {
                downloadBtn.disabled = count === 0;
                if (count > 0) {
                    downloadBtn.classList.replace("btn-secondary", "btn-success");
                    countBadge.classList.replace("text-dark", "text-success");
                    countBadge.style.backgroundColor = "white";
                } else {
                    downloadBtn.classList.replace("btn-success", "btn-secondary");
                    countBadge.classList.replace("text-success", "text-dark");
                    countBadge.style.backgroundColor = "";
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

        // Chọn lẻ từng item
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

        // TẢI FILE (1 FILE ĐỘC LẬP HOẶC TỰ ĐỘNG NÉN .ZIP KHI CHỌN NHIỀU FILE)
        if (downloadBtn) {
            downloadBtn.addEventListener("click", async function () {
                const selected = document.querySelectorAll(".tool-checkbox:checked");
                if (selected.length === 0) return;

                // TH1: CHỌN DÚNG 1 FILE -> TẢI TRỰC TIẾP FILE ĐÓ
                if (selected.length === 1) {
                    const filename = selected[0].getAttribute("data-filename");
                    const link = document.createElement("a");
                    link.href = TOOLS_BASE_PATH + filename;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                }

                // TH2: CHỌN TỪ 2 FILE TRỞ LÊN -> NÉN THÀNH 1 FILE .ZIP
                if (typeof JSZip === "undefined") {
                    Swal.fire({
                        title: "Thiếu thư viện!",
                        text: "Chưa tải được thư viện JSZip. Vui lòng kiểm tra lại kết nối mạng.",
                        icon: "error"
                    });
                    return;
                }

                // Đổi giao diện nút bấm sang trạng thái đang nén
                const originalHtml = downloadBtn.innerHTML;
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = `<i class="fa fa-spinner fa-spin mr-1"></i>Đang đóng gói ZIP...`;

                try {
                    const zip = new JSZip();

                    // Lấy toàn bộ dữ liệu file bằng fetch()
                    const fetchPromises = Array.from(selected).map(async (cb) => {
                        const filename = cb.getAttribute("data-filename");
                        const fileUrl = TOOLS_BASE_PATH + filename;
                        const response = await fetch(fileUrl);
                        if (!response.ok) throw new Error(`Không thể lấy dữ liệu file: ${filename}`);
                        const blob = await response.blob();
                        zip.file(filename, blob);
                    });

                    await Promise.all(fetchPromises);

                    // Tạo file .zip trong bộ nhớ
                    const zipBlob = await zip.generateAsync({ type: "blob" });

                    // Kích hoạt tải file ZIP về máy
                    const link = document.createElement("a");
                    const blobUrl = URL.createObjectURL(zipBlob);
                    link.href = blobUrl;
                    link.download = "CAD_Tools_KIMNHO.zip";
                    document.body.appendChild(link);
                    link.click();

                    // Dọn dẹp tài nguyên
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);

                } catch (error) {
                    console.error("Lỗi đóng gói file ZIP:", error);
                    Swal.fire({
                        title: "Lỗi tải file!",
                        text: "Không thể gom file vào ZIP. Vui lòng kiểm tra lại đường dẫn lưu trữ file.",
                        icon: "error"
                    });
                } finally {
                    // Phục hồi lại trạng thái nút ban đầu
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = originalHtml;
                }
            });
        }
    }

    // Khởi chạy render bảng
    renderToolsTable();
});