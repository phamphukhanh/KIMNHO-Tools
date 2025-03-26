document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".btn-primary").addEventListener("click", function () {
        let phanDau = document.querySelectorAll("textarea")[0].value;
        let phanDuoi = document.querySelectorAll("textarea")[1].value;
        let center = document.querySelector("input[name='center']:checked").value;
        let milsXuong = document.querySelectorAll("input[type='number']")[0].value;
        let milsMoiLan = document.querySelectorAll("input[type='number']")[1].value;
        let start = document.querySelector("input[name='start']:checked").value;
        let end = document.querySelector("input[name='end']:checked").value;

        let ketQua = "";
        ketQua += "Phần đầu: " + phanDau.trim() + "\n";
        ketQua += "Phần đuôi: " + phanDuoi.trim() + "\n";
        ketQua += "Từ tâm đi ra: " + center + "\n";
        ketQua += "Số Mils cần xuống: " + milsXuong.trim() + "\n";
        ketQua += "Số Mils mỗi lần xuống: " + milsMoiLan.trim() + "\n";
        ketQua += "Thêm Program Start: " + start + "\n";
        ketQua += "Thêm Program End: " + end;


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