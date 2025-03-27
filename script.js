document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".btn-primary").addEventListener("click", function () {
        let phanDau = document.querySelectorAll("textarea")[0].value;
        let phanDuoi = document.querySelectorAll("textarea")[1].value;
        
        let center = document.querySelector("input[name='center']:checked").value;
        
        let milsXuong = document.querySelectorAll("input[type='number']")[0].value;
        let milsMoiLan = document.querySelectorAll("input[type='number']")[1].value;
        
        let start = document.querySelector("input[name='start']:checked").value;
        let end = document.querySelector("input[name='end']:checked").value;

        const startText =
            "N10 G01 Z0.050 F4\n" +
            "N20 G01 Z0.050\n" +
            "M03\n" +
            "\n\n";
        const endText =
            "\n" +
            "G00 X0.000 Y0.000\n" +
            "M04\n" +
            "M30";
        // Kiểm tra xem center có được chọn không
        if (center === "yes") {
            // Thêm G00 X0.000 Y0.000 vào phanDau nếu center được chọn
            phanDau = "G00 X0.000 Y0.000\n" + phanDau;
        }
        
        if (Number.isInteger(parseInt(milsXuong)) === false || Number.isInteger(parseInt(milsMoiLan)) === false) {
            alert("Vui lòng nhập số Mils cần xuống và số Mils mỗi lần xuống.");
            return;
        }

        if (milsXuong < 0 || milsMoiLan < 0) {
            alert("Vui lòng nhập số Mils cần xuống và số Mils mỗi lần xuống.");
            return;
        }

        let current = parseInt(milsMoiLan);
        let ketQua = "";
        if (start === "yes") {
            ketQua += startText;
        }
        while (current <= parseInt(milsXuong)) {
            let formattedValue = current / 1000; // Chia cho 1000 để có dạng 0.140 thay vì 0.0140
            ketQua = ketQua + phanDau + "\n";
            ketQua = ketQua + `G01 Z-${formattedValue.toFixed(3)}\n`; // Giữ 3 số thập phân
            ketQua = ketQua + phanDuoi + "\n";
            ketQua = ketQua + "G01 Z0.050\n\n";
            current += parseInt(milsMoiLan);
        }
        
        if (end === "yes") {
            ketQua += endText;
        }
        
        console.log(ketQua);
        
        // Đặt giá trị vào ô kết quả
        document.querySelectorAll("textarea")[2].value = ketQua.trim();
    });
});

document.querySelector(".btn-success").addEventListener("click", function () {
    let ketQua = document.querySelectorAll("textarea")[2].value;

    let blob = new Blob([ketQua], { type: "text/plain" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "untitled.txt";
    link.click();
});

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

document.querySelector(".btn-danger").addEventListener("click", function () {
    document.getElementById("ketQua").value = ""; // Xoá nội dung trong ô kết quả
});