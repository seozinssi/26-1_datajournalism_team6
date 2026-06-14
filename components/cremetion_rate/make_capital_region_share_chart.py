import csv
from pathlib import Path


DATA_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "수도권_비수도권_화장시설_실적_비교_2024.csv"
)
OUTPUT_PATH = (
    Path(__file__).resolve().parents[2]
    / "images"
    / "capital_region_cremation_share_2024.svg"
)


def load_capital_region_data():
    with DATA_PATH.open(encoding="utf-8-sig", newline="") as csv_file:
        rows = list(csv.DictReader(csv_file))

    capital_region = next(row for row in rows if row["구분"] == "수도권")

    return {
        "cremators": int(capital_region["화장로수"]),
        "cremator_share": float(capital_region["화장로수_비중_pct"]),
        "corpse_cremations": int(capital_region["시신"]),
        "corpse_share": float(capital_region["시신_비중_pct"]),
    }


def calculate_metrics(data):
    percentage_point_gap = data["corpse_share"] - data["cremator_share"]
    concentration_ratio = data["corpse_share"] / data["cremator_share"]

    return {
        **data,
        "percentage_point_gap": percentage_point_gap,
        "concentration_ratio": concentration_ratio,
    }


def make_svg(metrics):
    chart_max = 50
    baseline_y = 390
    chart_height = 245
    cremator_height = metrics["cremator_share"] / chart_max * chart_height
    corpse_height = metrics["corpse_share"] / chart_max * chart_height

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560" role="img" aria-labelledby="title description">
  <title id="title">수도권 화장로와 시신 화장실적의 전국 비중</title>
  <desc id="description">2024년 수도권 화장로 비중 25.8퍼센트와 시신 화장실적 비중 39.6퍼센트를 비교한 막대그래프</desc>
  <rect width="900" height="560" fill="#ffffff"/>
  <text x="450" y="56" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="27" font-weight="700" fill="#222222">수도권 화장로·시신 화장실적 비중</text>
  <text x="450" y="88" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="14" fill="#777777">2024년 12월 말 기준 · 전국 대비</text>

  <line x1="135" y1="{baseline_y}" x2="765" y2="{baseline_y}" stroke="#aaaaaa" stroke-width="1"/>
  <line x1="135" y1="{baseline_y - chart_height}" x2="765" y2="{baseline_y - chart_height}" stroke="#eeeeee" stroke-width="1"/>
  <line x1="135" y1="{baseline_y - chart_height / 2}" x2="765" y2="{baseline_y - chart_height / 2}" stroke="#eeeeee" stroke-width="1"/>

  <rect x="245" y="{baseline_y - cremator_height:.1f}" width="130" height="{cremator_height:.1f}" fill="#d9d9d9"/>
  <rect x="525" y="{baseline_y - corpse_height:.1f}" width="130" height="{corpse_height:.1f}" fill="#a92127"/>

  <text x="310" y="{baseline_y - cremator_height - 16:.1f}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="28" font-weight="800" fill="#444444">{metrics['cremator_share']:.1f}%</text>
  <text x="590" y="{baseline_y - corpse_height - 16:.1f}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="28" font-weight="800" fill="#a92127">{metrics['corpse_share']:.1f}%</text>

  <text x="310" y="424" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="16" font-weight="700" fill="#333333">화장로 비중</text>
  <text x="310" y="447" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="13" fill="#777777">{metrics['cremators']}기</text>
  <text x="590" y="424" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="16" font-weight="700" fill="#333333">시신 화장실적 비중</text>
  <text x="590" y="447" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="13" fill="#777777">{metrics['corpse_cremations']:,}건</text>

  <rect x="235" y="474" width="430" height="58" fill="#fff3f3"/>
  <text x="450" y="500" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="16" font-weight="700" fill="#a92127">실적 비중이 {metrics['percentage_point_gap']:.1f}%p 높음</text>
  <text x="450" y="522" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="13" fill="#666666">화장로 비중 대비 약 {metrics['concentration_ratio']:.2f}배 집중</text>
</svg>
"""


def main():
    metrics = calculate_metrics(load_capital_region_data())
    OUTPUT_PATH.write_text(make_svg(metrics), encoding="utf-8")

    print(f"수도권 화장로: {metrics['cremators']}기")
    print(f"수도권 화장로 비중: {metrics['cremator_share']:.1f}%")
    print(f"수도권 시신 화장실적: {metrics['corpse_cremations']:,}건")
    print(f"수도권 시신 화장실적 비중: {metrics['corpse_share']:.1f}%")
    print(f"비중 차이: {metrics['percentage_point_gap']:.1f}%p")
    print(f"집중도: {metrics['concentration_ratio']:.2f}배")
    print(f"그래프 저장: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
