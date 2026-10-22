// ==========================================
// THUẬT TOÁN TẠO CÁC TẦNG Z ÂM
// ==========================================
function milAddingUp(input, milDownValue, milEachValue) {
    const spacingEl = document.querySelector("input[name='spacing']:checked");
    const centerEl = document.querySelector("input[name='center']:checked");
    const commentEl = document.querySelector("input[name='comment']:checked");

    const spacing = spacingEl ? spacingEl.value : "no";
    const center = centerEl ? centerEl.value : "no";
    const comment = commentEl ? commentEl.value : "no";

    // Đọc trực tiếp từ biến toàn cục
    const selectedMode = window.selectedMode || "Cắt";

    // Khai báo cục bộ để tránh bị cộng dồn kết quả
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
            let block = head + "\n" + `G01 Z-${zString}\n`;
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

// ==========================================
// THUẬT TOÁN PHÂN TÁCH KHỐI VÀ XỬ LÝ MIL
// ==========================================
function putMilInBlocks(input) {
    const selectedMode = window.selectedMode || "Cắt";

    const startEndEl = document.querySelector("input[name='start-end']:checked");
    const spacingEl = document.querySelector("input[name='spacing']:checked");

    const startEnd = startEndEl ? startEndEl.value : "no";
    const spacing = spacingEl ? spacingEl.value : "no";

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
        // Lọc bỏ các khối rỗng
        rawBlocks = input.split(/(?=G00)/).filter(b => b.trim() !== "");
        const ceramicThickness = parseFloat(document.querySelector("select#ceramic-thickness")?.value || 125);
        const ringAngle = parseFloat(document.querySelector("select#ring-angles")?.value || 7);
        const ringBottom = parseFloat(document.querySelector("input#ring-bottom-thickness")?.value || 60);
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
    } else if (selectedMode === "Cắt") {
        // Lọc bỏ các khối rỗng
        rawBlocks = input.split(/(?=G00)/).filter(b => b.trim() !== "");

        // Lấy đúng ID ô mil-down
        const milDownInput = document.getElementById("mil-down");
        const milDown = milDownInput ? milDownInput.value : 0;

        const cutRadio = document.querySelector("input[name='cut-depth']:checked");
        const milEach = cutRadio ? cutRadio.value : "5";
        milEachValue = milEach === "custom" ? (document.getElementById("customCutDepthValue")?.value || 0) : milEach;

        milDownValue = parseFloat(milDown);
        milEachValue = parseFloat(milEachValue);
        milBlocks = rawBlocks.map(block => ({ block, milDown: milDownValue }));
    } else if (selectedMode === "Đục lỗ") {
        // Lọc bỏ các dòng rỗng
        rawBlocks = input.split("\n").filter(b => b.trim() !== "");

        const drillRadio = document.querySelector("input[name='drill-depth']:checked");
        const milEach = drillRadio ? drillRadio.value : "5";

        if (milEach === "custom") {
            const milDown = document.getElementById("customDrillDepthValue")?.value || 0;
            milEachValue = document.getElementById("customDrillEachValue")?.value || 0;
            milDownValue = parseFloat(milDown);
        } else {
            milDownValue = milEachValue = parseFloat(milEach);
        }

        milBlocks = rawBlocks.map(block => ({ block, milDown: milDownValue }));
    }

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

    let output = startEnd === "yes" ? startText : "";

    milBlocks.forEach(({ block, milDown }, i) => {
        let blockResult = milAddingUp(block, milDown, milEachValue);
        if (spacing === "yes" && i !== milBlocks.length - 1) blockResult += "\n";
        output += blockResult;
    });

    if (startEnd === "yes") {
        output = output.trim() + (spacing === "yes" ? "\n\n\n" : "\n") + endText.trim();
    }

    // Ghi đè kết quả mới
    const resultTextarea = document.querySelector("#result");
    if (resultTextarea) {
        resultTextarea.value = output.trim();
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";
    }

    if (typeof updateLineNumbers === "function") {
        updateLineNumbers();
    }

    // Đọc trực tiếp từ checkbox để xác định có giữ tùy chọn hay không
    const keepOptions = document.getElementById("keep-options");
    const isKeep = keepOptions ? keepOptions.checked : false;

    if (!isKeep) {
        const inputArea = document.getElementById("inputCNC");
        if (inputArea) {
            inputArea.value = "";

            // Đặt lại số dòng của Input về 1 và cuộn lên đầu
            const inputLines = document.getElementById("input-line-numbers");
            if (inputLines) {
                inputLines.innerHTML = "1";
                inputLines.scrollTop = 0;
            }
        }

        if (typeof resetValues === "function") {
            resetValues();
        }
    }
}

// Gắn trực tiếp lên window để tránh lỗi ReferenceError
window.milAddingUp = milAddingUp;
window.putMilInBlocks = putMilInBlocks;
