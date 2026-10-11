let keepOptionFlag = false;

function resetValues() {
    const customCutDepth = document.getElementById("custom-cut-depth");
    const customDrillDepth = document.getElementById("custom-drill-depth");

    document.getElementById("customCutDepthValue").value = "";
    document.getElementById("customDrillEachValue").value = "";
    document.querySelector("input[name='center'][value='no']").checked = true;
    document.querySelector("input[name='cut-depth'][value='5']").checked = true;
    document.querySelector("input[name='drill-depth'][value='5']").checked = true;
    document.querySelector("input[name='start-end'][value='no']").checked = true;
    document.querySelector("input[name='spacing'][value='no']").checked = true;
    document.querySelector("input[name='comment'][value='no']").checked = true;
    document.querySelectorAll("input[type='number']").forEach(input => input.value = "");
    document.querySelector("select#ceramic-thickness").value = "125";
    document.querySelector("select#ring-angles").value = "7";
    document.querySelector("input#ring-bottom-thickness").value = 60;

    if (customCutDepth) customCutDepth.style.display = "none";
    if (customDrillDepth) customDrillDepth.style.display = "none";
}

function resetEditMode() {
    const button = document.getElementById("edit-button");
    const textarea = document.getElementById("result");
    if (!button || !textarea) return;

    const icon = button.querySelector("i");
    const text = button.querySelector(".btn-text");

    if (!textarea.hasAttribute("readonly")) {
        textarea.setAttribute("readonly", true);
        if (icon) icon.className = "fa fa-pencil-square-o";
        if (text) text.textContent = "Chỉnh sửa";
    }
}

