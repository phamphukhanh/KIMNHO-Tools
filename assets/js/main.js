// XỬ LÝ CLICK THANH GẠT (SEGMENTED CONTROL)
    const segmentBtns = document.querySelectorAll('.segment-btn');

    segmentBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            // 1. Quản lý hiệu ứng nút active trên giao diện
            segmentBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            // 2. LƯU VÀO BIẾN TOÀN CỤC (gcode-processor.js đọc trực tiếp biến này)
            const selectedText = this.getAttribute("data-action") || this.textContent.trim();
            window.selectedMode = selectedText;

            // 3. Đổi Form tương ứng và cập nhật Tooltip
            if (selectedText === "Đục lỗ") {
                if (formCut) formCut.style.display = "none";
                if (formRingAngle) formRingAngle.style.display = "none";
                if (formDrill) formDrill.style.display = "block";
                updateTooltipContent("Đục lỗ");
            } else if (selectedText === "Chạy độ ring") {
                if (formCut) formCut.style.display = "none";
                if (formDrill) formDrill.style.display = "none";
                if (formRingAngle) formRingAngle.style.display = "block";
                updateTooltipContent("Chạy độ ring");
            } else {
                if (formCut) formCut.style.display = "block";
                if (formDrill) formDrill.style.display = "none";
                if (formRingAngle) formRingAngle.style.display = "none";
                updateTooltipContent("Cắt");
            }

            // 4. Kiểm tra trực tiếp checkbox "Giữ lựa chọn"
            const keepOptions = document.getElementById("keep-options");
            if (!keepOptions || !keepOptions.checked) {
                resetValues();
            }

            resetEditMode();
        });
    });
