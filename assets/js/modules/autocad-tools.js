document.addEventListener("DOMContentLoaded", function () {
    // Thư mục gốc chứa các file VLX/ARX thực tế
    const TOOLS_BASE_PATH = "../assets/tools/";

    // ==========================================
    // DATA: DANH SÁCH CÔNG CỤ 
    // (Bổ sung thông tin mô tả chi tiết tại đây)
    // ==========================================
    // ==========================================
    // DATA: DANH SÁCH CÔNG CỤ 
    // Thêm trường "usage" để hướng dẫn cách dùng
    // ==========================================
    const CAD_TOOLS = [
        { file: "C2Q.VLX", desc: "Chuyển đường tròn thành 4 góc phần tư (Để cắt CNC).", usage: "Nhập lệnh, chọn đối tượng cần xử lý và nhấn Enter.", cmd: "C2Q" },
        { file: "CINT.VLX", desc: "Vẽ đường tròn tại giao điểm các đường (Vẽ định vị nhanh).", usage: "Gõ lệnh, nhập kích thước hình tròn và quét chọn các đường giao nhau.", cmd: "CINT" },
        { file: "FILES TAB AUTOCAD 2007.arx", desc: "Tạo thanh Tab duyệt file (File Tabs) tương tự bản AutoCAD đời mới dành cho AutoCAD 2007.", usage: "Kéo thả file vào AutoCAD hoặc dùng lệnh APPLOAD để load.", cmd: "" },
        { file: "JJ.VLX", desc: "Nối các đường Line/Polyline thành một đường liên tục (Giống lệnh PE nhưng gọn hơn.", usage: "Nhập lệnh, chọn các đường Line/Polyline cần nối và nhấn Enter.", cmd: "JJ" },
        { file: "MP.VLX", desc: "Tạo điểm ở các điểm đặc biệt của đường (Tạo vòng ngoài Mylar nhanh).", usage: "Nhập lệnh, chọn các đường và nhấn Enter.", cmd: "MP" },
        { file: "P2C - C2P.VLX", desc: "Chuyển điểm thành đường tròn (P2C) và đường tròn thành điểm (C2P) (Làm định vị CNC nhanh).", usage: "Nhập lệnh, chọn điểm hoặc đường tròn và nhấn Enter.", cmd: "P2C hoặc C2P" },
        { file: "PC.VLX", desc: "Tìm điểm giữa của một nhóm đối tượng (Lấy điểm giữa các Pad/Mylar).", usage: "Nhập lệnh, chọn các đối tượng và nhấn Enter.", cmd: "PC" },
        { file: "PD.VLX", desc: "Thay đổi số lượng số thập phân của các Dimension riêng lẻ.", usage: "Nhập lệnh, gõ số lượng số thập phân, chọn Dim cần thay đổi và nhấn Enter.", cmd: "PD" },
        { file: "PDA.VLX", desc: "Thay đổi số lượng số thập phân của Dimension trong toàn bộ bản vẽ.", usage: "Nhập lệnh, gõ số lượng số thập phân và nhấn Enter.", cmd: "PDA" },
        { file: "SD.VLX", desc: "Thay đổi kích thước của các Dimension riêng lẻ.", usage: "Nhập lệnh, gõ kích thước, chọn Dim cần thay đổi và nhấn Enter.", cmd: "SD" },
        { file: "SDA.VLX", desc: "Thay đổi kích thước của Dimension trong toàn bộ bản vẽ.", usage: "Nhập lệnh, gõ kích thước mới và nhấn Enter.", cmd: "SDA" }
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

            // Badge hiển thị câu lệnh to, rõ
            const cmdBadge = tool.cmd
                ? `<span class="badge border px-2 py-1" style="font-size: 14px; letter-spacing: 0.5px; background-color: #f8f9fa; color: #d63384;"><code>${tool.cmd}</code></span>`
                : `<span class="text-muted">&mdash;</span>`;

            // Xử lý text hướng dẫn (nếu để trống thì hiển thị Đang cập nhật)
            const usageText = tool.usage
                ? tool.usage
                : `<span class="text-muted font-italic" style="font-size: 12px;">Đang cập nhật...</span>`;

            return `
        <tr>
            <td class="text-center align-middle">
                <div class="custom-control custom-checkbox ml-2">
                    <input type="checkbox" class="custom-control-input tool-checkbox" id="tool-cb-${index}" data-filename="${tool.file}">
                    <label class="custom-control-label" for="tool-cb-${index}"></label>
                </div>
            </td>
            <!-- Thêm px-3 để có khoảng cách lề hai bên, chữ to hơn một chút cho tên tool -->
            <td class="align-middle font-weight-bold px-3 ${nameClass}" style="font-size: 14.5px;">
                <i class="fa ${iconClass} mr-2"></i>${tool.file}
            </td>
            <!-- Đồng bộ font-size 14px, thêm px-3 để không sát lề -->
            <td class="align-middle text-muted px-3" style="font-size: 14px;">
                ${tool.desc}
            </td>
            <!-- Đồng bộ font-size 14px, thêm px-3 để không sát lề -->
            <td class="align-middle text-dark px-3" style="font-size: 14px;">
                ${usageText}
            </td>
            <td class="text-center align-middle">
                ${cmdBadge}
            </td>
            <td class="text-center align-middle">
                <a href="${TOOLS_BASE_PATH}${tool.file}" download class="btn btn-sm btn-outline-primary font-weight-bold">
                    <i class="fa fa-download"></i> Tải
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
