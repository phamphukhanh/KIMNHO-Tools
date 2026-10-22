// ==========================================
// QUẢN LÝ ĐÁNH SỐ DÒNG (LINE NUMBERS) CHO CẢ INPUT VÀ OUTPUT
// ==========================================

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

function updateLineNumbers() {
    updateLineNumbersFor("result", "line-numbers");
}

function setupLineNumbers(textareaId, lineNumbersId) {
    const textarea = document.getElementById(textareaId);
    const lineNumbersDiv = document.getElementById(lineNumbersId);
    if (!textarea || !lineNumbersDiv) return;

    const update = () => updateLineNumbersFor(textareaId, lineNumbersId);

    textarea.addEventListener("input", update);
    textarea.addEventListener("change", update);
    textarea.addEventListener("paste", () => setTimeout(update, 10));

    // ĐỒNG BỘ CUỘN
    textarea.addEventListener("scroll", function () {
        lineNumbersDiv.scrollTop = this.scrollTop;
    });

    update();
}

document.addEventListener("DOMContentLoaded", function () {
    setupLineNumbers("inputCNC", "input-line-numbers");
    setupLineNumbers("result", "line-numbers");
});