document.addEventListener("DOMContentLoaded", function () {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    // Đoạn mã này sẽ lấy nội dung từ textarea đầu tiên và xử lý nó khi nhấn nút "Xem kết quả"
    // document.querySelector(".btn-primary").addEventListener("click", function () {
    //     // Lấy mẫu G-code từ textarea duy nhất và xử lý chuỗi
    //     let template = document.querySelectorAll("textarea")[0].value.trim();
    //     if (template === "") {
    //         alert("G-code CNC không được để trống.");
    //         return;
    //     }

    //     // Xóa các ký tự không cần thiết (Z0., Z0.1)
    //     template = template.replace(/ Z0\.1/g, "").replace(/ Z0\./g, "");


    //     // Tách mẫu thành các dòng
    //     let lines = template.split("\n");

    //     // Nếu dòng đầu có G00 thì thay bằng G01
    //     if (lines[0].trim().includes("G00")) {
    //         lines[0] = lines[0].trim().replace(/G00/g, "G01");
    //     }

    //     // Nếu dòng đầu và dòng thứ hai giống nhau thì bỏ dòng đầu tiên
    //     if (lines[0].trim() === lines[1].trim()) {
    //         lines.shift(); // Bỏ dòng đầu tiên nếu nó giống dòng thứ hai
    //     }

    //     // Tách dòng đầu tiên làm phanDau và các dòng còn lại làm phanDuoi
    //     let phanDau = lines[0].trim();
    //     let phanDuoi = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";

    //     // Lấy các tùy chọn và số liệu
    //     let center = document.querySelector("input[name='center']:checked").value;
    //     let milsXuong = document.querySelectorAll("input[type='number']")[0].value;
    //     let milsMoiLan = document.querySelectorAll("input[type='number']")[1].value;
    //     let start = document.querySelector("input[name='start']:checked").value;
    //     let end = document.querySelector("input[name='end']:checked").value;

    //     const startText =
    //         "N10 G01 Z0.050 F4\n" +
    //         "N20 G01 Z0.050\n" +
    //         "M03\n\n\n";
    //     const endText = "\nG00 X0.000 Y0.000\nM04\nM30";

    //     // Kiểm tra dữ liệu bắt buộc
    //     if (milsXuong === "" || milsMoiLan === "") {
    //         alert("Số Mils cần xuống hoặc số Mils mỗi lần xuống không được để trống.");
    //         return;
    //     }
    //     if (!/^\d+$/.test(milsXuong) || !/^\d+$/.test(milsMoiLan)) {
    //         alert("Số Mils cần xuống và số Mils mỗi lần xuống phải là số nguyên dương.");
    //         return;
    //     }

    //     // Xây dựng chuỗi kết quả
    //     let ketQua = (start === "yes") ? startText : "";
    //     let current = parseInt(milsMoiLan);

    //     // Hàm tạo một khối G-code cho một giá trị current nhất định
    //     function addBlock(currentVal) {
    //         let formattedValue = currentVal / 1000; // vd: 140 -> 0.140
    //         let block = "";
    //         if (center === "yes") {
    //             // Nếu center được chọn: thay G00 bằng G01 nếu có, thêm lệnh định vị
    //             let header = phanDau.includes("G00") ? phanDau.replace(/G00/g, "G01") : phanDau;
    //             block += "G00 X0.000 Y0.000\n" + `G01 Z-${formattedValue.toFixed(3)}\n` + header + "\n";
    //         } else {
    //             block += phanDau + "\n" + `G01 Z-${formattedValue.toFixed(3)}\n`;
    //         }
    //         // Thêm phần sau (nếu có) và lệnh khôi phục Z
    //         if (phanDuoi !== "") {
    //             block += phanDuoi + "\n";
    //         }
    //         block += "G01 Z0.050\n\n";
    //         return block;
    //     }

    //     // Tạo các khối G-code cho mỗi bước cắt
    //     while (current < parseInt(milsXuong)) {
    //         ketQua += addBlock(current);
    //         current += parseInt(milsMoiLan);
    //     }
    //     // Nếu có dư, sử dụng giá trị milsXuong chính xác cho khối cuối
    //     if (current >= parseInt(milsXuong)) {
    //         current = parseInt(milsXuong);
    //         ketQua += addBlock(current);
    //     }
    //     if (end === "yes") {
    //         ketQua += endText;
    //     }

    //     // Hiển thị kết quả vào textarea có id="ketQua" và cập nhật chiều cao tự động
    //     let ketQuaTextarea = document.querySelector("#ketQua");
    //     ketQuaTextarea.value = ketQua.trim();
    //     ketQuaTextarea.style.height = "auto";
    //     ketQuaTextarea.style.height = ketQuaTextarea.scrollHeight + "px";
    // });

    document.querySelector(".btn-primary").addEventListener("click", function () {
        // Lấy mẫu G-code từ textarea đầu tiên và xử lý chuỗi
        let template = document.querySelectorAll("textarea")[0].value.trim();
        // Lấy các tùy chọn và số liệu
        let center = document.querySelector("input[name='center']:checked").value;
        let milsXuong = document.querySelectorAll("input[type='number']")[0].value;
        let milsMoiLan = document.querySelectorAll("input[type='number']")[1].value;
        let start = document.querySelector("input[name='start']:checked").value;
        let end = document.querySelector("input[name='end']:checked").value;

        if (template === "") {
            alert("G-code CNC không được để trống.");
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
            alert("Số Mils cần xuống hoặc số Mils mỗi lần xuống không được để trống.");
            return;
        }
        if (!/^\d+$/.test(milsXuong) || !/^\d+$/.test(milsMoiLan)) {
            alert("Số Mils cần xuống và số Mils mỗi lần xuống phải là số nguyên dương.");
            return;
        }

        let ketQua = (start === "yes") ? startText : "";
        let current = parseInt(milsMoiLan);

        // Định nghĩa hàm addBlock tùy theo tùy chọn center
        let addBlock;
        if (center === "yes") {
            // Nếu center được chọn, chuyển đổi phanDau một lần duy nhất (nếu chứa "G00")
            let headerModified = phanDau.includes("G00") ? phanDau.replace(/G00/g, "G01") : phanDau;
            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000; // vd: 140 -> 0.140
                let block = "G00 X0.000 Y0.000\n" + `G01 Z-${formattedValue.toFixed(3)}\n` + headerModified + "\n";
                if (phanDuoi !== "") {
                    block += phanDuoi + "\n";
                }
                block += "G01 Z0.050\n\n";
                return block;
            };
        } else {
            addBlock = function (currentVal) {
                let formattedValue = currentVal / 1000;
                let block = phanDau + "\n" + `G01 Z-${formattedValue.toFixed(3)}\n`;
                if (phanDuoi !== "") {
                    block += phanDuoi + "\n";
                }
                block += "G01 Z0.050\n\n";
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
        if (end === "yes") {
            ketQua += endText;
        }

        // Hiển thị kết quả vào textarea có id="ketQua" và cập nhật chiều cao tự động
        let ketQuaTextarea = document.querySelector("#ketQua");
        ketQuaTextarea.value = ketQua.trim();
        ketQuaTextarea.style.height = "auto";
        ketQuaTextarea.style.height = ketQuaTextarea.scrollHeight + "px";
    });


    // Đoạn mã này sẽ lưu nội dung của textarea kết quả vào một tệp tin khi nhấn nút "Lưu file"
    document.querySelector(".btn-success").addEventListener("click", function () {
        // let ketQua = document.querySelectorAll("textarea")[1].value;
        let ketQua = document.getElementById("ketQua").value;
        let blob = new Blob([ketQua], { type: "text/plain" });
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "untitled.txt";
        link.click();
    });

    // Đoạn mã này sẽ mở/tắt chế độ chỉnh sửa cho textarea kết quả và thay đổi tên nút
    document.querySelector(".btn-outline-secondary").addEventListener("click", function () {
        let textarea = document.getElementById("ketQua");
        if (textarea.hasAttribute("readonly")) {
            textarea.removeAttribute("readonly"); // Bật chỉnh sửa
            textarea.focus(); // Đặt con trỏ vào ô
            this.textContent = "Hoàn tất"; // Đổi tên nút
        } else {
            textarea.setAttribute("readonly", true); // Khóa lại
            this.textContent = "Chỉnh sửa"; // Đổi lại tên nút
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
});