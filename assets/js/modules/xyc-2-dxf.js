let canvasPoints = [];
let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Biến theo dõi Click vs Pan trên Canvas
let clickStartX = 0;
let clickStartY = 0;
let activeRowIndex = null;

// Biến điều khiển Bôi đen ô bảng (Excel selection)
let isSelecting = false;
let startRowIdx = -1;
let startColIdx = -1;

document.addEventListener("DOMContentLoaded", function () {
    createRows(15);

    document.getElementById("btn-add-row")?.addEventListener("click", () => createRows(1));
    document.getElementById("btn-clear-table")?.addEventListener("click", clearTable);
    document.getElementById("btn-draw-preview")?.addEventListener("click", drawPreview);
    document.getElementById("btn-export-dxf")?.addEventListener("click", generateDXF);

    initCanvasEvents();
    initTableSelection();
});

// ==========================================
// TƯƠNG TÁC CANVAS (ZOOM, PAN & CLICK CHỌN PAD)
// ==========================================
function initCanvasEvents() {
    const canvas = document.getElementById("layoutCanvas");
    if (!canvas) return;

    // Zoom bằng con lăn chuột
    canvas.addEventListener("wheel", function (e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = Math.exp(wheel * zoomIntensity);

        viewOffsetX = mouseX - (mouseX - viewOffsetX) * zoomFactor;
        viewOffsetY = mouseY - (mouseY - viewOffsetY) * zoomFactor;

        viewScale *= zoomFactor;
        renderCanvas();
    });

    // Nhấn giữ chuột để di chuyển (Pan) hoặc Click
    canvas.addEventListener("mousedown", function (e) {
        isDragging = true;
        clickStartX = e.clientX;
        clickStartY = e.clientY;
        dragStartX = e.clientX - viewOffsetX;
        dragStartY = e.clientY - viewOffsetY;
        canvas.style.cursor = "grabbing";
    });

    canvas.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        viewOffsetX = e.clientX - dragStartX;
        viewOffsetY = e.clientY - dragStartY;
        renderCanvas();
    });

    canvas.addEventListener("mouseup", function (e) {
        isDragging = false;
        canvas.style.cursor = "crosshair";

        const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);

        // Di chuyển < 5px -> Coi như click chọn Pad
        if (dist < 5) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            handleCanvasClick(mouseX, mouseY);
        }
    });

    canvas.addEventListener("mouseout", function () {
        isDragging = false;
        canvas.style.cursor = "crosshair";
    });
}

function handleCanvasClick(mouseX, mouseY) {
    if (canvasPoints.length === 0) return;

    let clickedPoint = null;

    for (let i = canvasPoints.length - 1; i >= 0; i--) {
        let p = canvasPoints[i];
        let screenX = viewOffsetX + ((p.cx - window.baseMinX) * window.baseScale * viewScale);
        let screenY = viewOffsetY + ((window.baseMaxY - p.cy) * window.baseScale * viewScale);

        let padVisualSize = Math.max(4, Math.min(8 * viewScale, 30));
        let hitMargin = Math.max(padVisualSize / 2, 8);

        if (
            mouseX >= screenX - hitMargin &&
            mouseX <= screenX + hitMargin &&
            mouseY >= screenY - hitMargin &&
            mouseY <= screenY + hitMargin
        ) {
            clickedPoint = p;
            break;
        }
    }

    highlightRowAndPad(clickedPoint);
}

function highlightRowAndPad(point) {
    activeRowIndex = point ? point.rowIndex : null;

    clearSelection();

    if (point && point.trElement) {
        point.trElement.classList.add('active-row');

        const cells = point.trElement.querySelectorAll('td:not(.idx-col)');
        cells.forEach(cell => cell.classList.add('selected-cell'));

        // Chỉ cuộn khung bảng nội bộ (.table-container)
        const container = document.querySelector('.table-container');
        if (container) {
            const rowTop = point.trElement.offsetTop;
            const rowHeight = point.trElement.offsetHeight;
            const containerHeight = container.clientHeight;

            container.scrollTo({
                top: rowTop - (containerHeight / 2) + (rowHeight / 2),
                behavior: 'smooth'
            });
        }
    }

    renderCanvas();
}

