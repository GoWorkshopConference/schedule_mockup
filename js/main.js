import schedules from "./schedules.js";

let cart = [];

function generate_times() {
  const times = [];
  for (let hour = 10; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 19 && minute > 0) break;
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
          cell.setAttribute("data-time", times[i]);
          cell.setAttribute("data-booth", `ブース${j + 1}`);
          cell.setAttribute("data-event", cell_data_item.text);
          cell.setAttribute("data-duration", cell_data_item.rowspan);
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

    Array.from(row.cells).forEach((cell) => {
      if (!cell.textContent) {
        cell.classList.add("break");
      } else {
        cell.addEventListener("click", openModal);
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

function openModal(event) {
  const cell = event.target;
  const eventTime = cell.getAttribute("data-time");
  const eventBooth = cell.getAttribute("data-booth");
  const eventName = cell.getAttribute("data-event");
  const duration = parseInt(cell.getAttribute("data-duration"), 10);
  const endTime = calculateEndTime(eventTime, duration);
  const modal = document.getElementById("modal");
  const eventDetails = document.getElementById("eventDetails");

  if (cell.classList.contains("band")) {
    eventDetails.innerHTML = `
      <p>イベント: ${eventName}</p>
      <p>時間: ${eventTime} - ${endTime}</p>
    `;
    document.getElementById("lineUpButton").style.display = "none";
  } else {
    eventDetails.innerHTML = `
      <p>イベント: ${eventName}</p>
      <p>時間: ${eventTime} - ${endTime}</p>
      <p>ブース: ${eventBooth}</p>
      <p>定員: ${Math.floor(Math.random() * 100)}</p>
      <p>確定人数: ${Math.floor(Math.random() * 100)}</p>
      <p>並んでいる人数: ${Math.floor(Math.random() * 100)}</p>
    `;
    document.getElementById("lineUpButton").style.display = "block";
  }

  document.getElementById("lineUpButton").setAttribute("data-time", eventTime);
  document
    .getElementById("lineUpButton")
    .setAttribute("data-end-time", endTime);
  document.getElementById("lineUpButton").setAttribute("data-event", eventName);
  modal.style.display = "block";
}

function calculateEndTime(startTime, duration) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const totalMinutes = startHour * 60 + startMinute + duration * 15;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${endHour.toString().padStart(2, "0")}:${endMinute
    .toString()
    .padStart(2, "0")}`;
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}

function handleOutsideClick(event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    closeModal();
  }
}

function isTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

function addToCart(event) {
  const time = event.target.getAttribute("data-time");
  const endTime = event.target.getAttribute("data-end-time");
  const eventName = event.target.getAttribute("data-event");
  const [startHour, startMinute] = time.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTime = new Date();
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTimeObj = new Date();
  endTimeObj.setHours(endHour, endMinute, 0, 0);

  for (const item of cart) {
    const [itemStartHour, itemStartMinute] = item.time.split(":").map(Number);
    const [itemEndHour, itemEndMinute] = item.endTime.split(":").map(Number);

    const itemStartTime = new Date();
    itemStartTime.setHours(itemStartHour, itemStartMinute, 0, 0);

    const itemEndTime = new Date();
    itemEndTime.setHours(itemEndHour, itemEndMinute, 0, 0);

    if (isTimeOverlap(startTime, endTimeObj, itemStartTime, itemEndTime)) {
      showNotification(
        "既に同じ時間帯のイベントがカートに入っています。",
        true
      );
      return;
    }
  }

  cart.push({ time, endTime, eventName });
  updateCart();
  closeModal();
}

function updateCart() {
  const cartList = document.getElementById("cartList");
  const cartCount = document.getElementById("cartCount");
  cartList.innerHTML = "";
  cart.sort((a, b) => a.time.localeCompare(b.time));
  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="cart-item-details">
        <span class="cart-item-name">${item.eventName}</span>
        <span class="cart-item-time">${item.time} - ${item.endTime}</span>
      </div>
    `;
    const removeButton = document.createElement("button");
    removeButton.textContent = "削除";
    removeButton.className = "delete-button";
    removeButton.addEventListener("click", () => {
      cart.splice(index, 1);
      updateCart();
      const eventCells = document.querySelectorAll(
        `td[data-event="${item.eventName}"]`
      );
      eventCells.forEach((cell) => {
        cell.style.backgroundColor = "";
        cell.style.color = "";
      });
    });
    li.appendChild(removeButton);
    cartList.appendChild(li);
    const eventCells = document.querySelectorAll(
      `td[data-event="${item.eventName}"]`
    );
    eventCells.forEach((cell) => {
      cell.style.backgroundColor = "#226986";
      cell.style.color = "#ffffff";
    });
  });
  cartCount.textContent = cart.length;
}

function showNotification(message, isError = false) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = isError ? "notification error" : "notification";
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

function showConfirmModal() {
  const confirmModal = document.getElementById("confirmModal");
  const confirmList = document.getElementById("confirmList");
  confirmList.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.time} - ${item.endTime} ${item.eventName}`;
    confirmList.appendChild(li);
  });
  confirmModal.style.display = "block";
}

function confirmReservation() {
  const email = document.getElementById("email").value;
  if (!email) {
    showNotification("メールアドレスを入力してください。", true);
    return;
  }
  showNotification("予約が確定しました！");
  cart = [];
  updateCart();
  document.getElementById("email").value = "";
  document.getElementById("confirmModal").style.display = "none";
  document.getElementById("cartContainer").style.display = "none";

  // パネルの選択解除
  const eventCells = document.querySelectorAll("td");
  eventCells.forEach((cell) => {
    cell.style.backgroundColor = "";
    cell.style.color = "";
  });
}

function toggleCart() {
  const cartContainer = document.getElementById("cartContainer");
  const toggleCartButton = document.getElementById("toggleCartButton");
  if (
    cartContainer.style.display === "none" ||
    cartContainer.style.display === ""
  ) {
    cartContainer.style.display = "flex";
    toggleCartButton.innerHTML = `リスト非表示 <span id="cartCount" class="cart-count">${cart.length}</span>`;
  } else {
    cartContainer.style.display = "none";
    toggleCartButton.innerHTML = `リスト表示 <span id="cartCount" class="cart-count">${cart.length}</span>`;
  }
}

document.getElementById("lineUpButton").addEventListener("click", addToCart);
document
  .getElementById("confirmButton")
  .addEventListener("click", showConfirmModal);
document
  .getElementById("confirmReservationButton")
  .addEventListener("click", confirmReservation);
document
  .getElementById("toggleCartButton")
  .addEventListener("click", toggleCart);
window.addEventListener("click", handleOutsideClick);
document.querySelectorAll(".close-button").forEach((button) => {
  button.addEventListener("click", closeModal);
  button.addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "none";
  });
});

create_table();
