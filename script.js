document.addEventListener("DOMContentLoaded", function () {
    // Chặn người dùng nhập dấu trừ và ký tự khoa học (e/E) vào ô số
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
    let selectedMode = "";
    let keepOptionFlag = keepOptions.checked;

    keepOptions.addEventListener("change", function () {
        keepOptionFlag = !keepOptionFlag;
    });

    // Kích hoạt tooltip ban đầu
    $(tooltipElement).tooltip("show");
    setTimeout(() => {
        $(tooltipElement).tooltip("hide");
    }, 2000);

    // Cập nhật nội dung Tooltip theo chế độ lựa chọn
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

        tooltipElement.setAttribute("data-original-title", content);
        $(tooltipElement).tooltip("hide").tooltip("show");

        setTimeout(() => {
            $(tooltipElement).tooltip("hide");
        }, 2500);
    }

    // Xử lý chuyển đổi Form khi chọn loại gia công
    dropdownItems.forEach(item => {
        item.addEventListener("click", function () {
            const selectedText = this.textContent.trim();
            dropdownLabel.textContent = selectedText;

            if (selectedText === "Đục lỗ") {
                formCut.style.display = "none";
                formRingAngle.style.display = "none";
                formDrill.style.display = "block";
            } else if (selectedText === "Chạy độ ring") {
                formCut.style.display = "none";
                formDrill.style.display = "none";
                formRingAngle.style.display = "block";
            } else {
                formCut.style.display = "block";
                formDrill.style.display = "none";
                formRingAngle.style.display = "none";
            }

            if (!keepOptionFlag) {
                resetValues();
            }

            updateTooltipContent(selectedText);
            resetEditMode();
        });
    });

    function resetValues() {
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

        customCutDepth.style.display = "none";
        customDrillDepth.style.display = "none";
    }

    // Ẩn/hiện ô 'Số khác'
    document.querySelectorAll("input[name='drill-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            customDrillDepth.style.display = this.value === "custom" ? "block" : "none";
            document.getElementById("customDrillDepthValue").focus();
        });
    });

    document.querySelectorAll("input[name='cut-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            customCutDepth.style.display = this.value === "custom" ? "block" : "none";
            document.getElementById("customCutDepthValue").focus();
        });
    });

    // Cập nhật cột số dòng bên trái ô Kết quả
    function updateLineNumbers() {
        const resultTextarea = document.getElementById("result");
        const lineNumbersDiv = document.getElementById("line-numbers");

        const lines = resultTextarea.value.split("\n");
        const lineCount = lines.length;

        let lineNumHTML = "";
        for (let i = 1; i <= lineCount; i++) {
            lineNumHTML += i + "<br>";
        }
        lineNumbersDiv.innerHTML = lineNumHTML || "1";
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";
    }

    // Lắng nghe gõ trực tiếp trong ô kết quả khi Edit
    document.getElementById("result").addEventListener("input", function () {
        updateLineNumbers();
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });

    // Hàm gắn Mil vào các khối G-Code
    function putMilInBlocks(input) {
        selectedMode = document.querySelector(".dropdown-toggle span").textContent.trim();
        const startEnd = document.querySelector("input[name='start-end']:checked").value;
        const spacing = document.querySelector("input[name='spacing']:checked").value;

        let startText = "N10 G01 Z0.050 F4\nN20 G01 Z0.050\nM03\n";
        let endText = "\nG00 X0.000 Y0.000\nM04\nM30";

        if (spacing === "yes") {
            startText = startText.replace("M03\n", "M03\n\n\n");
            endText = endText.replace("\nG00", "\n\n\nG00");
        }

        let milDownValue = 0;
        let milEachValue = 0;
        let milBlocks = [];
        let rawBlocks = [];

        if (selectedMode === "Chạy độ ring") {
            rawBlocks = input.split(/(?=G00)/);
            const ceramicThickness = parseFloat(document.querySelector("select#ceramic-thickness").value);
            const ringAngle = parseFloat(document.querySelector("select#ring-angles").value);
            const ringBottom = parseFloat(document.querySelector("input#ring-bottom-thickness").value);
            milEachValue = 20;

            let currentMil = ceramicThickness - ringBottom;

            rawBlocks.forEach(block => {
                if (currentMil < 0) {
                    Swal.fire({
                        title: "Có gì đó sai sai!",
                        text: "Kiểm tra lại độ, số vòng, bề dày phôi sứ và bề dày đít ring.",
                        icon: "warning",
                    });
                    return;
                }
                milBlocks.push({ block, milDown: currentMil });
                currentMil -= (ringAngle - 1);
            });
        }

        else if (selectedMode === "Cắt") {
            rawBlocks = input.split(/(?=G00)/);
            const milDown = document.querySelectorAll("input[type='number']")[0].value;
            const milEach = document.querySelector("input[name='cut-depth']:checked").value;
            milEachValue = milEach === "custom" ? document.getElementById("customCutDepthValue").value : milEach;

            milDownValue = parseFloat(milDown);
            milEachValue = parseFloat(milEachValue);
            milBlocks = rawBlocks.map(block => ({ block, milDown: milDownValue }));
        }

        else if (selectedMode === "Đục lỗ") {
            rawBlocks = input.split("\n");
            const milEach = document.querySelector("input[name='drill-depth']:checked").value;
            if (milEach === "custom") {
                const milDown = document.querySelectorAll("input[type='number']")[2].value;
                milEachValue = document.getElementById("customDrillEachValue").value;
                milDownValue = parseFloat(milDown);
            } else {
                milDownValue = milEachValue = parseFloat(milEach);
            }

            milBlocks = rawBlocks.map(block => ({ block, milDown: milDownValue }));
        }

        // Kiểm tra thông số Mil không hợp lệ
        if (selectedMode !== "Chạy độ ring") {
            milDownValue = parseFloat(milDownValue);
            milEachValue = parseFloat(milEachValue);

            const isInvalidInput =
                isNaN(milDownValue) || isNaN(milEachValue) ||
                milDownValue < 0 || milEachValue < 0 ||
                (milDownValue === 0 && milEachValue !== 0) ||
                (milDownValue !== 0 && milEachValue === 0) ||
                (milDownValue < milEachValue && milDownValue !== 0 && milEachValue !== 0);

            if (isInvalidInput) {
                Swal.fire({
                    title: "Thông số Mil không hợp lệ hoặc bị bỏ trống!",
                    text: "Tự động đặt về 0 (Z-0.000).",
                    icon: "warning"
                });
                milDownValue = 0;
                milEachValue = 0;
                milBlocks = rawBlocks.map(block => ({ block, milDown: 0 }));
            }
        }

        // Tạo chuỗi kết quả
        let output = startEnd === "yes" ? startText : "";

        milBlocks.forEach(({ block, milDown }, i) => {
            let result = milAddingUp(block, milDown, milEachValue);
            if (spacing === "yes" && i !== milBlocks.length - 1) result += "\n";
            output += result;
        });

        if (startEnd === "yes") {
            output = output.trim() + endText;
        }

        // Hiển thị ra giao diện
        const resultTextarea = document.querySelector("#result");
        resultTextarea.value = output.trim();
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";

        updateLineNumbers();

        if (!keepOptionFlag) {
            document.getElementById("inputCNC").value = "";
            resetValues();
        }
    }

    // Hàm tạo các tầng Z âm
    function milAddingUp(input, milDownValue, milEachValue) {
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        const center = document.querySelector("input[name='center']:checked").value;
        const comment = document.querySelector("input[name='comment']:checked").value;
        let result = "";

        input = input.split("\n");

        if (comment === 'yes' && input[0].trim() !== ";") {
            result += "; \n";
        }

        if (!input[0].includes("G00") && !input[0].includes("G01")) {
            input[0] = "G00 " + input[0];
        } else if (input[0].includes("G01") && !input[0].includes("G00")) {
            input[0] = input[0].replace("G01", "G00");
        }

        let head = input[0].trim();
        let rest = input.length > 1 ? input.slice(1).join("\n").trim() : "";

        let addBlock;

        if (center === "yes" && selectedMode === "Cắt") {
            let headerModified = head.includes("G00") ? head.replace(/G00/g, "G01") : head;
            let firstLine = rest.split("\n")[0].trim();
            let headCoords = headerModified.replace(/G[0-9]+/g, "").trim();
            let firstCoords = firstLine.replace(/G[0-9]+/g, "").trim();

            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000;
                let zString = formattedValue.toFixed(4).replace(/(\.\d{3})0$/, "$1");
                let block = "G00 X0.000 Y0.000\n" + `G01 Z-${zString}\n`;

                if (headCoords !== firstCoords) {
                    block += headerModified + "\n";
                }

                if (rest !== "") {
                    block += rest + "\n";
                }
                block += "G01 Z0.050\n";
                if (spacing === "yes") block += "\n";
                return block;
            };
        } else {
            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000;
                let zString = formattedValue.toFixed(4).replace(/(\.\d{3})0$/, "$1");
                let block = head + "\n" +
                    `G01 Z-${zString}\n`;
                if (rest !== "") {
                    block += rest + "\n";
                }
                block += "G01 Z0.050\n";
                if (spacing === "yes") block += "\n";
                return block;
            };
        }

        let current = parseFloat(milEachValue);
        let target = parseFloat(milDownValue);
        let step = parseFloat(milEachValue);
        const EPSILON = 0.00001;

        if (target === 0 || step === 0 || isNaN(target) || isNaN(step)) {
            result += addBlock(0);
        } else {
            while (current < target - EPSILON) {
                result += addBlock(current);
                current = Math.round((current + step) * 10000) / 10000;
            }
            if (target >= 0) {
                result += addBlock(target);
            }
        }

        return result;
    }

    // Chế độ Edit
    function toggleEditMode(buttonId, textareaId) {
        const button = document.getElementById(buttonId);
        const textarea = document.getElementById(textareaId);
        const icon = button.querySelector("i");
        const text = button.querySelector(".btn-text");

        if (textarea.hasAttribute("readonly")) {
            textarea.removeAttribute("readonly");
            textarea.focus();
            icon.className = "fa fa-check";
            text.textContent = "Hoàn tất";
        } else {
            textarea.setAttribute("readonly", true);
            icon.className = "fa fa-pencil-square-o";
            text.textContent = "Chỉnh sửa";
        }
    }

    function resetEditMode() {
        const button = document.getElementById("edit-button");
        const textarea = document.getElementById("result");
        const icon = button.querySelector("i");
        const text = button.querySelector(".btn-text");

        if (!textarea.hasAttribute("readonly")) {
            textarea.setAttribute("readonly", true);
            icon.className = "fa fa-pencil-square-o";
            text.textContent = "Chỉnh sửa";
        }
    }

    // Nút Xem kết quả
    document.querySelector(".btn-primary").addEventListener("click", function () {
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
        updateLineNumbers();
    });

    // Nút Lưu file
    document.querySelector(".btn-success").addEventListener("click", function () {
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

    // Nút Chỉnh sửa
    document.getElementById("edit-button").addEventListener("click", function () {
        toggleEditMode("edit-button", "result");
    });

    // Nút Xoá
    document.querySelector(".btn-danger").addEventListener("click", function () {
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
                resultTextarea.value = "";
                resultTextarea.style.height = "auto";
                updateLineNumbers();
                resetEditMode();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });

    // Nút Cuộn lên đầu
    document.getElementById("scrollTopBtn").addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Nút Copy Clipboard
    document.getElementById("copy-button").addEventListener("click", function () {
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

    // Xử lý Đồng hồ Header
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('vi-VN');
        const clockEl = document.getElementById('live-clock');
        if (clockEl) clockEl.textContent = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Xử lý Dark Mode & Save State
    const darkModeBtn = document.getElementById("toggle-dark-mode");

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

    if (darkModeBtn) {
        darkModeBtn.addEventListener("click", function () {
            const isDark = !document.body.classList.contains("dark-mode");
            setDarkMode(isDark);
        });
    }

    // Thông báo Console khi load xong
    window.addEventListener('load', function () {
        console.clear();
        console.log("%cTrang web là tài sản của Khanh Pham dành cho D.N.T.N Kim Nhỏ, không sao chép dưới mọi hình thức!\n\n" +
            "This website is the property of Kim Nho Enterprise, do not copy in any form!",
            "color: red; font-size: 20px; font-weight: bold; text-align: center;");
    });
});