// ==========================================
// THUẬT TOÁN BÔI ĐEN NHIỀU Ô (EXCEL SELECTION)
// ==========================================
function initTableSelection() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

    tbody.addEventListener("mousedown", function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TD') {
            const td = e.target.tagName === 'INPUT' ? e.target.parentElement : e.target;
            if (td.classList.contains('idx-col')) return;

            isSelecting = true;
            const tr = td.parentElement;
            startRowIdx = Array.from(tbody.children).indexOf(tr);
            startColIdx = Array.from(tr.children).indexOf(td);

            clearSelection();
            td.classList.add('selected-cell');
            tr.classList.add('active-row');

            activeRowIndex = startRowIdx;
            renderCanvas();

            if (e.target.tagName === 'INPUT') {
                e.target.focus();
            }
        }
    });

    tbody.addEventListener("mouseover", function (e) {
        if (!isSelecting) return;

        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TD') {
            const td = e.target.tagName === 'INPUT' ? e.target.parentElement : e.target;
            if (td.classList.contains('idx-col')) return;

            const tr = td.parentElement;
            const currentRowIdx = Array.from(tbody.children).indexOf(tr);
            const currentColIdx = Array.from(tr.children).indexOf(td);

            highlightCells(startRowIdx, startColIdx, currentRowIdx, currentColIdx);
        }
    });

    document.addEventListener("mouseup", function () {
        isSelecting = false;
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const selectedCells = document.querySelectorAll('.selected-cell input');

            if (selectedCells.length > 1 || (selectedCells.length === 1 && document.activeElement !== selectedCells[0])) {
                e.preventDefault();
                selectedCells.forEach(input => {
                    input.value = "";
                });
                drawPreview();
            }
        }
    });
}

function clearSelection() {
    document.querySelectorAll('.selected-cell').forEach(cell => {
        cell.classList.remove('selected-cell');
    });
    document.querySelectorAll('#dataTable tr').forEach(tr => {
        tr.classList.remove('active-row');
    });
}

function highlightCells(r1, c1, r2, c2) {
    clearSelection();
    const tbody = document.getElementById("tableBody");

    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);
    const minCol = Math.min(c1, c2);
    const maxCol = Math.max(c1, c2);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const row = tbody.children[r];
            if (row) {
                const cell = row.children[c];
                if (cell && !cell.classList.contains('idx-col')) {
                    cell.classList.add('selected-cell');
                }
            }
        }
    }
}

