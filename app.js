const REQUIRED_FIELDS = ["name", "address", "phone", "memo", "businessHours"];

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

  const validated = data.map((item, idx) => validateRestaurant(item, idx));
  return validated;
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

  return {
    name: valueOrDefault(item.name, "정보 확인 필요"),
    address: valueOrDefault(item.address, "정보 확인 필요"),
    phone: valueOrDefault(item.phone, "정보 확인 필요"),
    memo: valueOrDefault(item.memo, "정보 확인 필요"),
    businessHours: valueOrDefault(item.businessHours, "정보 확인 필요")
  };
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
      <p class="row"><span class="label">주소</span>${escapeHtml(item.address)}</p>
      <p class="row"><span class="label">전화번호</span>${escapeHtml(item.phone)}</p>
      <p class="row"><span class="label">메모</span>${escapeHtml(item.memo)}</p>
      <p class="row"><span class="label">영업시간</span>${escapeHtml(item.businessHours)}</p>
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
