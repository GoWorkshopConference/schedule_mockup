import schedules from "./schedules.js";

function generate_times() {
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
  return times;
}

function generate_booths(count) {
  return Array.from({ length: count }, (_, i) => `ブース${i + 1}`);
}

function create_header_row(table, booths) {
  const header_row = table.insertRow();
  const currentDate = new Date();
  header_row.insertCell().textContent = currentDate.toLocaleDateString("ja-JP");
  booths.forEach((booth) => {
    header_row.insertCell().textContent = booth;
  });
}

function create_initial_cell_data(times, booths) {
  return Array.from({ length: times.length }, () =>
    Array(booths.length).fill(null)
  );
}

function update_cell_data(cell_data, schedules, times, booths) {
  const used_cells = new Set();

  schedules.forEach((item) => {
    const row_index = times.indexOf(item.time);
    const col_index = item.booth - 1;
    const cell_key = `${row_index},${col_index}`;

    if (!used_cells.has(cell_key)) {
      cell_data[row_index][col_index] = {
        text: item.value,
        rowspan: 1,
        colspan: 1,
      };
      used_cells.add(cell_key);

      // 縦方向の結合をチェック
      let rowspan = 1;
      for (let i = row_index + 1; i < times.length; i++) {
        if (
          schedules.some(
            (d) =>
              d.time === times[i] &&
              d.booth === item.booth &&
              d.value === item.value
          )
        ) {
          const existing_cell_key = `${i},${col_index}`;
          if (used_cells.has(existing_cell_key)) {
            used_cells.delete(existing_cell_key);
          }
          rowspan++;
          used_cells.add(existing_cell_key);
        } else {
          break;
        }
      }
      if (rowspan > 1) {
        cell_data[row_index][col_index].rowspan = rowspan;
        for (let i = 1; i < rowspan; i++) {
          cell_data[row_index + i][col_index] = undefined;
        }
      }

      // 横方向の結合をチェック
      if (item.horizontal) {
        let colspan = booths.length;
        for (let j = 0; j < booths.length; j++) {
          const existing_cell_key = `${row_index},${j}`;
          if (used_cells.has(existing_cell_key)) {
            used_cells.delete(existing_cell_key);
          }
          if (j !== col_index) {
            cell_data[row_index][j] = undefined;
          }
          used_cells.add(existing_cell_key);
        }

        // 縦方向の結合も考慮
        let additional_rowspan = 1;
        for (let i = row_index + 1; i < times.length; i++) {
          if (
            schedules.some(
              (d) =>
                d.time === times[i] && d.value === item.value && d.horizontal
            )
          ) {
            additional_rowspan++;
            for (let j = 0; j < booths.length; j++) {
              const existing_cell_key = `${i},${j}`;
              if (used_cells.has(existing_cell_key)) {
                used_cells.delete(existing_cell_key);
              }
              used_cells.add(existing_cell_key);
              if (j !== col_index) {
                cell_data[i][j] = undefined;
              }
            }
          } else {
            break;
          }
        }

        cell_data[row_index][col_index].colspan = colspan;
        cell_data[row_index][col_index].rowspan = additional_rowspan;
      }
    }
  });
}

function populate_table(table, times, booths, cell_data) {
  for (let i = 0; i < times.length; i++) {
    const row = table.insertRow();
    const time_cell = row.insertCell();
    time_cell.textContent = times[i];

    for (let j = 0; j < booths.length; j++) {
      const cell_data_item = cell_data[i][j];
      if (cell_data_item !== undefined) {
        const cell = row.insertCell();
        if (cell_data_item) {
          cell.textContent = cell_data_item.text;
          if (cell_data_item.rowspan > 1) {
            cell.rowSpan = cell_data_item.rowspan;
          }
          if (cell_data_item.colspan > 1) {
            cell.colSpan = cell_data_item.colspan;
            cell.classList.add("band");
          }
        }
      }
    }

    // rowの中のtd要素のtextContentが空ならbreakクラスを付与
    Array.from(row.cells).forEach((cell) => {
      if (!cell.textContent) {
        cell.classList.add("break");
      }
    });
  }
}

function create_table() {
  const times = generate_times();
  const booths = generate_booths(15);
  const table = document.getElementById("timeBoothTable");

  create_header_row(table, booths);

  const cell_data = create_initial_cell_data(times, booths);

  update_cell_data(cell_data, schedules, times, booths);

  populate_table(table, times, booths, cell_data);
}

create_table();
