const REQUIRED_FIELDS = ["name", "address"];
let allItems = [];

const statusEl = document.getElementById("status");
const tbodyEl = document.getElementById("tbody");
const qNameEl = document.getElementById("qName");
const qMenuEl = document.getElementById("qMenu");
const qAddressEl = document.getElementById("qAddress");
const scoreFilterEl = document.getElementById("scoreFilter");
const btnResetEl = document.getElementById("btnReset");

[qNameEl, qMenuEl, qAddressEl].forEach(el => el.addEventListener("input", applyFilters));
scoreFilterEl.addEventListener("change", applyFilters);
btnResetEl.addEventListener("click", () => {
  qNameEl.value = "";
  qMenuEl.value = "";
  qAddressEl.value = "";
  scoreFilterEl.value = "";
  applyFilters();
});

initApp();

async function initApp() {
  setStatus("데이터를 불러오는 중...");

  try {
    allItems = await loadRestaurants();
    applyFilters();
  } catch (err) {
    renderErrorState(err);
  }
}

async function loadRestaurants() {
  const res = await fetch("./data/restaurants.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`데이터 요청 실패 (${res.status})`);

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("데이터 형식 오류: 배열이 아님");
  return data.map((item, idx) => validateRestaurant(item, idx));
}

function validateRestaurant(item, idx) {
  if (!item || typeof item !== "object") throw new Error(`${idx + 1}번 데이터 오류: 객체가 아님`);
  for (const field of REQUIRED_FIELDS) if (!(field in item)) throw new Error(`${idx + 1}번 데이터 오류: ${field} 누락`);

  const name = valueOrDefault(item.name, "정보 확인 필요");
  const address = valueOrDefault(item.address, "정보 확인 필요");
  return {
    name,
    menu: valueOrDefault(item.menu, "정보 확인 필요"),
    address,
    number: valueOrDefault(item.number || item.phone, "정보 확인 필요"),
    recommenders: valueOrDefault(item.recommenders, "❗️추천없음"),
    disrecommenders: valueOrDefault(item.disrecommenders, "❗️비추없음"),
    score: valueOrDefault(item.score, "0"),
    memo: valueOrDefault(item.memo, ""),
    businessHours: valueOrDefault(item.businessHours, "정보 확인 필요"),
    naverMapUrl: item.naverMapUrl || buildNaverMapUrl(name, address)
  };
}

function applyFilters() {
  const qName = qNameEl.value.trim().toLowerCase();
  const qMenu = qMenuEl.value.trim().toLowerCase();
  const qAddress = qAddressEl.value.trim().toLowerCase();
  const scoreMode = scoreFilterEl.value;

  const filtered = allItems.filter(it => {
    if (qName && !it.name.toLowerCase().includes(qName)) return false;
    if (qMenu && !it.menu.toLowerCase().includes(qMenu)) return false;
    if (qAddress && !it.address.toLowerCase().includes(qAddress)) return false;

    const s = Number(it.score);
    if (scoreMode === "pos" && !(s >= 0)) return false;
    if (scoreMode === "neg" && !(s < 0)) return false;
    return true;
  });

  if (!filtered.length) {
    tbodyEl.innerHTML = `<tr><td colspan="10" class="empty">조건에 맞는 맛집이 없습니다.</td></tr>`;
    setStatus(`필터 결과 0건 / 전체 ${allItems.length}건`);
    return;
  }

  tbodyEl.innerHTML = filtered.map(renderRow).join("");
  setStatus(`필터 결과 ${filtered.length}건 / 전체 ${allItems.length}건`);
}

function renderRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.menu)}</td>
      <td>${escapeHtml(item.address)}</td>
      <td>${escapeHtml(item.number)}</td>
      <td>${escapeHtml(item.recommenders)}</td>
      <td>${escapeHtml(item.disrecommenders)}</td>
      <td>${escapeHtml(item.score)}</td>
      <td>${escapeHtml(item.memo)}</td>
      <td>${escapeHtml(item.businessHours)}</td>
      <td><a class="map-link" href="${escapeAttr(item.naverMapUrl)}" target="_blank" rel="noopener noreferrer">네이버지도</a></td>
    </tr>
  `;
}

function renderErrorState(err) {
  console.error(err);
  setStatus("데이터를 불러오지 못했어. 잠시 후 다시 시도해줘.", true);
  tbodyEl.innerHTML = `<tr><td colspan="10" class="error">오류: ${escapeHtml(err.message || String(err))}</td></tr>`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = `status${isError ? " error" : ""}`;
}

function valueOrDefault(v, fallback) {
  return String(v ?? "").trim() || fallback;
}

function buildNaverMapUrl(name, address) {
  const q = encodeURIComponent(`${name} ${address}`.trim());
  return `https://map.naver.com/v5/search/${q}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}
