document.addEventListener("DOMContentLoaded", function () {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    const tooltipElement = document.querySelector('.small-tooltip');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const dropdownLabel = document.querySelector('.dropdown-toggle span');

    const formCut = document.getElementById("form-cut");
    const formDrill = document.getElementById("form-drill");
    const customDepth = document.getElementById("custom-depth");

    // Cập nhật tooltip dựa theo lựa chọn
    function updateTooltipContent(option) {
        let content = '';
        if (option === 'Cắt') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Cắt đường thẳng, đường cong.</b><br><br>
                1. Chạy BobCad 1 vòng.<br>
                2. Copy G-code vào đây (không nhất thiết phải xoá Z0.)
            </div>`;
        } else if (option === 'Đục lỗ') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Đục định vị, lỗ khác.</b><br><br>
                1. Chấm các chấm trong BobCad.<br>
                2. Copy G-code vào.
            </div>`;
        } else if (option === 'Khắc chữ') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Khắc chữ block.</b><br><br>
                1. Chạy chữ trong BobCad, sau mỗi chữ có 2 dòng trống.<br>
                2. Copy G-code vào.
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
            updateTooltipContent(selectedText);

            // Hiện/ẩn form tương ứng
            if (selectedText === "Đục lỗ" || selectedText === "Khắc chữ") {
                formCut.style.display = "none";
                formDrill.style.display = "block";
            } else {
                formCut.style.display = "block";   // Cho cả Cắt và Khắc chữ
                formDrill.style.display = "none";
                customDepth.style.display = "none";
                document.querySelector("input[name='depth-choice'][value='5']").checked = true;
            }
        });
    });

    // Ẩn/hiện input 'Số khác' trong đục lỗ
    document.querySelectorAll("input[name='depth-choice']").forEach(radio => {
        radio.addEventListener("change", function () {
            customDepth.style.display = this.value === "custom" ? "block" : "none";
        });
    });

    // Đoạn mã này đọc nội dung của tệp tin mẫu G-code và hiển thị vào textarea
    document.querySelector(".btn-primary").addEventListener("click", function () {
        // Lấy mẫu G-code từ textarea đầu tiên và xử lý chuỗi
        let template = document.querySelectorAll("textarea")[0].value.trim();

        const selectedMode = document.querySelector(".dropdown-toggle span").textContent.trim();

        // Nếu là Đục lỗ thì xử lý theo cách chuẩn hóa đặc biệt
        if (selectedMode === "Đục lỗ") {
            const milsDown = document.querySelector("input[name='depth-choice']:checked").value;
            const milsDownValue = milsDown === "custom"
                ? document.getElementById("customDepthValue").value
                : milsDown;

            if (milsDownValue === "" || isNaN(milsDownValue) || parseFloat(milsDownValue) <= 0) {
                Swal.fire({
                    title: "Vui lòng nhập số Mils cần khoan (số dương)!",
                    icon: "warning",
                });
                return;
            }

            // Chuyển mils xuống thành đơn vị mm
            // Chuyển mils xuống thành đơn vị mm
            let depthMM = (-parseInt(milsDownValue) / 1000).toFixed(3);  // Giữ đúng định dạng -0.600

            // Đọc giá trị spacing 1 lần
            const spacing = document.querySelector("input[name='spacing']:checked").value;

            let lines = template.split("\n");
            let ketQua = "";

            lines.forEach(line => {
                line = line.trim();
                if (line === "") return;

                // Tìm X và Y
                const match = line.match(/X[-+]?[0-9.]+(?:\s*)Y[-+]?[0-9.]+/i);
                if (match) {
                    ketQua += match[0].trim() + "\n";
                    ketQua += `G01 Z${depthMM}\n`;
                    ketQua += `G01 Z0.050\n`;
                    if (spacing === "yes") ketQua += "\n";
                }
            });



            // Hiển thị kết quả
            const ketQuaTextarea = document.querySelector("#ketQua");
            ketQuaTextarea.value = ketQua.trim();
            ketQuaTextarea.style.height = "auto";
            ketQuaTextarea.style.height = ketQuaTextarea.scrollHeight + "px";
            return;
        }

        // Lấy các tùy chọn và số liệu
        let center = document.querySelector("input[name='center']:checked").value;
        let milsXuong = document.querySelectorAll("input[type='number']")[0].value;
        let milsMoiLan = document.querySelectorAll("input[type='number']")[1].value;
        let startEnd = document.querySelector("input[name='start-end']:checked").value;
        let spacing = document.querySelector("input[name='spacing']:checked").value;
        const keepOptions = document.getElementById("keep-options").checked;

        if (template === "") {
            Swal.fire({
                title: "G-code CNC mẫu không được để trống!",
                icon: "warning",
            });
            return;
        }

        // Xóa các chuỗi không cần thiết
        template = template.replace(/ Z0\.1/g, "").replace(/ Z0\./g, "");

        // Tách mẫu thành các dòng
        let lines = template.split("\n");

        if (center === "yes") {
            // Nếu dòng đầu chứa "G00" thì thay bằng "G01"
            if (lines[0].trim().includes("G00")) {
                lines[0] = lines[0].trim().replace(/G00/g, "G01");
            }
            // Nếu dòng đầu và dòng thứ hai giống nhau thì bỏ dòng đầu tiên
            if (lines.length > 1 && lines[0].trim() === lines[1].trim()) {
                lines.shift();
            }
        }

        // Dòng đầu tiên làm phần đầu, các dòng còn lại làm phần sau
        let phanDau = lines[0].trim();
        let phanDuoi = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";

        const startText =
            "N10 G01 Z0.050 F4\n" +
            "N20 G01 Z0.050\n" +
            "M03\n\n\n";

        const endText = "\nG00 X0.000 Y0.000\nM04\nM30";

        // Kiểm tra dữ liệu bắt buộc
        if (milsXuong === "" || milsMoiLan === "") {
            Swal.fire({
                title: "Số Mils cần xuống hoặc số Mils mỗi lần xuống không được để trống!",
                icon: "warning",
            });
            return;
        }
        if (!/^\d+$/.test(milsXuong) || !/^\d+$/.test(milsMoiLan)) {
            Swal.fire({
                title: "Số Mils cần xuống và số Mils mỗi lần xuống phải là số nguyên dương!",
                icon: "warning",
            });
            return;
        }

        let ketQua = (startEnd === "yes") ? startText : "";
        const addSpacing = spacing === "yes";
        let current = parseInt(milsMoiLan);

        // Định nghĩa hàm addBlock tùy theo tùy chọn center
        let addBlock;
        if (center === "yes") {
            let headerModified = phanDau.includes("G00") ? phanDau.replace(/G00/g, "G01") : phanDau;
            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000;
                let block = "G00 X0.000 Y0.000\n" +
                    `G01 Z-${formattedValue.toFixed(3)}\n` +
                    headerModified + "\n";
                if (phanDuoi !== "") {
                    block += phanDuoi + "\n";
                }
                block += "G01 Z0.050\n";
                if (addSpacing) block += "\n";
                return block;
            };
        } else {
            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000;
                let block = phanDau + "\n" +
                    `G01 Z-${formattedValue.toFixed(3)}\n`;
                if (phanDuoi !== "") {
                    block += phanDuoi + "\n";
                }
                block += "G01 Z0.050\n";
                if (addSpacing) block += "\n";
                return block;
            };
        }

        // Tạo các khối G-code cho mỗi bước cắt
        while (current < parseInt(milsXuong)) {
            ketQua += addBlock(current);
            current += parseInt(milsMoiLan);
        }
        // Nếu có dư, sử dụng giá trị milsXuong chính xác cho khối cuối
        if (current >= parseInt(milsXuong)) {
            current = parseInt(milsXuong);
            ketQua += addBlock(current);
        }
        if (startEnd === "yes") {
            ketQua += endText;
        }

        // Hiển thị kết quả vào textarea có id="ketQua" và cập nhật chiều cao tự động
        let ketQuaTextarea = document.querySelector("#ketQua");
        ketQuaTextarea.value = ketQua.trim();
        ketQuaTextarea.style.height = "auto";
        ketQuaTextarea.style.height = ketQuaTextarea.scrollHeight + "px";

        if (!keepOptions) {
            // Reset các radio về mặc định
            document.querySelector("input[name='center'][value='no']").checked = true;
            document.querySelector("input[name='start-end'][value='no']").checked = true;
            document.querySelector("input[name='spacing'][value='no']").checked = true;

            // Đặt lại các ô nhập liệu về mặc định
            document.getElementById("inputCNC").value = "";
            document.querySelectorAll("input[type='number']").forEach(input => input.value = "");
        }

    });

    // Đoạn mã này sẽ lưu nội dung của textarea kết quả vào một tệp tin khi nhấn nút "Lưu file"
    document.querySelector(".btn-success").addEventListener("click", function () {
        let ketQua = document.getElementById("ketQua").value;
        if (ketQua.trim() === "") {
            Swal.fire({
                title: "Không có nội dung để lưu!",
                icon: "warning",
            });
            return;
        }
        // Thay thế tất cả các ký tự xuống dòng (\n) bằng tổ hợp \r\n
        let ketQuaDaSua = ketQua.replace(/\n/g, "\r\n");
        let blob = new Blob([ketQuaDaSua], { type: "text/plain" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "untitled.txt";
        link.click();
    });

    // Đoạn mã này sẽ mở/tắt chế độ chỉnh sửa cho textarea kết quả và thay đổi tên nút
    document.getElementById("edit-button").addEventListener("click", function () {
        let textarea = document.getElementById("ketQua");
        let icon = this.querySelector("i");
        let text = this.querySelector(".btn-text");

        if (textarea.hasAttribute("readonly")) {
            textarea.removeAttribute("readonly");
            textarea.focus();
            icon.className = "fa fa-check";  // Đổi sang icon tick
            text.textContent = "Hoàn tất";
        } else {
            textarea.setAttribute("readonly", true);
            icon.className = "fa fa-pencil-square-o"; // Đổi lại icon cây viết
            text.textContent = "Chỉnh sửa";
        }
    });

    // Đoạn mã này sẽ xóa nội dung trong ô kết quả và đặt lại chiều cao của nó về auto khi nhấn nút "Xoá"
    document.querySelector(".btn-danger").addEventListener("click", function () {
        let ketQuaTextarea = document.getElementById("ketQua");
        ketQuaTextarea.value = ""; // Xoá nội dung trong ô kết quả
        ketQuaTextarea.style.height = "auto"; // Đặt lại chiều cao ban đầu
    });

    // Đoạn mã này sẽ cuộn lên đầu trang khi nhấn nút "Cuộn lên đầu trang"
    document.getElementById("scrollTopBtn").addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Đoạn mã này sẽ sao chép nội dung trong ô kết quả vào clipboard khi nhấn nút "Sao chép"
    document.getElementById("copy-button").addEventListener("click", function () {
        const ketQua = document.getElementById('ketQua').value;
        if (ketQua.trim() === "") {
            Swal.fire({
                title: "Không có nội dung để sao chép!",
                icon: "warning",
            });
            return;
        }
        navigator.clipboard.writeText(ketQua)
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

});
