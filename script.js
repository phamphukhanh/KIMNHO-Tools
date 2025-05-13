document.addEventListener("DOMContentLoaded", function () {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    const tooltipElement = document.querySelector('.small-tooltip');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const dropdownLabel = document.querySelector('.dropdown-toggle span');

    const formCut = document.getElementById("form-cut");
    const formDrill = document.getElementById("form-drill");
    const customCutDepth = document.getElementById("custom-cut-depth");
    const customDrillDepth = document.getElementById("custom-drill-depth");

    // Cập nhật tooltip dựa theo lựa chọn
    function updateTooltipContent(option) {
        let content = '';
        if (option === 'Cắt') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Cắt đường thẳng, đường cong, khắc chữ block.</b><br><br>
                1. Chạy BobCad 1 vòng.<br>
                2. Copy G-code vào, không cần xoá Z0.<br><br>
                <b>Lưu ý: </b>Nhiều vòng khác nhau phải <u>cùng mũi</u>, <u>cùng mil</u>
            </div>`;
        } else if (option === 'Đục lỗ') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Đục lỗ định vị, các lỗ khác</b><br><br>
                1. Chấm các chấm trong BobCad.<br>
                2. Copy G-code vào, không cần xoá Z0.
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
            if (selectedText === "Đục lỗ") {
                formCut.style.display = "none";
                formDrill.style.display = "block";
            } else {
                formCut.style.display = "block";
                formDrill.style.display = "none";
                customDrillDepth.style.display = "none";
                document.querySelector("input[name='drill-depth'][value='5']").checked = true;
            }
            // Đặt lại các ô nhập liệu về mặc định
            document.querySelectorAll("input[type='number']").forEach(input => input.value = "");
            document.querySelector("input[name='start-end'][value='no']").checked = true;
            document.querySelector("input[name='spacing'][value='no']").checked = true;
            document.querySelector("input[name='center'][value='no']").checked = true;
            document.getElementById("customCutDepthValue").value = "";
            document.getElementById("customDrillDepthValue").value = "";
        });
    });

    // Ẩn/hiện input 'Số khác' trong đục lỗ
    document.querySelectorAll("input[name='drill-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            customDrillDepth.style.display = this.value === "custom" ? "block" : "none";
        });
    });

    // Ẩn/hiện input 'Số khác' trong cắt
    document.querySelectorAll("input[name='cut-depth']").forEach(radio => {
        radio.addEventListener("change", function () {
            customCutDepth.style.display = this.value === "custom" ? "block" : "none";
        });
    });

    // Hàm này sẽ xử lý việc gắn số Mil (xuống và lên) vào các khối G-code
    // Nếu milDownValue lớn hơn milEachValue, nó sẽ chia nhỏ các bước cắt thành các khối nhỏ hơn
    function putMilInBlocks(input) {
        const keepOptions = document.getElementById("keep-options").checked;
        const selectedMode = document.querySelector(".dropdown-toggle span").textContent.trim();
        const startEnd = document.querySelector("input[name='start-end']:checked").value;
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        const startText =
            "N10 G01 Z0.050 F4\n" +
            "N20 G01 Z0.050\n" +
            "M03\n\n\n";
        var endText = "\n\n\nG00 X0.000 Y0.000\nM04\nM30";
        let milDown = "";
        let milEach = "";
        let output = startEnd === "yes" ? startText : "";
        let milDownValue = "";
        let milEachValue = ""
        if (selectedMode === "Cắt") {
            input = input.split(/(?=G00)/);
            milDown = document.querySelectorAll("input[type='number']")[0].value;
            milEach = document.querySelector("input[name='cut-depth']:checked").value;
            milEachValue = milEach === "custom" ? document.getElementById("customCutDepthValue").value : milEach;
        } else if (selectedMode === "Đục lỗ") {
            input = input.split("\n");
            milEach = document.querySelector("input[name='drill-depth']:checked").value;
            if (milEach === "custom") {
                milDown = document.querySelectorAll("input[type='number']")[2].value;
                milEachValue = document.getElementById("customDrillDepthValue").value
            } else {
                milDown = milEachValue = document.querySelector("input[name='drill-depth']:checked").value;
            }
        }
        milDownValue = parseInt(milDown);
        milEachValue = parseInt(milEachValue);
        if (milDown === "" || milEachValue === "") {
            Swal.fire({
                title: "Số Mil cần xuống hoặc số Mil mỗi lần xuống không được để trống!",
                icon: "warning",
            });
            return;
        }
        if (milDownValue < milEachValue) {
            Swal.fire({
                title: "Số Mil cần xuống phải lớn hơn số Mil mỗi lần xuống!",
                icon: "warning",
            });
            return;
        }
        if (milDownValue <= 0 || milEachValue <= 0) {
            Swal.fire({
                title: "Số Mil cần xuống và số Mil mỗi lần xuống phải là số dương!",
                icon: "warning",
            });
            return;
        }

        // Cộng dồn các dòng G-code
        for (let i = 0; i < input.length; i++) {
            if (i !== input.length - 1 && spacing === "yes") {
                output += milAddingUp(input[i], milDownValue, milEachValue) + "\n";
            }
            else {
                output += milAddingUp(input[i], milDownValue, milEachValue);
            }
        }

        if (startEnd === "yes") {
            output = output.trim() + endText;
        }

        // Hiển thị kết quả
        const resultTextarea = document.querySelector("#result");
        resultTextarea.value = output.trim();
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";

        if (!keepOptions) {
            // Reset các radio về mặc định
            document.querySelector("input[name='drill-depth'][value='5']").checked = true;
            customDrillDepth.style.display = this.value === "custom" ? "block" : "none";
            document.querySelector("input[name='start-end'][value='no']").checked = true;
            document.querySelector("input[name='spacing'][value='no']").checked = true;

            // Đặt lại các ô nhập liệu về mặc định
            document.getElementById("inputCNC").value = "";
            document.querySelectorAll("input[type='number']").forEach(input => input.value = "");
        }
    }

    // Hàm này sẽ thêm các khối G-code vào đầu vào dựa trên giá trị milDownValue và milEachValue
    // Nếu milDownValue lớn hơn milEachValue, nó sẽ chia nhỏ các bước cắt thành các khối nhỏ hơn
    function milAddingUp(input, milDownValue, milEachValue) {
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        const center = document.querySelector("input[name='center']:checked").value;
        input = input.split("\n");
        if (!input[0].includes("G00")) {
            input[0] = "G00 " + input[0];
        }
        let result = "";
        // Dòng đầu tiên làm phần đầu, các dòng còn lại làm phần sau
        let head = input[0].trim();
        let rest = input.length > 1 ? input.slice(1).join("\n").trim() : "";
        let addBlock;

        // Nếu đi từ giữa thì thêm G00 X0 Y0 vào đầu dòng đầu tiên
        if (center === "yes") {
            let headerModified = head.includes("G00") ? head.replace(/G00/g, "G01") : head;
            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000;
                let block = "G00 X0.000 Y0.000\n" +
                    `G01 Z-${formattedValue.toFixed(3)}\n` +
                    headerModified + "\n";
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
                let block = head + "\n" +
                    `G01 Z-${formattedValue.toFixed(3)}\n`;
                if (rest !== "") {
                    block += rest + "\n";
                }
                block += "G01 Z0.050\n";
                if (spacing === "yes") block += "\n";
                return block;
            };
        }
        // Chia nhỏ từng bước nếu Mil xuống lớn hơn Mil mỗi lần xuống
        const maxStep = milEachValue;
        let total = milDownValue;
        let current = maxStep;

        // Tạo các khối G-code cho mỗi bước cắt
        while (current < total) {
            result += addBlock(current);
            current += parseInt(milEachValue);
        }
        // Nếu có dư, sử dụng giá trị milDown chính xác cho khối cuối
        if (current >= total) {
            current = total;
            result += addBlock(current);
        }
        return result;
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
                title: "G-code CNC mẫu không được để trống!",
                icon: "warning",
            });
            return;
        }
        // Xóa các chuỗi không cần thiết
        input = input
            .trim()
            .replaceAll(/\r?\n\s*\r?\n/g, "\n")
            .replaceAll(" Z0.", "")
            .replaceAll(" Z0.1", "")
            .replaceAll("G81 ", "")
            .replaceAll(" R1. F1.", "");


        putMilInBlocks(input);
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
        let textarea = document.getElementById("result");
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
        let resultTextarea = document.getElementById("result");
        resultTextarea.value = ""; // Xoá nội dung trong ô kết quả
        resultTextarea.style.height = "auto"; // Đặt lại chiều cao ban đầu
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

});