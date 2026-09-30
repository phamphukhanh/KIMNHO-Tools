document.addEventListener("DOMContentLoaded", function () {
    // Không cho phép người dùng nhập dấu trừ và ký tự khoa học vào các ô nhập liệu số
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
    const ringAngles = document.getElementById("ring-angles");
    const customCutDepth = document.getElementById("custom-cut-depth");
    const customDrillDepth = document.getElementById("custom-drill-depth");
    const keepOptions = document.getElementById("keep-options");
    let selectedMode = "";
    let keepOptionFlag = keepOptions.checked; // lưu trạng thái ban đầu

    keepOptions.addEventListener("change", function () {
        keepOptionFlag = !keepOptionFlag; // chỉ cập nhật biến, không ảnh hưởng checkbox
    });

    // Kích hoạt tooltip
    $(tooltipElement).tooltip("show");

    // Ẩn sau 2.5 giây
    setTimeout(() => {
        $(tooltipElement).tooltip("hide");
    }, 2000);

    // Cập nhật tooltip dựa theo lựa chọn
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


    // Gắn một lần duy nhất cho dropdown items
    dropdownItems.forEach(item => {
        item.addEventListener("click", function () {
            const selectedText = this.textContent.trim();
            dropdownLabel.textContent = selectedText;

            // Cập nhật tooltip
            // Hiện/ẩn form tương ứng
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

            // Đặt lại các ô nhập liệu về mặc định
            if (!keepOptionFlag) {
                resetValues();
            }

            updateTooltipContent(selectedText);
            resetEditMode();
        });
    });

    function resetValues() {
        // Reset các radio về mặc định
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
        // Đặt lại các ô nhập liệu về mặc định
        customCutDepth.style.display = this.value === "custom" ? "block" : "none";
        customDrillDepth.style.display = this.value === "custom" ? "block" : "none";
        customDrillDepth.style.display = "none";
    }

    // Ẩn/hiện input 'Số khác' trong đục lỗ
    document.querySelectorAll("input[name='drill-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            customDrillDepth.style.display = this.value === "custom" ? "block" : "none";
            document.getElementById("customDrillDepthValue").focus();
        });
    });

    // Ẩn/hiện input 'Số khác' trong cắt
    document.querySelectorAll("input[name='cut-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            customCutDepth.style.display = this.value === "custom" ? "block" : "none";
            document.getElementById("customCutDepthValue").focus();
        });
    });


    // Hàm này sẽ xử lý việc gắn số Mil (xuống và lên) vào các khối G-code
    // Nếu milDownValue lớn hơn milEachValue, nó sẽ chia nhỏ các bước cắt thành các khối nhỏ hơn
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
        let rawBlocks = []; // Dùng biến riêng để lưu mảng các block, tránh đè lên chuỗi input

        // -----------------------------
        // XỬ LÝ TỪNG CHẾ ĐỘ RIÊNG BIỆT
        // -----------------------------

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

        // -----------------------------
        // KIỂM TRA GIÁ TRỊ MIL
        // -----------------------------

        if (selectedMode !== "Chạy độ ring") {
            milDownValue = parseFloat(milDownValue);
            milEachValue = parseFloat(milEachValue);

            const isInvalidInput =
                isNaN(milDownValue) || isNaN(milEachValue) ||
                (milDownValue === 0 && milEachValue !== 0) ||
                (!isNaN(milDownValue) && milDownValue !== 0 && milEachValue === 0);

            if (isInvalidInput) {
                Swal.fire({
                    title: "Số Mil cần xuống hoặc mỗi lần xuống chưa đúng! (bị bỏ trống hoặc bằng 0)",
                    text: "Tự động đặt lại về 0.",
                    icon: "warning"
                });
                milDownValue = 0;
                milEachValue = 0;
                milBlocks = rawBlocks.map(block => ({ block, milDown: 0 }));
            }

            if (milDownValue < 0) {
                Swal.fire({
                    title: "Số Mil cần xuống nhập vào bị âm!",
                    text: "Kiểm tra lại số Mil cần xuống.",
                    icon: "warning"
                });
                return;
            }

            if (milEachValue < 0) {
                Swal.fire({
                    title: "Số Mil mỗi lần xuống nhập vào bị âm!",
                    text: "Kiểm tra lại số Mil mỗi lần xuống.",
                    icon: "warning"
                });
                return;
            }

            if (
                milDownValue < milEachValue &&
                milDownValue !== 0 &&
                milEachValue !== 0
            ) {
                Swal.fire({
                    title: "Số Mil cần xuống phải lớn hơn hoặc bằng mỗi lần xuống!",
                    icon: "warning"
                });
                return;
            }
        }

        // -----------------------------
        // XỬ LÝ KẾT QUẢ
        // -----------------------------

        let output = startEnd === "yes" ? startText : "";

        milBlocks.forEach(({ block, milDown }, i) => {
            let result = milAddingUp(block, milDown, milEachValue);
            if (spacing === "yes" && i !== milBlocks.length - 1) result += "\n";
            output += result;
        });

        if (startEnd === "yes") {
            output = output.trim() + endText;
        }

        // -----------------------------
        // HIỂN THỊ KẾT QUẢ
        // -----------------------------

        const resultTextarea = document.querySelector("#result");
        resultTextarea.value = output.trim();
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";

        if (!keepOptionFlag) {
            document.getElementById("inputCNC").value = "";
            resetValues();
        }
    } function putMilInBlocks(input) {
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
        let rawBlocks = []; // Dùng biến riêng để lưu mảng các block, tránh đè lên chuỗi input

        // -----------------------------
        // XỬ LÝ TỪNG CHẾ ĐỘ RIÊNG BIỆT
        // -----------------------------

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

        // -----------------------------
        // KIỂM TRA GIÁ TRỊ MIL
        // -----------------------------

        if (selectedMode !== "Chạy độ ring") {
            milDownValue = parseFloat(milDownValue);
            milEachValue = parseFloat(milEachValue);

            const isInvalidInput =
                isNaN(milDownValue) || isNaN(milEachValue) ||
                (milDownValue === 0 && milEachValue !== 0) ||
                (!isNaN(milDownValue) && milDownValue !== 0 && milEachValue === 0);

            if (isInvalidInput) {
                Swal.fire({
                    title: "Số Mil cần xuống hoặc mỗi lần xuống chưa đúng! (bị bỏ trống hoặc bằng 0)",
                    text: "Tự động đặt lại về 0.",
                    icon: "warning"
                });
                milDownValue = 0;
                milEachValue = 0;
                milBlocks = rawBlocks.map(block => ({ block, milDown: 0 }));
            }

            if (milDownValue < 0) {
                Swal.fire({
                    title: "Số Mil cần xuống nhập vào bị âm!",
                    text: "Kiểm tra lại số Mil cần xuống.",
                    icon: "warning"
                });
                return;
            }

            if (milEachValue < 0) {
                Swal.fire({
                    title: "Số Mil mỗi lần xuống nhập vào bị âm!",
                    text: "Kiểm tra lại số Mil mỗi lần xuống.",
                    icon: "warning"
                });
                return;
            }

            if (
                milDownValue < milEachValue &&
                milDownValue !== 0 &&
                milEachValue !== 0
            ) {
                Swal.fire({
                    title: "Số Mil cần xuống phải lớn hơn hoặc bằng mỗi lần xuống!",
                    icon: "warning"
                });
                return;
            }
        }

        // -----------------------------
        // XỬ LÝ KẾT QUẢ
        // -----------------------------

        let output = startEnd === "yes" ? startText : "";

        milBlocks.forEach(({ block, milDown }, i) => {
            let result = milAddingUp(block, milDown, milEachValue);
            if (spacing === "yes" && i !== milBlocks.length - 1) result += "\n";
            output += result;
        });

        if (startEnd === "yes") {
            output = output.trim() + endText;
        }

        // -----------------------------
        // HIỂN THỊ KẾT QUẢ
        // -----------------------------

        const resultTextarea = document.querySelector("#result");
        resultTextarea.value = output.trim();
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";

        if (!keepOptionFlag) {
            document.getElementById("inputCNC").value = "";
            resetValues();
        }
    }


    // Hàm này sẽ thêm các khối G-code vào đầu vào dựa trên giá trị milDownValue và milEachValue
    // Nếu milDownValue lớn hơn milEachValue, nó sẽ chia nhỏ các bước cắt thành các khối nhỏ hơn
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
                // Đổi toFixed(3) thành toFixed(4) để xuất chuẩn Z-0.0005 khi xuống 0.5 mil
                let block = "G00 X0.000 Y0.000\n" + `G01 Z-${formattedValue.toFixed(4)}\n`;

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
                // Ép ra 4 số thập phân, sau đó loại bỏ số 0 thứ 4 nếu nó nằm cuối chuỗi. 
                // Nếu nó là số chẵn như 0.0200 -> 0.020. Nếu là 0.0005 -> 0.0005
                let zString = formattedValue.toFixed(4).replace(/(\.\d{3})0$/, "$1");
                let block = head + "\n" + `G01 Z-${zString}\n`;
                if (rest !== "") {
                    block += rest + "\n";
                }
                block += "G01 Z0.050\n";
                if (spacing === "yes") block += "\n";
                return block;
            };
        }

        // Lặp xuống Z (dùng làm tròn chuẩn xử lý số thực JavaScript)
        let current = parseFloat(milEachValue);
        let target = parseFloat(milDownValue);
        let step = parseFloat(milEachValue);
        const EPSILON = 0.00001;

        while (current < target - EPSILON) {
            result += addBlock(current);
            current = Math.round((current + step) * 10000) / 10000;
        }

        if (target > 0) {
            result += addBlock(target);
        }

        return result;
    }

    // Hàm này sẽ xử lý logic bật tắt ô kết quả
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

        // Chỉ thực hiện nếu đang chỉnh sửa
        if (!textarea.hasAttribute("readonly")) {
            textarea.setAttribute("readonly", true);
            icon.className = "fa fa-pencil-square-o";
            text.textContent = "Chỉnh sửa";
        }
    }




    // Đoạn mã này đọc nội dung của tệp tin mẫu G-code và hiển thị vào textarea
    document.querySelector(".btn-primary").addEventListener("click", function () {
        // Lấy mẫu G-code từ textarea đầu tiên và xử lý chuỗi
        let input = document.querySelectorAll("textarea")[0].value.trim();
        if (input.includes("Z-") || input.includes("G01 Z0.050") || input.includes("G00 X0.000 Y0.000")) {
            Swal.fire({
                title: "G-code đã có chỉnh sửa!\n(Chứa Z- hoặc G01 Z0.050 hoặc G00 X0.000 Y0.000)",
                text: "Vui lòng nhập G-code chưa chỉnh sửa.",
                icon: "warning",
            });
            return;
        }
        // Kiểm tra xem ô nhập liệu có trống hay không
        if (input === "") {
            Swal.fire({
                title: "Chưa điền G-code CNC!",
                icon: "warning",
            });
            return;
        }
        // Xóa các chuỗi không cần thiết
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

    // Đoạn mã này sẽ lưu nội dung của textarea kết quả vào một tệp tin khi nhấn nút "Lưu file"
    document.querySelector(".btn-success").addEventListener("click", function () {
        let result = document.getElementById("result").value;
        if (result.trim() === "") {
            Swal.fire({
                title: "Không có nội dung để lưu!",
                icon: "warning",
            });
            return;
        }
        // Thay thế tất cả các ký tự xuống dòng (\n) bằng tổ hợp \r\n
        let resultDaSua = result.replace(/\n/g, "\r\n");
        let blob = new Blob([resultDaSua], { type: "text/plain" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "untitled.txt";
        link.click();
    });

    // Đoạn mã này sẽ mở/tắt chế độ chỉnh sửa cho textarea kết quả và thay đổi tên nút
    document.getElementById("edit-button").addEventListener("click", function () {
        toggleEditMode("edit-button", "result");
    });

    // Đoạn mã này sẽ xóa nội dung trong ô kết quả và đặt lại chiều cao của nó về auto khi nhấn nút "Xoá"
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
            returnFocus: false // 🧠 Ngăn SweetAlert tự focus lại nút cũ
        }).then((result) => {
            if (result.isConfirmed) {
                let resultTextarea = document.getElementById("result");
                resultTextarea.value = ""; // Xoá nội dung trong ô kết quả
                resultTextarea.style.height = "auto"; // Đặt lại chiều cao ban đầu
                resetEditMode(); // Đặt lại chế độ chỉnh sửa
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });

    // Đoạn mã này sẽ cuộn lên đầu trang khi nhấn nút "Cuộn lên đầu trang"
    document.getElementById("scrollTopBtn").addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Đoạn mã này sẽ sao chép nội dung trong ô kết quả vào clipboard khi nhấn nút "Sao chép"
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

    window.addEventListener('load', function () {
        // Làm sạch console khi trang được tải
        // và hiển thị thông báo về quyền sở hữu trang web
        console.clear();
        console.log("%cTrang web là tài sản của D.N.T.N Kim Nhỏ, không sao chép dưới mọi hình thức!\n\n" +
            "This website is the property of Kim Nho Enterprise, do not copy in any form!",
            "color: red; font-size: 20px; font-weight: bold; text-align: center;");
    });
});