import schedules from "./schedules.js";

const times = [];
for (let hour = 10; hour <= 19; hour++) {
  for (let minute = 0; minute < 60; minute += 15) {
    if (hour === 19 && minute > 0) break; // 19:00で終了
    times.push(
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`
    );
  }
}
const booths = Array.from({ length: 15 }, (_, i) => `ブース${i + 1}`);

function createTable() {
  const table = document.getElementById("timeBoothTable");

  // ヘッダー行を作成
  const headerRow = table.insertRow();
  headerRow.insertCell().textContent = "時間\\ブース";
  booths.forEach((booth) => {
    headerRow.insertCell().textContent = booth;
  });

  // データ行を作成し、データを埋める
  const cellData = Array.from({ length: times.length }, () =>
    Array(booths.length).fill(null)
  );
  const usedCells = new Set();

  schedules.forEach((item) => {
    const rowIndex = times.indexOf(item.time);
    const colIndex = item.booth - 1;
    const cellKey = `${rowIndex},${colIndex}`;

    if (!usedCells.has(cellKey)) {
      cellData[rowIndex][colIndex] = {
        text: item.value,
        rowspan: 1,
        colspan: 1,
      };
      usedCells.add(cellKey);

      // 縦方向の結合をチェック
      let rowspan = 1;
      for (let i = rowIndex + 1; i < times.length; i++) {
        if (
          schedules.some(
            (d) =>
              d.time === times[i] &&
              d.booth === item.booth &&
              d.value === item.value
          )
        ) {
          const existingCellKey = `${i},${colIndex}`;
          if (usedCells.has(existingCellKey)) {
            usedCells.delete(existingCellKey);
          }
          rowspan++;
          usedCells.add(existingCellKey);
        } else {
          break;
        }
      }
      if (rowspan > 1) {
        cellData[rowIndex][colIndex].rowspan = rowspan;
        for (let i = 1; i < rowspan; i++) {
          cellData[rowIndex + i][colIndex] = undefined;
        }
      }

      // 横方向の結合をチェック
      if (item.horizontal) {
        let colspan = booths.length;
        for (let j = 0; j < booths.length; j++) {
          const existingCellKey = `${rowIndex},${j}`;
          if (usedCells.has(existingCellKey)) {
            usedCells.delete(existingCellKey);
          }
          if (j !== colIndex) {
            cellData[rowIndex][j] = undefined;
          }
          usedCells.add(existingCellKey);
        }

        // 縦方向の結合も考慮
        let additionalRowSpan = 1;
        for (let i = rowIndex + 1; i < times.length; i++) {
          if (
            schedules.some(
              (d) =>
                d.time === times[i] && d.value === item.value && d.horizontal
            )
          ) {
            additionalRowSpan++;
            for (let j = 0; j < booths.length; j++) {
              const existingCellKey = `${i},${j}`;
              if (usedCells.has(existingCellKey)) {
                usedCells.delete(existingCellKey);
              }
              usedCells.add(existingCellKey);
              if (j !== colIndex) {
                cellData[i][j] = undefined;
              }
            }
          } else {
            break;
          }
        }

        cellData[rowIndex][colIndex].colspan = colspan;
        cellData[rowIndex][colIndex].rowspan = additionalRowSpan;
      }
    }
  });

  // テーブルにデータを埋め込む
  for (let i = 0; i < times.length; i++) {
    const row = table.insertRow();
    const timeCell = row.insertCell();
    timeCell.textContent = times[i];

    for (let j = 0; j < booths.length; j++) {
      const cellDataItem = cellData[i][j];
      if (cellDataItem !== undefined) {
        const cell = row.insertCell();
        if (cellDataItem) {
          cell.textContent = cellDataItem.text;
          if (cellDataItem.rowspan > 1) {
            cell.rowSpan = cellDataItem.rowspan;
          }
          if (cellDataItem.colspan > 1) {
            cell.colSpan = cellDataItem.colspan;
          }
        }
      }
    }
  }
}

createTable();
