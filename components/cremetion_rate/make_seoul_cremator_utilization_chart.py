from pathlib import Path


ANNUAL_CREMATIONS = 44_411
DAYS_IN_YEAR = 365
TOTAL_CREMATORS = 23
RESERVE_CREMATORS = 3
RECOMMENDED_DAILY_CYCLES = 3.5


def calculate_metrics():
    operating_cremators = TOTAL_CREMATORS - RESERVE_CREMATORS
    daily_cremations = ANNUAL_CREMATIONS / DAYS_IN_YEAR
    actual_daily_cycles = daily_cremations / operating_cremators
    ratio = actual_daily_cycles / RECOMMENDED_DAILY_CYCLES
    excess_rate = (ratio - 1) * 100

    return {
        "operating_cremators": operating_cremators,
        "daily_cremations": daily_cremations,
        "actual_daily_cycles": actual_daily_cycles,
        "ratio": ratio,
        "excess_rate": excess_rate,
    }


def make_svg(metrics):
    chart_max = 7
    baseline_y = 390
    chart_height = 245
    recommended_height = RECOMMENDED_DAILY_CYCLES / chart_max * chart_height
    actual_height = metrics["actual_daily_cycles"] / chart_max * chart_height

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560" role="img" aria-labelledby="title description">
  <title id="title">서울시립승화원 화장로 1기당 일평균 가동 횟수</title>
  <desc id="description">서울시설공단 권고기준 3.5회와 2025년 추정 가동 횟수 6.1회를 비교한 막대그래프</desc>
  <rect width="900" height="560" fill="#ffffff"/>
  <text x="450" y="56" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="27" font-weight="700" fill="#222222">서울시립승화원 화장로 1기당 일평균 가동 횟수</text>
  <text x="450" y="88" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="14" fill="#777777">2025년 화장 44,411건 · 실가동 화장로 20기 가정</text>

  <line x1="135" y1="{baseline_y}" x2="765" y2="{baseline_y}" stroke="#aaaaaa" stroke-width="1"/>
  <line x1="135" y1="{baseline_y - chart_height}" x2="765" y2="{baseline_y - chart_height}" stroke="#eeeeee" stroke-width="1"/>
  <line x1="135" y1="{baseline_y - chart_height / 2}" x2="765" y2="{baseline_y - chart_height / 2}" stroke="#eeeeee" stroke-width="1"/>

  <rect x="245" y="{baseline_y - recommended_height:.1f}" width="130" height="{recommended_height:.1f}" fill="#d9d9d9"/>
  <rect x="525" y="{baseline_y - actual_height:.1f}" width="130" height="{actual_height:.1f}" fill="#a92127"/>

  <text x="310" y="{baseline_y - recommended_height - 16:.1f}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="28" font-weight="800" fill="#444444">{RECOMMENDED_DAILY_CYCLES:.1f}회</text>
  <text x="590" y="{baseline_y - actual_height - 16:.1f}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="28" font-weight="800" fill="#a92127">{metrics['actual_daily_cycles']:.1f}회</text>

  <text x="310" y="424" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="16" font-weight="700" fill="#333333">일일 권고기준</text>
  <text x="590" y="424" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="16" font-weight="700" fill="#333333">2025년 추정치</text>

  <rect x="235" y="462" width="430" height="58" fill="#fff3f3"/>
  <text x="450" y="488" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="16" font-weight="700" fill="#a92127">권고기준의 {metrics['ratio']:.2f}배</text>
  <text x="450" y="510" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="13" fill="#666666">기준보다 약 {metrics['excess_rate']:.1f}% 높은 가동 수준</text>
</svg>
"""


def main():
    metrics = calculate_metrics()
    output_path = (
        Path(__file__).resolve().parents[2]
        / "images"
        / "seoul_cremator_utilization_2025.svg"
    )
    output_path.write_text(make_svg(metrics), encoding="utf-8")

    print(f"연간 화장 건수: {ANNUAL_CREMATIONS:,}건")
    print(f"일평균 화장 건수: {metrics['daily_cremations']:.2f}건")
    print(f"실가동 화장로: {metrics['operating_cremators']}기")
    print(f"1기당 일평균 가동: {metrics['actual_daily_cycles']:.2f}회")
    print(f"권고기준 대비: {metrics['ratio']:.2f}배 ({metrics['excess_rate']:.1f}% 상회)")
    print(f"그래프 저장: {output_path}")


if __name__ == "__main__":
    main()
