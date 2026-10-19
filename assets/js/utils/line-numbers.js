// ==========================================
// QUẢN LÝ ĐÁNH SỐ DÒNG (LINE NUMBERS) CHO CẢ INPUT VÀ OUTPUT
// ==========================================

// Hàm tính toán và xuất số dòng cho một cặp textarea & line-numbers
function updateLineNumbersFor(textareaId, lineNumbersId) {
    const textarea = document.getElementById(textareaId);
    const lineNumbersDiv = document.getElementById(lineNumbersId);
    if (!textarea || !lineNumbersDiv) return;

    const lines = textarea.value.split("\n");
    const lineCount = lines.length;

    let lineNumHTML = "";
    for (let i = 1; i <= lineCount; i++) {
        lineNumHTML += i + "<br>";
    }
    lineNumbersDiv.innerHTML = lineNumHTML || "1";
}

// Giữ lại hàm cũ để gcode-processor.js và main.js gọi bình thường
function updateLineNumbers() {
    updateLineNumbersFor("result", "line-numbers");
}

// Hàm cập nhật riêng cho ô Input
function updateInputLineNumbers() {
    updateLineNumbersFor("inputCNC", "input-line-numbers");
}

// Thiết lập sự kiện cuộn đồng bộ và lắng nghe nhập liệu
function setupLineNumbers(textareaId, lineNumbersId) {
    const textarea = document.getElementById(textareaId);
    const lineNumbersDiv = document.getElementById(lineNumbersId);
    if (!textarea || !lineNumbersDiv) return;

    const update = () => updateLineNumbersFor(textareaId, lineNumbersId);

    // Cập nhật khi gõ phím, dán hoặc thay đổi giá trị
    textarea.addEventListener("input", update);
    textarea.addEventListener("change", update);
    textarea.addEventListener("paste", () => setTimeout(update, 10));

    // ĐỒNG BỘ CUỘN: Khi textarea cuộn thì cột số dòng cuộn theo
    textarea.addEventListener("scroll", function () {
        lineNumbersDiv.scrollTop = this.scrollTop;
    });

    update();
}

// Tự động khởi tạo cả 2 khung ngay khi nạp trang
document.addEventListener("DOMContentLoaded", function () {
    setupLineNumbers("inputCNC", "input-line-numbers");
    setupLineNumbers("result", "line-numbers");
});