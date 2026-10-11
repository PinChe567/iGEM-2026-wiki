# Build evidence

The current records are firmware_compile_measured.log, filesystem_build_measured.log and ../evidence/software_validation_summary.json. They record successful PlatformIO compilation and buildfs for the five current UI files. Earlier direct-pack logs are historical evidence only. The package does not include a flashed-board claim or verified physical ADC timing.

目前證據為 firmware_compile_measured.log、filesystem_build_measured.log 與 ../evidence/software_validation_summary.json；記錄目前五個 UI 檔案的 PlatformIO 編譯與 buildfs 成功。較早的直接封裝紀錄只供歷史追溯，不當作現行編譯方法。沒有宣稱實板已燒錄或 ADC 時序已量測。

Rebuild with private credentials before hardware use. Keep BOARD_VALIDATED=false until documented electrical checks justify LED operation. Do not publish private configuration. Follow the operation manual for J3 UART, manual BOOT/EN and both upload tasks.
