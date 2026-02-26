const REQUIRED_FIELDS = ["name", "address"];

const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");

initApp();

async function initApp() {
  setStatus("데이터를 불러오는 중...");

  try {
    const items = await loadRestaurants();

    if (!items.length) {
      renderEmptyState();
      return;
    }

    renderRestaurantList(items);
    setStatus(`총 ${items.length}개의 맛집을 찾았어.`);
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
  if (!item || typeof item !== "object") {
    throw new Error(`${idx + 1}번 데이터 오류: 객체가 아님`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in item)) {
      throw new Error(`${idx + 1}번 데이터 오류: ${field} 누락`);
    }
  }

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
    memo: valueOrDefault(item.memo, "정보 확인 필요"),
    businessHours: valueOrDefault(item.businessHours, "정보 확인 필요"),
    naverMapUrl: item.naverMapUrl || buildNaverMapUrl(name, address)
  };
}

function buildNaverMapUrl(name, address) {
  const q = encodeURIComponent(`${name} ${address}`.trim());
  return `https://map.naver.com/v5/search/${q}`;
}

function valueOrDefault(v, fallback) {
  return String(v ?? "").trim() || fallback;
}

function renderRestaurantList(items) {
  listEl.innerHTML = items.map(renderRestaurantCard).join("");
}

function renderRestaurantCard(item) {
  return `
    <article class="card">
      <h2 class="name">${escapeHtml(item.name)}</h2>
      <p class="row"><span class="label">Menu 및 기타</span>${escapeHtml(item.menu)}</p>
      <p class="row"><span class="label">Address</span>${escapeHtml(item.address)}</p>
      <p class="row"><span class="label">Number</span>${escapeHtml(item.number)}</p>
      <p class="row"><span class="label">추천자</span>${escapeHtml(item.recommenders)}</p>
      <p class="row"><span class="label">비추천자</span>${escapeHtml(item.disrecommenders)}</p>
      <p class="row"><span class="label">추-비추</span>${escapeHtml(item.score)}</p>
      <p class="row"><span class="label">메모</span>${escapeHtml(item.memo)}</p>
      <p class="row"><span class="label">영업 시간</span>${escapeHtml(item.businessHours)}</p>
      <p class="row"><a class="map-link" href="${escapeAttr(item.naverMapUrl)}" target="_blank" rel="noopener noreferrer">🗺️ 네이버 지도 보기</a></p>
    </article>
  `;
}

function renderEmptyState() {
  setStatus("등록된 맛집이 아직 없어.");
  listEl.innerHTML = `<p class="empty">등록된 맛집이 없습니다.</p>`;
}

function renderErrorState(err) {
  console.error(err);
  setStatus("데이터를 불러오지 못했어. 잠시 후 다시 시도해줘.", true);
  listEl.innerHTML = `<p class="error">오류가 발생했습니다: ${escapeHtml(err.message || String(err))}</p>`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = `status${isError ? " error" : ""}`;
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
