const dataVersion = "20260614-3";
const cremationCsvPath = `cremation_location.csv?v=${dataVersion}`;
const feeCsvPath = `cremation_fee.csv?v=${dataVersion}`;
const adminCsvPath = `national_admin_emd_2024_12_31.csv?v=${dataVersion}`;
const distanceCsvPath = `emd_nearest_cremation_facilities.csv?v=${dataVersion}`;

let cremationData = [];
let feeData = [];
let adminData = [];
let distanceData = [];

const sharedFacilityJurisdictions = [
  {
    facility: "서울시립승화원",
    regions: ["고양시", "파주시"],
  },
  {
    facility: "화성함백산추모공원",
    regions: ["화성시", "부천시", "안산시", "안양시", "시흥시", "광명시", "군포시"],
  },
  {
    facility: "춘천안식원",
    regions: ["춘천시", "홍천군"],
  },
  {
    facility: "원주추모공원화장장",
    regions: ["원주시", "여주시", "횡성군"],
  },
  {
    facility: "동해삼척공동화장장",
    regions: ["동해시", "삼척시"],
  },
  {
    facility: "서남권추모공원",
    regions: ["정읍시", "김제시", "고창군", "부안군"],
  },
  {
    facility: "남도광역추모공원",
    regions: ["해남군", "완도군", "진도군"],
  },
];

const sidoSelect = document.getElementById("sidoSelect");
const sigunguSelect = document.getElementById("sigunguSelect");
const emdSelect = document.getElementById("emdSelect");
const searchButton = document.getElementById("searchButton");
const isEmbedded = window.self !== window.top;

searchButton.addEventListener("click", searchRegion);

sidoSelect.addEventListener("change", () => {
  populateSigunguOptions(sidoSelect.value);
  hideResult();
});

sigunguSelect.addEventListener("change", () => {
  populateEmdOptions(sidoSelect.value, sigunguSelect.value);
  hideResult();
});

emdSelect.addEventListener("change", () => {
  searchButton.disabled = !emdSelect.value;
  hideResult();
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    [cremationData, feeData, adminData, distanceData] =
      await Promise.all([
      loadCSV(cremationCsvPath),
      loadCSV(feeCsvPath),
      loadCSV(adminCsvPath),
      loadCSV(distanceCsvPath),
    ]);

    console.log("전국 화장시설 데이터:", cremationData);
    console.log("화장시설 요금 데이터:", feeData);
    populateSidoOptions();
    notifyParentOfHeight();
  } catch (error) {
    console.error("CSV 로드 실패:", error);
    document.getElementById("errorMessage").textContent =
      "CSV 파일을 불러오지 못했습니다. 파일 위치와 이름을 확인해주세요.";
    notifyParentOfHeight();
  }
});

window.addEventListener("load", notifyParentOfHeight);

document.querySelectorAll("details").forEach((details) => {
  details.addEventListener("toggle", () => {
    notifyParentOfHeight();
    window.requestAnimationFrame(() => {
      notifyParentOfHeight();
      window.requestAnimationFrame(notifyParentOfHeight);
    });
  });
});

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(notifyParentOfHeight);
  resizeObserver.observe(document.querySelector(".interactive"));
}