// ==========================================
// CÁC HÀM TẠO BẢNG & DÁN EXCEL
// ==========================================
function createRows(count, appendToBody = true) {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    const fragment = document.createDocumentFragment();
    let currentRows = tbody.rows.length;

    for (let i = 0; i < count; i++) {
        currentRows++;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="idx-col">${currentRows}</td>
            <td><input type="text" class="cell-data"></td>
            <td><input type="text" class="cell-data"></td>
            <td><input type="text" class="cell-data"></td>
        `;

        const inputs = tr.querySelectorAll("input");
        inputs.forEach(input => input.addEventListener("paste", handlePaste));

        fragment.appendChild(tr);
    }

    if (appendToBody) {
        tbody.appendChild(fragment);
    }
    return fragment;
}

function clearTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    activeRowIndex = null;
    createRows(15);
    drawPreview();
}

function handlePaste(e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData("Text");
    const rows = pastedText.trim().split("\n");

    const currentInput = e.target;
    const td = currentInput.parentElement;
    const tr = td.parentElement;
    const tbody = tr.parentElement;

    const startRowIdx = Array.from(tbody.children).indexOf(tr);
    const startColIdx = Array.from(tr.children).indexOf(td);

    const rowsNeeded = (startRowIdx + rows.length) - tbody.children.length;
    if (rowsNeeded > 0) {
        createRows(rowsNeeded);
    }

    rows.forEach((row, rIdx) => {
        const columns = row.split(/\t/);
        const targetRow = tbody.children[startRowIdx + rIdx];

        columns.forEach((colData, cIdx) => {
            const targetCell = targetRow.children[startColIdx + cIdx];
            if (targetCell) {
                const input = targetCell.querySelector("input");
                if (input) input.value = colData.trim();
            }
        });
    });

    drawPreview();
}

// ==========================================
// XUẤT FILE DXF CHUẨN INCH (3 CỘT BASE)
// ==========================================
function generateDXF() {
    const scale = 1 / 25400; // µm -> Inch
    const padSizeInput = parseFloat(document.getElementById("pad-size-mil")?.value);
    const padSizeMil = (!isNaN(padSizeInput) && padSizeInput > 0) ? padSizeInput : 1;

    const padSizeUm = padSizeMil * 25.4;
    const padSizeInch = padSizeUm * scale;
    const textHeightInch = (padSizeInch / 2);

    let dxfEntities = [];
    const rows = document.getElementById("tableBody").querySelectorAll("tr");
    let count = 0;

    for (let tr of rows) {
        let inputs = tr.querySelectorAll("input");
        let id = inputs[0].value.trim();
        let cx = parseFloat(inputs[1].value.trim());
        let cy = parseFloat(inputs[2].value.trim());

        if (!id || isNaN(cx) || isNaN(cy)) continue;
        count++;

        let cxInch = cx * scale;
        let cyInch = cy * scale;

        let xMin = (cxInch - padSizeInch / 2).toFixed(8);
        let xMax = (cxInch + padSizeInch / 2).toFixed(8);
        let yMin = (cyInch - padSizeInch / 2).toFixed(8);
        let yMax = (cyInch + padSizeInch / 2).toFixed(8);

        // KHỐI PAD (SOLID)
        dxfEntities.push(
            "  0\nSOLID\n  8\nPAD\n" +
            ` 10\n${xMin}\n 20\n${yMin}\n 30\n0.0\n` +
            ` 11\n${xMax}\n 21\n${yMin}\n 31\n0.0\n` +
            ` 12\n${xMin}\n 22\n${yMax}\n 32\n0.0\n` +
            ` 13\n${xMax}\n 23\n${yMax}\n 33\n0.0`
        );

        // KHỐI CHỮ PAD (TEXT - CANH GIỮA TÂM)
        dxfEntities.push(
            "  0\nTEXT\n  8\nTEXT\n" +
            ` 10\n${cxInch.toFixed(8)}\n 20\n${cyInch.toFixed(8)}\n 30\n0.0\n` +
            ` 40\n${textHeightInch.toFixed(8)}\n` +
            `  1\n${id}\n` +
            ` 72\n1\n` +
            ` 11\n${cxInch.toFixed(8)}\n 21\n${cyInch.toFixed(8)}\n 31\n0.0\n` +
            ` 73\n2`
        );
    }

    if (count === 0) {
        Swal.fire({ title: "Trống!", text: "Vui lòng nhập ít nhất 1 tọa độ.", icon: "warning" });
        return;
    }

    const header = "  0\nSECTION\n  2\nHEADER\n  9\n$INSUNITS\n 70\n1\n  0\nENDSEC\n  0\nSECTION\n  2\nENTITIES\n";
    const footer = "\n  0\nENDSEC\n  0\nEOF";

    const dxfContent = header + dxfEntities.join("\n") + footer;

    const blob = new Blob([dxfContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "PADS.dxf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// MÔ PHỎNG VẼ CANVAS RADAR
// ==========================================
function drawPreview() {
    const canvas = document.getElementById("layoutCanvas");
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    canvasPoints = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    const rows = document.getElementById("tableBody").querySelectorAll("tr");
    rows.forEach((tr, index) => {
        let inputs = tr.querySelectorAll("input");
        let id = inputs[0].value.trim();
        let cx = parseFloat(inputs[1].value.trim());
        let cy = parseFloat(inputs[2].value.trim());

        if (id && !isNaN(cx) && !isNaN(cy)) {
            canvasPoints.push({ id, cx, cy, trElement: tr, rowIndex: index });
            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;
        }
    });

    if (canvasPoints.length === 0) {
        renderCanvas();
        return;
    }

    let dx = maxX - minX, dy = maxY - minY;
    if (dx === 0) dx = 100;
    if (dy === 0) dy = 100;

    const padding = 50;
    window.baseScale = Math.min((canvas.width - padding * 2) / dx, (canvas.height - padding * 2) / dy);
    window.baseMinX = minX;
    window.baseMaxY = maxY;

    viewScale = 1;
    viewOffsetX = (canvas.width - (dx * window.baseScale)) / 2;
    viewOffsetY = (canvas.height - (dy * window.baseScale)) / 2;

    renderCanvas();
}

function renderCanvas() {
    const canvas = document.getElementById("layoutCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (canvasPoints.length === 0) {
        ctx.fillStyle = "#666"; ctx.font = "16px Arial"; ctx.textAlign = "center";
        ctx.fillText("Chưa có dữ liệu tọa độ", canvas.width / 2, canvas.height / 2);
        return;
    }

    for (let p of canvasPoints) {
        let screenX = viewOffsetX + ((p.cx - window.baseMinX) * window.baseScale * viewScale);
        let screenY = viewOffsetY + ((window.baseMaxY - p.cy) * window.baseScale * viewScale);
        let padVisualSize = Math.max(4, Math.min(8 * viewScale, 30));
        let fontSize = Math.max(9, Math.min(10 * viewScale, 16));
        const isSelected = activeRowIndex !== null && p.rowIndex === activeRowIndex;

        // Vẽ Pad
        if (isSelected) {
            let activeSize = padVisualSize + 4;
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(screenX - activeSize / 2, screenY - activeSize / 2, activeSize, activeSize);
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - (activeSize + 4) / 2, screenY - (activeSize + 4) / 2, activeSize + 4, activeSize + 4);
        } else {
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(screenX - padVisualSize / 2, screenY - padVisualSize / 2, padVisualSize, padVisualSize);
        }

        // Vẽ chữ trong Pad
        ctx.textAlign = "center";
        ctx.font = `bold ${fontSize}px Arial`;
        let textDrawY = screenY - (padVisualSize / 2) - 4;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.strokeText(p.id, screenX, textDrawY);
        ctx.fillStyle = isSelected ? "#00ffff" : "#ffffff";
        ctx.fillText(p.id, screenX, textDrawY);
    }
}