function toggleEditMode(buttonId, textareaId) {
    const button = document.getElementById(buttonId);
    const textarea = document.getElementById(textareaId);
    const icon = button.querySelector("i");
    const text = button.querySelector(".btn-text");

    if (textarea.hasAttribute("readonly")) {
        textarea.removeAttribute("readonly");
        textarea.focus();
        if (icon) icon.className = "fa fa-check";
        if (text) text.textContent = "Hoàn tất";
    } else {
        textarea.setAttribute("readonly", true);
        if (icon) icon.className = "fa fa-pencil-square-o";
        if (text) text.textContent = "Chỉnh sửa";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Khởi tạo Dark Mode
    initDarkMode();

    // Chặn nhập dấu trừ và ký tự e/E
    document.querySelectorAll("input[type='number']").forEach(input => {
        input.addEventListener("keydown", function (event) {
            if (event.key === "-" || event.key === "e" || event.key === "E") {
                event.preventDefault();
            }
        });
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    const tooltipElement = document.querySelector('.small-tooltip');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const dropdownLabel = document.querySelector('.dropdown-toggle span');
    const formCut = document.getElementById("form-cut");
    const formDrill = document.getElementById("form-drill");
    const formRingAngle = document.getElementById("form-ring-angle");
    const customCutDepth = document.getElementById("custom-cut-depth");
    const customDrillDepth = document.getElementById("custom-drill-depth");
    const keepOptions = document.getElementById("keep-options");

    if (keepOptions) {
        keepOptionFlag = keepOptions.checked;
        keepOptions.addEventListener("change", function () {
            keepOptionFlag = !keepOptionFlag;
        });
    }

    if (tooltipElement) {
        // Đợi 300ms cho Header động load xong và layout ổn định mới tính toán vị trí tooltip
        setTimeout(() => {
            $(tooltipElement).tooltip({
                boundary: 'window',      // Giữ tooltip không bị tràn khung
                placement: 'right'       // Đảm bảo luôn hiện bên phải icon
            }).tooltip("show");

            // Sau khi hiện 2.5 giây thì tự động ẩn
            setTimeout(() => {
                $(tooltipElement).tooltip("hide");
            }, 2500);
        }, 300);
    }

    function updateTooltipContent(option) {
        let content = '';
        if (option === 'Cắt') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Cắt đường thẳng, đường cong, khắc chữ block.</b><br><br>
                1. Chạy BobCad 1 vòng.<br>
                2. Copy G-code vào, không cần xoá Z0.<br><br>
                <b class='text-danger'><u>Lưu ý:</u></b> Nhiều vòng khác nhau phải <u>để ý mũi</u>
            </div>`;
        } else if (option === 'Đục lỗ') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Đục lỗ định vị, các lỗ khác</b><br><br>
                1. Chấm các chấm trong BobCad.<br>
                2. Copy G-code vào, không cần xoá Z0.
            </div>`;
        } else if (option === 'Chạy độ ring') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Chạy độ mặt dưới ring</b><br><br>
                1. Chạy BobCad hết tất cả vòng.<br>
                2. Copy G-code vào, không cần xoá Z0.<br>
            </div>`;
        }

        if (tooltipElement) {
            tooltipElement.setAttribute("data-original-title", content);
            $(tooltipElement).tooltip("hide").tooltip("show");

            setTimeout(() => {
                $(tooltipElement).tooltip("hide");
            }, 2500);
        }
    }

    dropdownItems.forEach(item => {
        item.addEventListener("click", function () {
            const selectedText = this.textContent.trim();
            if (dropdownLabel) dropdownLabel.textContent = selectedText;

            if (selectedText === "Đục lỗ") {
                if (formCut) formCut.style.display = "none";
                if (formRingAngle) formRingAngle.style.display = "none";
                if (formDrill) formDrill.style.display = "block";
            } else if (selectedText === "Chạy độ ring") {
                if (formCut) formCut.style.display = "none";
                if (formDrill) formDrill.style.display = "none";
                if (formRingAngle) formRingAngle.style.display = "block";
            } else {
                if (formCut) formCut.style.display = "block";
                if (formDrill) formDrill.style.display = "none";
                if (formRingAngle) formRingAngle.style.display = "none";
            }

            if (!keepOptionFlag) {
                resetValues();
            }

            updateTooltipContent(selectedText);
            resetEditMode();
        });
    });

    document.querySelectorAll("input[name='drill-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            if (customDrillDepth) customDrillDepth.style.display = this.value === "custom" ? "block" : "none";
            const input = document.getElementById("customDrillDepthValue");
            if (input) input.focus();
        });
    });

    document.querySelectorAll("input[name='cut-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            if (customCutDepth) customCutDepth.style.display = this.value === "custom" ? "block" : "none";
            const input = document.getElementById("customCutDepthValue");
            if (input) input.focus();
        });
    });

    const resultEl = document.getElementById("result");
    if (resultEl) {
        resultEl.addEventListener("input", function () {
            updateLineNumbers();
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });
    }

    // Nút Xem kết quả
    const processBtn = document.querySelector(".btn-primary");
    if (processBtn) {
        processBtn.addEventListener("click", function () {
            let input = document.querySelectorAll("textarea")[0].value.trim();
            if (input.includes("Z-") || input.includes("G01 Z0.050") || input.includes("G00 X0.000 Y0.000")) {
                Swal.fire({
                    title: "G-code đã có chỉnh sửa!\n(Chứa Z- hoặc G01 Z0.050 hoặc G00 X0.000 Y0.000)",
                    text: "Vui lòng nhập G-code chưa chỉnh sửa.",
                    icon: "warning",
                });
                return;
            }

            if (input === "") {
                Swal.fire({
                    title: "Chưa điền G-code CNC!",
                    icon: "warning",
                });
                return;
            }

            input = input
                .trim()
                .replaceAll(/\r?\n\s*\r?\n/g, "\n")
                .replaceAll(" Z0.1", "")
                .replaceAll(" Z0.", "")
                .replaceAll("G81 ", "")
                .replaceAll(" R1. F1.", "");

            putMilInBlocks(input);
            resetEditMode();
        });
    }

    // Nút Lưu file
    const saveBtn = document.querySelector(".btn-success");
    if (saveBtn) {
        saveBtn.addEventListener("click", function () {
            let result = document.getElementById("result").value;
            if (result.trim() === "") {
                Swal.fire({
                    title: "Không có nội dung để lưu!",
                    icon: "warning",
                });
                return;
            }
            let resultDaSua = result.replace(/\n/g, "\r\n");
            let blob = new Blob([resultDaSua], { type: "text/plain" });
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "untitled.txt";
            link.click();
        });
    }

    // Nút Chỉnh sửa
    const editBtn = document.getElementById("edit-button");
    if (editBtn) {
        editBtn.addEventListener("click", function () {
            toggleEditMode("edit-button", "result");
        });
    }

    // Nút Xoá
    const deleteBtn = document.querySelector(".btn-danger");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
            Swal.fire({
                title: "Xóa thiệt hả?",
                text: "Coi chừng bấm lộn!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Xoá luôn!",
                cancelButtonText: "Không, bấm lộn rồi!",
                returnFocus: false
            }).then((result) => {
                if (result.isConfirmed) {
                    let resultTextarea = document.getElementById("result");
                    if (resultTextarea) {
                        resultTextarea.value = "";
                        resultTextarea.style.height = "auto";
                    }
                    updateLineNumbers();
                    resetEditMode();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            });
        });
    }

    // Nút Cuộn lên đầu
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Nút Copy Clipboard
    const copyBtn = document.getElementById("copy-button");
    if (copyBtn) {
        copyBtn.addEventListener("click", function () {
            const result = document.getElementById('result').value;
            if (result.trim() === "") {
                Swal.fire({
                    title: "Không có nội dung để sao chép!",
                    icon: "warning",
                });
                return;
            }
            navigator.clipboard.writeText(result)
                .then(() => {
                    Swal.fire({
                        icon: "success",
                        title: "Đã sao chép vào clipboard",
                        showConfirmButton: false,
                        timer: 1500
                    });
                })
                .catch(err => {
                    Swal.fire({
                        position: "top-end",
                        icon: "error",
                        title: "Không thể sao chép. Trình duyệt không hỗ trợ!",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    console.error("Clipboard copy failed:", err);
                });
        });
    }

    // Console Log
    window.addEventListener('load', function () {
        console.clear();
        console.log("%cTrang web là tài sản của D.N.T.N Kim Nhỏ, không sao chép dưới mọi hình thức!\n\n" +
            "This website is the property of Kim Nho Enterprise, do not copy in any form!",
            "color: red; font-size: 20px; font-weight: bold; text-align: center;");
    });
});