async function loadCSV(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} 파일을 찾을 수 없습니다.`);
  }

  const text = await response.text();
  return parseCSV(text);
}

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function populateSidoOptions() {
  const sidoNames = new Set(
    distanceData.map((item) => item["시도"]).filter(Boolean)
  );

  sidoSelect.innerHTML = [
    '<option value="">시·도 선택</option>',
    ...sortKorean([...sidoNames]).map(
      (sido) => `<option value="${escapeHTML(sido)}">${escapeHTML(sido)}</option>`
    ),
  ].join("");
}

function populateSigunguOptions(selectedSido) {
  const sigunguNames = new Set(
    distanceData
      .filter((item) => item["시도"] === selectedSido)
      .map((item) => item["시군구"])
      .filter(Boolean)
  );

  sigunguSelect.innerHTML = [
    '<option value="">시·군·구 선택</option>',
    ...sortKorean([...sigunguNames]).map(
      (sigungu) =>
        `<option value="${escapeHTML(sigungu)}">${escapeHTML(sigungu)}</option>`
    ),
  ].join("");
  sigunguSelect.disabled = !selectedSido;
  emdSelect.innerHTML = '<option value="">읍·면·동 선택</option>';
  emdSelect.disabled = true;
  searchButton.disabled = true;
}

function populateEmdOptions(selectedSido, selectedSigungu) {
  const emdRows = [
    ...new Map(
      distanceData
      .filter(
        (item) =>
          item["시도"] === selectedSido && item["시군구"] === selectedSigungu
      )
        .map((item) => [item["읍면동코드"], item])
    ).values(),
  ].sort((first, second) =>
    first["읍면동명"].localeCompare(second["읍면동명"], "ko-KR", {
      numeric: true,
    })
  );

  emdSelect.innerHTML = [
    '<option value="">읍·면·동 선택</option>',
    ...emdRows.map(
      (item) =>
        `<option value="${escapeHTML(item["읍면동코드"])}">${escapeHTML(
          item["읍면동명"]
        )}</option>`
    ),
  ].join("");
  emdSelect.disabled = !selectedSigungu;
  searchButton.disabled = true;
}

function searchRegion() {
  const selectedSido = sidoSelect.value;
  const selectedSigungu = sigunguSelect.value;
  const selectedEmdCode = emdSelect.value;
  const selectedDistances = distanceData
    .filter((item) => item["읍면동코드"] === selectedEmdCode)
    .sort((first, second) => Number(first["순위"]) - Number(second["순위"]));
  const selectedEmdName = selectedDistances[0]?.["읍면동명"] || "";
  const selectedRegionLabel = [
    selectedSido,
    selectedSigungu,
    selectedEmdName,
  ].join(" ");

  const resultSection = document.getElementById("resultSection");
  const errorMessage = document.getElementById("errorMessage");
  const facilityList = document.getElementById("facilityList");

  if (!selectedSido || !selectedSigungu || !selectedEmdCode) {
    resultSection.classList.add("hidden");
    errorMessage.textContent = "시·도, 시·군·구, 읍·면·동을 모두 선택해주세요.";
    return;
  }

  errorMessage.textContent = "";

  if (selectedDistances.length > 0) {
    showDistanceResult(selectedRegionLabel, selectedDistances);
    revealResult();
    return;
  }

  document.getElementById("regionName").textContent = selectedRegionLabel;
  document.getElementById("facilityCount").textContent = "0개";
  document.getElementById("nearestFacility").textContent = "데이터 없음";
  document.getElementById("distance").textContent = "확인 필요";
  document.getElementById("grade").textContent = "미산정";

  document.getElementById("comment").textContent =
    "이 지역의 화장시설 또는 가장 가까운 시설까지의 거리 데이터가 아직 등록되지 않았습니다.";

  facilityList.innerHTML = "";
  hideFeeSummary();

  setGradeColor("none");
  revealResult();
}

function getFacilityJurisdiction(sido, sigungu) {
  const normalizedFacilityRegion = normalizeRegionName(sigungu);
  const adminMatch = adminData.find(
    (item) =>
      normalizeRegionName(item["시도"]) === normalizeRegionName(sido) &&
      normalizeRegionName(item["시군구"]) === normalizedFacilityRegion
  );

  return adminMatch?.["상위시군구"] || sigungu;
}

function showDistanceResult(regionLabel, rankedFacilities) {
  const nearest = rankedFacilities[0];
  const regionFacilities = cremationData.filter((item) => {
    return isInsideSelectedRegion(item["시설명"]);
  });
  const distance = Number(nearest["직선거리_km"]);
  const distanceText =
    distance < 0.05 ? "같은 법정 읍·면·동" : `약 ${distance.toFixed(1)}km`;
  const outside = isOutsideSelectedRegion(nearest["시설명"]);
  const fee = findFacilityFee(nearest["시설명"]);

  document.getElementById("regionName").textContent = regionLabel;
  document.getElementById("facilityCount").textContent =
    `${regionFacilities.length}개`;
  document.getElementById("nearestFacility").textContent = nearest["시설명"];
  document.getElementById("distance").textContent = distanceText;
  document.getElementById("grade").textContent = getDistanceGrade(distance);
  document.getElementById("comment").textContent =
    `${regionLabel}의 법정 읍·면·동 중심점에서 가장 가까운 시설은 ` +
    `${nearest["시설명"]}입니다. ${
      distance < 0.05
        ? "시설 주소와 선택 지역이 같은 법정 읍·면·동에 있습니다. "
        : `중심점 간 직선거리는 약 ${distance.toFixed(1)}km입니다. `
    }` +
    "실제 도로 이동거리는 더 길 수 있습니다.";

  document.getElementById("facilityList").innerHTML = rankedFacilities
    .map((item) => {
      const facility = cremationData.find(
        (row) =>
          normalizeFacilityName(row["시설명"]) ===
          normalizeFacilityName(item["시설명"])
      );
      return `
        <div class="facility-item">
          <strong>${item["순위"]}위 ${item["시설명"]}</strong>
          <p>${facility?.["주소"] || "주소 정보 없음"}</p>
          <span>${
            Number(item["직선거리_km"]) < 0.05
              ? "같은 법정 읍·면·동"
              : `직선거리 약 ${Number(item["직선거리_km"]).toFixed(1)}km`
          } · ${
            isOutsideSelectedRegion(item["시설명"]) ? "관외" : "관내"
          } · 전화번호 ${facility?.["전화번호"] || "정보 없음"}</span>
        </div>
      `;
    })
    .join("");

  showFeeSummary(fee, outside);
  setGradeColor(getDistanceGrade(distance));
}

function isOutsideSelectedRegion(facilityName) {
  return !isInsideSelectedRegion(facilityName);
}

function isInsideSelectedRegion(facilityName) {
  const facility = cremationData.find(
    (item) =>
      normalizeFacilityName(item["시설명"]) ===
      normalizeFacilityName(facilityName)
  );
  if (!facility) return false;

  const selectedJurisdiction = normalizeRegionName(
    getFacilityJurisdiction(sidoSelect.value, sigunguSelect.value)
  );
  const sharedJurisdictions = getSharedFacilityJurisdictions(facilityName);

  if (sharedJurisdictions.includes(selectedJurisdiction)) {
    return true;
  }

  const sameSido =
    normalizeRegionName(facility["시도"]) === normalizeRegionName(sidoSelect.value);
  const isSidoWideFacility =
    normalizeRegionName(facility["시군구"]) ===
    normalizeRegionName(facility["시도"]);
  const sameJurisdiction =
    normalizeRegionName(getFacilityJurisdiction(facility["시도"], facility["시군구"])) ===
    selectedJurisdiction;

  return sameSido && (isSidoWideFacility || sameJurisdiction);
}

function getSharedFacilityJurisdictions(facilityName) {
  const normalizedFacility = normalizeFacilityName(facilityName);
  const sharedFacility = sharedFacilityJurisdictions.find((item) => {
    const normalizedSharedFacility = normalizeFacilityName(item.facility);
    return (
      normalizedFacility === normalizedSharedFacility ||
      normalizedFacility.includes(normalizedSharedFacility) ||
      normalizedSharedFacility.includes(normalizedFacility)
    );
  });

  return sharedFacility
    ? sharedFacility.regions.map((region) => normalizeRegionName(region))
    : [];
}

function getDistanceGrade(distance) {
  if (distance <= 20) return "보통";
  if (distance <= 40) return "취약";
  return "매우 취약";
}

function hideResult() {
  document.getElementById("resultSection").classList.add("hidden");
  document.getElementById("errorMessage").textContent = "";
  notifyParentOfHeight();
}

function revealResult() {
  const resultSection = document.getElementById("resultSection");
  resultSection.classList.remove("hidden");

  window.requestAnimationFrame(() => {
    notifyParentOfHeight();

    if (!isEmbedded) {
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function showAccessResult(data) {
  const facilityList = document.getElementById("facilityList");
  const facility = cremationData.find(
    (item) =>
      normalizeFacilityName(item["시설명"]) ===
      normalizeFacilityName(data["nearest_facility"])
  );
  const fee = findFacilityFee(data["nearest_facility"]);
  const outside = isOutsideUser(data, data["nearest_facility"]);
  const feeMarkup = fee
    ? `<span class="facility-fee"><b>${outside ? "관외" : "관내"}</b> 화장 비용 ${formatWon(
        getFeeAmount(fee, outside ? "outside" : "inside")
      )}</span>`
    : "";

  document.getElementById("regionName").textContent = [
    sidoSelect.value,
    sigunguSelect.value,
    emdSelect.value,
  ].join(" ");
  document.getElementById("facilityCount").textContent = `${data["facility_count"]}개`;
  document.getElementById("nearestFacility").textContent = data["nearest_facility"];
  document.getElementById("distance").textContent = `약 ${data["distance_km"]}km`;
  document.getElementById("grade").textContent = data["grade"];

  document.getElementById("comment").textContent =
    `${data["comment"]} 선택한 읍·면·동의 개별 위치가 아닌 ${data["sigungu"]}청 본청을 출발지로 계산하면, 가장 가까운 ${data["nearest_facility"]}까지 자동차 기준 약 ${data["distance_km"]}km, ${data["travel_time"]}이 걸립니다.`;

  facilityList.innerHTML = `
    <div class="facility-item">
      <strong>가장 가까운 화장장: ${data["nearest_facility"]}</strong>
      <p>기준: ${data["distance_basis"]}</p>
      <span>거리 ${data["distance_km"]}km · 예상 이동시간 ${data["travel_time"]} · 전화번호 ${facility?.["전화번호"] || "정보 없음"}</span>
      ${feeMarkup}
    </div>
  `;

  showFeeSummary(fee, outside);
  setGradeColor(data["grade"]);
}

function showFacilityResult(keyword, facilities) {
  const facilityList = document.getElementById("facilityList");

  const totalCremators = facilities.reduce((sum, item) => {
    const count = Number(item["화장로수"]);
    return sum + (isNaN(count) ? 0 : count);
  }, 0);

  document.getElementById("regionName").textContent = `${keyword} 선택 결과`;
  document.getElementById("facilityCount").textContent = `${facilities.length}개`;
  document.getElementById("nearestFacility").textContent = facilities[0]["시설명"];
  document.getElementById("distance").textContent = "지역 내";
  document.getElementById("grade").textContent = "양호";

  document.getElementById("comment").textContent =
    `전국 화장시설 목록에서 ${facilities.length}개의 화장시설이 확인됩니다. 등록된 화장로 수는 총 ${totalCremators}기입니다.`;

  facilityList.innerHTML = facilities
    .map((item) => {
      return `
        <div class="facility-item">
          <strong>${item["시설명"]}</strong>
          <p>${item["주소"]}</p>
          <span>${item["공-사설 구분"]} · 화장로 ${item["화장로수"]}기 · 전화번호 ${item["전화번호"] || "정보 없음"}</span>
        </div>
      `;
    })
    .join("");

  const firstFee = findFacilityFee(facilities[0]["시설명"]);
  showFeeSummary(firstFee, false);
  setGradeColor("양호");
}

function findFacilityFee(facilityName) {
  const normalizedName = normalizeFacilityName(facilityName);

  return feeData.find((item) => {
    const feeFacilityName = item["facility_name"] || item["facility"];
    const normalizedFeeName = normalizeFacilityName(feeFacilityName);

    return (
      normalizedFeeName === normalizedName ||
      normalizedFeeName.includes(normalizedName) ||
      normalizedName.includes(normalizedFeeName)
    );
  });
}

function isOutsideUser(regionData, facilityName) {
  const facility = cremationData.find(
    (item) =>
      normalizeRegionName(item["시설명"]) === normalizeRegionName(facilityName)
  );

  if (!facility) return true;

  const userRegion = normalizeRegionName(regionData["sigungu"]);
  const facilityRegion = normalizeRegionName(
    facility["시군구"] || facility["시도"]
  );

  return userRegion !== facilityRegion;
}

function showFeeSummary(fee, outside, showBoth = false) {
  const feeSummary = document.getElementById("feeSummary");
  const feeType = document.getElementById("feeType");
  const applicableFee = document.getElementById("applicableFee");
  const feeComparison = document.getElementById("feeComparison");
  const feeSource = document.getElementById("feeSource");

  if (!fee) {
    hideFeeSummary();
    return;
  }

  const insideFee = getFeeAmount(fee, "inside");
  const outsideFee = getFeeAmount(fee, "outside");

  feeType.classList.toggle("outside", outside && !showBoth);

  if (showBoth) {
    feeType.textContent = "요금 안내";
    applicableFee.textContent =
      `관내 ${formatWon(insideFee)} · 관외 ${formatWon(outsideFee)}`;
    feeComparison.textContent = "실제 적용 구분은 시설별 거주지 기준에 따라 달라집니다.";
  } else if (outside) {
    const difference = outsideFee - insideFee;
    feeType.textContent = "관외 요금 적용";
    applicableFee.textContent = formatWon(outsideFee);
    feeComparison.textContent =
      `관내 주민 요금 ${formatWon(insideFee)}보다 ${formatWon(difference)} 높습니다.`;
  } else {
    feeType.textContent = "관내 요금 적용";
    applicableFee.textContent = formatWon(insideFee);
    feeComparison.textContent = `관외 이용 요금은 ${formatWon(outsideFee)}입니다.`;
  }

  feeSource.textContent =
    fee["source_note"] ||
    fee["note"] ||
    "일반 성인 시신 화장 요금 기준입니다. 실제 적용 조건은 시설에 확인해주세요.";
  feeSummary.classList.remove("hidden");
}

function hideFeeSummary() {
  document.getElementById("feeSummary").classList.add("hidden");
}

function notifyParentOfHeight() {
  if (!isEmbedded) return;

  const resultSection = document.getElementById("resultSection");
  const interactive = document.querySelector(".interactive");
  const height = Math.ceil(interactive.getBoundingClientRect().height);

  window.parent.postMessage(
    {
      type: "cremation-interactive-resize",
      height,
      expanded: !resultSection.classList.contains("hidden"),
    },
    "*"
  );
}

function formatWon(value) {
  if (!Number.isFinite(value)) return "요금 정보 없음";
  return `${value.toLocaleString("ko-KR")}원`;
}

function getFeeAmount(fee, type) {
  const fieldNames =
    type === "outside"
      ? ["corpse_outside", "outside_fee"]
      : ["corpse_inside", "inside_fee"];

  const value = fieldNames
    .map((fieldName) => fee[fieldName])
    .find((fieldValue) => fieldValue !== undefined && fieldValue !== "");

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

function normalizeFacilityName(text) {
  if (!text) return "";

  return normalizeRegionName(text)
    .replaceAll("화장시설", "")
    .replaceAll("화장장", "")
    .replaceAll("승화원", "")
    .replaceAll("공설", "")
    .replaceAll("시립", "")
    .replace(/[()·\-\s]/g, "");
}

function setGradeColor(grade) {
  const gradeCard = document.querySelector(".grade-card");

  gradeCard.classList.remove("good", "warning", "danger", "none");

  if (grade === "양호" || grade === "보통") {
    gradeCard.classList.add("good");
  } else if (grade === "취약") {
    gradeCard.classList.add("warning");
  } else if (grade === "매우 취약") {
    gradeCard.classList.add("danger");
  } else {
    gradeCard.classList.add("none");
  }
}

function normalizeRegionName(text) {
  if (!text) return "";

  return text
    .replaceAll("특별시", "")
    .replaceAll("광역시", "")
    .replaceAll("특별자치시", "")
    .replaceAll("특별자치도", "")
    .replaceAll("경기도", "경기")
    .replaceAll("강원특별자치도", "강원")
    .replaceAll("충청북도", "충북")
    .replaceAll("충청남도", "충남")
    .replaceAll("전라북도", "전북")
    .replaceAll("전라남도", "전남")
    .replaceAll("경상북도", "경북")
    .replaceAll("경상남도", "경남")
    .replaceAll("제주특별자치도", "제주")
    .replaceAll("시", "")
    .replaceAll("군", "")
    .replaceAll("구", "")
    .replace(/\s/g, "")
    .trim();
}

function sortKorean(values) {
  return values.sort((first, second) =>
    first.localeCompare(second, "ko-KR", { numeric: true })
  );
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
