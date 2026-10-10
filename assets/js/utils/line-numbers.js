// Cập nhật cột đánh số dòng cho ô Kết quả G-code
function updateLineNumbers() {
    const resultTextarea = document.getElementById("result");
    const lineNumbersDiv = document.getElementById("line-numbers");
    if (!resultTextarea || !lineNumbersDiv) return;

    const lines = resultTextarea.value.split("\n");
    const lineCount = lines.length;

    let lineNumHTML = "";
    for (let i = 1; i <= lineCount; i++) {
        lineNumHTML += i + "<br>";
    }
    lineNumbersDiv.innerHTML = lineNumHTML || "1";
}