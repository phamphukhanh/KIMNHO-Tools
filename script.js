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
                <b>Cắt đường thẳng, đường cong.</b><br><br>
                1. Chạy BobCad 1 vòng.<br>
                2. Copy G-code vào, không cần xoá Z0.
            </div>`;
        } else if (option === 'Đục lỗ') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Đục lỗ định vị</b><br><br>
                1. Chấm các chấm trong BobCad.<br>
                2. Copy G-code vào, không cần xoá Z0..
            </div>`;
        } else if (option === 'Khắc chữ') {
            content = `
            <div style='text-align: justify; max-width: 250px;'>
                <b>Khắc chữ block.</b><br><br>
                1. Chạy các chữ trong BobCad.<br>
                2. Copy G-code vào, không cần xoá Z0..
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
                customDrillDepth.style.display = "none";
                document.querySelector("input[name='drill-depth'][value='5']").checked = true;
            }
            // Đặt lại các ô nhập liệu về mặc định
            document.querySelectorAll("input[type='number']").forEach(input => input.value = "");
            document.querySelector("input[name='start-end'][value='no']").checked = true;
            document.querySelector("input[name='spacing'][value='no']").checked = true;
            document.querySelector("input[name='center'][value='no']").checked = true;
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

    function putMilsInBlocks(input) {
        const selectedMode = document.querySelector(".dropdown-toggle span").textContent.trim();
        let milsDown = "";
        let milsEach = "";
        let output = "";
        if (selectedMode === "Cắt" || selectedMode === "Khắc chữ") {
            milsDown = document.querySelectorAll("input[type='number']")[0].value;
            milsEach = document.querySelector("input[name='cut-depth']:checked").value;
        } else if (selectedMode === "Đục lỗ") {
            
        }
        let milsEachValue = milsEach === "custom" ? document.getElementById("customCutDepthValue").value : milsEach;
        milsEachValue = parseInt(milsEachValue);
        let milsDownValue = parseInt(milsDown);
        if (milsDown === "" || milsEachValue === "") {
            Swal.fire({
                title: "Số Mils cần xuống hoặc số Mils mỗi lần xuống không được để trống!",
                icon: "warning",
            });
            return;
        }
        if (milsDownValue < milsEachValue) {
            Swal.fire({
                title: "Số Mils cần xuống phải lớn hơn số Mils mỗi lần xuống!",
                icon: "warning",
            });
            return;
        }
        if (milsDownValue <= 0 || milsEachValue <= 0) {
            Swal.fire({
                title: "Số Mils cần xuống và số Mils mỗi lần xuống phải là số dương!",
                icon: "warning",
            });
            return;
        }
        if (milsDownValue > milsEachValue) {

            input.forEach(line => {
                output += milsAddingUp(line, milsDownValue, milsEachValue);
            });
        }
    }

    function milsAddingUp(input, milsDownValue, milsEachValue) {
        // Chia nhỏ từng bước nếu Mils xuống > Mils mỗi lần xuống
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        input = input.split("\n");
        if (!input[0].includes("G00")) {
            input[0] = "G00 " + input[0];
        }
        // console.log(input);
        let result = "";

        const maxStep = milsEachValue;
        let total = milsDownValue;
        let current = maxStep;


        while (current < total) {
            let partialDepth = (-current / 1000).toFixed(3);
            result += input[0].trim() + "\n";
            result += `G01 Z${partialDepth}\n`;
            for (let i = 1; i < input.length; i++) {
                if (!(i == input.length - 1)) {
                    result += input[i].trim() + "\n";
                }
            }
            result += `G01 Z0.050\n`;
            if (spacing === "yes") result += "\n";
            current += maxStep;
        }

        // Bước cuối (nếu còn dư hoặc bằng)
        if (current >= total) {
            let finalDepth = (-total / 1000).toFixed(3);
            result += "G00 " + input[0].trim() + "\n";
            result += `G01 Z${finalDepth}\n`;
            for (let i = 1; i < input.length; i++) {
                if (!(i == input.length - 1)) {
                    result += input[i].trim() + "\n";
                }
            }
            result += `G01 Z0.050\n`;
        }
        if (spacing === "yes") result += "\n\n";
        return result;
    }

    // Đoạn mã này sẽ xử lý việc cắt trong G-code
    function cut(input) {
        if (input === "") {
            Swal.fire({
                title: "G-code CNC mẫu không được để trống!",
                icon: "warning",
            });
            return;
        }
        const keepOptions = document.getElementById("keep-options").checked;
        const center = document.querySelector("input[name='center']:checked").value;
        const milsDown = document.querySelectorAll("input[type='number']")[0].value;
        const milsEach = document.querySelectorAll("input[type='number']")[1].value;
        const startEnd = document.querySelector("input[name='start-end']:checked").value;
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        const startText =
            "N10 G01 Z0.050 F4\n" +
            "N20 G01 Z0.050\n" +
            "M03\n\n\n";
        const endText = "\nG00 X0.000 Y0.000\nM04\nM30";

        // Tách mẫu thành các dòng
        let lines = input.split("\n");
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
        let head = lines[0].trim();
        let rest = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";

        // Kiểm tra dữ liệu bắt buộc
        if (milsDown === "" || milsEach === "") {
            Swal.fire({
                title: "Số Mils cần xuống hoặc số Mils mỗi lần xuống không được để trống!",
                icon: "warning",
            });
            return;
        }
        if (!/^\d+$/.test(milsDown) || !/^\d+$/.test(milsEach)) {
            Swal.fire({
                title: "Số Mils cần xuống và số Mils mỗi lần xuống phải là số nguyên dương!",
                icon: "warning",
            });
            return;
        }
        if (parseInt(milsDown) < parseInt(milsEach)) {
            Swal.fire({
                title: "Số Mils cần xuống phải lớn hơn số Mils mỗi lần xuống!",
                icon: "warning",
            });
            return;
        }
        if (parseInt(milsDown) <= 0 || parseInt(milsEach) <= 0) {
            Swal.fire({
                title: "Số Mils cần xuống và số Mils mỗi lần xuống phải là số dương!",
                icon: "warning",
            });
            return;
        }
        let result = (startEnd === "yes") ? startText : "";
        const addSpacing = spacing === "yes";
        let current = parseInt(milsEach);

        // Định nghĩa hàm addBlock tùy theo tùy chọn center
        let addBlock;
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
                if (addSpacing) block += "\n";
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
                if (addSpacing) block += "\n";
                return block;
            };
        }

        // Tạo các khối G-code cho mỗi bước cắt
        while (current < parseInt(milsDown)) {
            result += addBlock(current);
            current += parseInt(milsEach);
        }
        // Nếu có dư, sử dụng giá trị milsDown chính xác cho khối cuối
        if (current >= parseInt(milsDown)) {
            current = parseInt(milsDown);
            result += addBlock(current);
        }
        if (spacing === "no") result += "\n";
        if (startEnd === "yes") {
            result += endText;
        }

        // Hiển thị kết quả vào textarea có id="result" và cập nhật chiều cao tự động
        let resultTextarea = document.querySelector("#result");
        resultTextarea.value = result.trim();
        resultTextarea.style.height = "auto";
        resultTextarea.style.height = resultTextarea.scrollHeight + "px";

        if (!keepOptions) {
            // Reset các radio về mặc định
            document.querySelector("input[name='center'][value='no']").checked = true;
            document.querySelector("input[name='start-end'][value='no']").checked = true;
            document.querySelector("input[name='spacing'][value='no']").checked = true;

            // Đặt lại các ô nhập liệu về mặc định
            document.getElementById("inputCNC").value = "";
            document.querySelectorAll("input[type='number']").forEach(input => input.value = "");
        }
        return;
    }
    // Đoạn mã này sẽ xử lý việc khoan lỗ trong G-code
    function drill(input) {
        if (input === "") {
            Swal.fire({
                title: "G-code CNC mẫu không được để trống!",
                icon: "warning",
            });
            return;
        }
        const keepOptions = document.getElementById("keep-options").checked;
        const milsDown = document.querySelector("input[name='drill-depth']:checked").value;
        const startEnd = document.querySelector("input[name='start-end']:checked").value;
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        const milsDownValue = milsDown === "custom" ? document.getElementById("customDrillDepthValue").value : milsDown;
        const startText =
            "N10 G01 Z0.050 F4\n" +
            "N20 G01 Z0.050\n" +
            "M03\n\n\n";

        const endText = "\nG00 X0.000 Y0.000\nM04\nM30";

        let lines = input.split("\n");
        if (milsDownValue === "" || isNaN(milsDownValue) || parseFloat(milsDownValue) <= 0) {
            Swal.fire({
                title: "Vui lòng nhập số Mils cần khoan (số dương)!",
                icon: "warning",
            });
            return;
        }

        let result = (startEnd === "yes") ? startText : "";

        lines.forEach(line => {
            line = line.trim();
            if (line === "") return;

            // Tìm X và Y
            const match = line.match(/X[-+]?[0-9.]+(?:\s*)Y[-+]?[0-9.]+/i);
            if (match) {
                // Chia nhỏ từng bước nếu milsDownValue > 20
                const maxStep = 20;
                let total = parseInt(milsDownValue);
                let current = maxStep;

                while (current < total) {
                    let partialDepth = (-current / 1000).toFixed(3);
                    result += "G00 " + match[0].trim() + "\n";
                    result += `G01 Z${partialDepth}\n`;
                    result += `G01 Z0.050\n`;
                    if (spacing === "yes") result += "\n";
                    current += maxStep;
                }

                // Bước cuối (nếu còn dư hoặc bằng)
                let finalDepth = (-total / 1000).toFixed(3);
                result += "G00 " + match[0].trim() + "\n";
                result += `G01 Z${finalDepth}\n`;
                result += `G01 Z0.050\n`;
                if (spacing === "yes") result += "\n";
            }

        });
        if (spacing === "no") result += "\n";
        if (startEnd === "yes") {
            result += endText;
        }
        // Hiển thị kết quả
        const resultTextarea = document.querySelector("#result");
        resultTextarea.value = result.trim();
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
        return;
    }
    // Đoạn mã này sẽ xử lý việc khoan lỗ trong G-code
    function text(input) {
        if (input === "") {
            Swal.fire({
                title: "G-code CNC mẫu không được để trống!",
                icon: "warning",
            });
            return;
        }
        const keepOptions = document.getElementById("keep-options").checked;
        const milsDown = document.querySelector("input[name='drill-depth']:checked").value;
        const startEnd = document.querySelector("input[name='start-end']:checked").value;
        const spacing = document.querySelector("input[name='spacing']:checked").value;
        const milsDownValue = milsDown === "custom" ? document.getElementById("customDrillDepthValue").value : milsDown;
        const startText =
            "N10 G01 Z0.050 F4\n" +
            "N20 G01 Z0.050\n" +
            "M03\n\n\n";
        const endText = "\nG00 X0.000 Y0.000\nM04\nM30";

        // Xử lý các dòng trong G-code
        // Xóa các chuỗi không cần thiết và tách thành các khối
        let characters = input.replace(/ Z0\.1/g, "").replace(/ Z0\./g, "").split(/(?=G00)/);
        if (milsDownValue === "" || isNaN(milsDownValue) || parseFloat(milsDownValue) <= 0) {
            Swal.fire({
                title: "Vui lòng nhập số Mils cần khoan (số dương)!",
                icon: "warning",
            });
            return;
        }

        // Chuyển mils xuống thành đơn vị mm
        let depthMM = (-parseInt(milsDownValue) / 1000).toFixed(3);
        let result = (startEnd === "yes") ? startText : "";

        characters.forEach(block => {
            block = block.trim();

            // Sau dòng đâu tiên mỗi khối, thêm G01 Z-0.x, x là độ sâu, mặc định là 0.005
            const lines = block.split("\n");
            result += lines[0].trim() + "\n";
            result += `G01 Z${depthMM}\n`;
            // Xử lý các dòng còn lại
            for (let i = 1; i < lines.length; i++) {
                result += lines[i].trim() + "\n";
            }
            result += `G01 Z0.050\n`;
            if (spacing === "yes") result += "\n";
        });

        if (spacing === "no") result += "\n";
        if (startEnd === "yes") {
            result += endText;
        }
        // Hiển thị kết quả
        const resultTextarea = document.querySelector("#result");
        resultTextarea.value = result.trim();
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

    // Đoạn mã này đọc nội dung của tệp tin mẫu G-code và hiển thị vào textarea
    document.querySelector(".btn-primary").addEventListener("click", function () {
        // Lấy mẫu G-code từ textarea đầu tiên và xử lý chuỗi
        let input = document.querySelectorAll("textarea")[0].value.trim();
        if (input.includes("G01 Z-") || input.includes("G01 Z0.050") || input.includes("G00 X0.000 Y0.000")) {
            Swal.fire({
                title: "Chưa xóa G-code cũ!",
                text: "Vui lòng xóa G-code cũ trước khi nhập G-code mới.",
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
            .replaceAll(" Z0.", "")
            .replaceAll(" Z01.", "")
            .replaceAll("G81 ", "")
            .replaceAll(" R1. F1.", "");
        // .replace(/[\r\n]+/gm, " ");

        // Lấy chế độ đã chọn từ dropdown
        const selectedMode = document.querySelector(".dropdown-toggle span").textContent.trim();
        switch (selectedMode) {
            case "Cắt":
                input = input.split(/(?=G00)/);
                putMilsInBlocks(input);
                // cut(input);
                break;
            case "Đục lỗ":
                input = input.split("\n");
                // drill(input);
                break;
            case "Khắc chữ":
                input = input.split(/(?=G00)/);
                // text(input);
                break;
        }
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
