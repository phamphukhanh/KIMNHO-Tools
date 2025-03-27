document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".btn-primary").addEventListener("click", function () {
        let phanDau = document.querySelectorAll("textarea")[0].value.trim();
        let phanDuoi = document.querySelectorAll("textarea")[1].value.trim();

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

        // Kiểm tra phần đầu và phần đuôi có dữ liệu không
        if (phanDau === "" || phanDuoi === "") {
            alert("Phần đầu hoặc phần đuôi không được để trống.");
            return;
        }
        // Kiểm tra xem số Mils cần xuống và số Mils mỗi lần xuống có dữ liệu không
        if (milsXuong === "" || milsMoiLan === "") {
            alert("Số Mils cần xuống hoặc số Mils mỗi lần xuống không được để trống.");
            return;
        }
        // Kiểm tra xem số Mils cần xuống và số Mils mỗi lần xuống có phải là số nguyên duong không
        if (!/^\d+$/.test(milsXuong) || !/^\d+$/.test(milsMoiLan)) {
            alert("Số Mils cần xuống và số Mils mỗi lần xuống phải là số nguyên dương.");
            return;
        }

        let current = parseInt(milsMoiLan);
        let ketQua = "";
        if (start === "yes") {
            ketQua += startText;
        }
        while (current <= parseInt(milsXuong)) {
            let formattedValue = current / 1000; // Chia cho 1000 để có dạng 0.140 thay vì 0.0140
            if (center === "yes") {
                // Nếu tốc độ quay dòng đầu là G00 thì sửa lại tốc độ quay thành G01
                if (phanDau.includes("G00")) {
                    phanDau = phanDau.replace(/G00/g, "G01");
                }

                // Thêm G00 X0.000 Y0.000 vào phanDau nếu center được chọn
                ketQua +=
                    "G00 X0.000 Y0.000\n" +
                    `G01 Z-${formattedValue.toFixed(3)}\n`
                    + phanDau + "\n"; // Giữ 3 số thập phân
            } else {
                ketQua = ketQua + phanDau + "\n";
                ketQua = ketQua + `G01 Z-${formattedValue.toFixed(3)}\n`; // Giữ 3 số thập phân
            }
            ketQua = ketQua + phanDuoi + "\n";
            ketQua = ketQua + "G01 Z0.050\n\n";
            current += parseInt(milsMoiLan);
        }

        if (end === "yes") {
            ketQua += endText;
        }


        let ketQuaTextarea = document.querySelector("#ketQua");
        ketQuaTextarea.value = ketQua.trim();

        // 🔥 **Cập nhật chiều cao tự động**
        ketQuaTextarea.style.height = "auto";
        ketQuaTextarea.style.height = ketQuaTextarea.scrollHeight + "px";
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
    let ketQuaTextarea = document.getElementById("ketQua");
    ketQuaTextarea.value = ""; // Xoá nội dung trong ô kết quả
    ketQuaTextarea.style.height = "auto"; // Đặt lại chiều cao ban đầu
});
