import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import os

# 1. 한글 폰트 설정 (MacOS 기준 AppleGothic, 없으면 기본 설정)
def set_korean_font():
    font_path = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"
    if os.path.exists(font_path):
        font_name = fm.FontProperties(fname=font_path).get_name()
        plt.rc('font', family=font_name)
    else:
        plt.rc('font', family='sans-serif')
    plt.rcParams['axes.unicode_minus'] = False

set_korean_font()

# 2. 데이터 로드
# 스크립트 파일의 위치를 기준으로 경로 설정
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "cremation_death_rate_facilities_2001_2024.csv")
df = pd.read_csv(csv_path)

# 3. 데이터 전처리
# 화장률에서 '%' 제거하고 숫자로 변환
df['화장률'] = df['화장률'].str.replace('%', '').astype(float)

# 2004년부터 시작하도록 필터링
df = df[df['연도'] >= 2004].copy()

# 4. 그래프 생성 (이중 축 활용)
fig, ax1 = plt.subplots(figsize=(12, 7))

# 축 1: 화장자 수 (막대 그래프)
color_cremation = '#d9d9d9'
ax1.bar(df['연도'], df['해당연도 사망자 중 화장자 수'], color=color_cremation, label='화장자 수')
ax1.set_xlabel('연도')
ax1.set_ylabel('화장자 수 (명)', color='#666666')
ax1.tick_params(axis='y', labelcolor='#666666')
ax1.grid(axis='y', linestyle='--', alpha=0.3)

# 축 2: 화장률 (선 그래프)
ax2 = ax1.twinx()
color_rate = '#c02d2d'
ax2.plot(df['연도'], df['화장률'], color=color_rate, marker='o', linewidth=2.5, label='화장률 (%)')
ax2.set_ylabel('화장률 (%)', color=color_rate)
ax2.tick_params(axis='y', labelcolor=color_rate)

# 상단 여백 확보를 위해 Y축 범위 상향 조정
ax1.set_ylim(0, df['해당연도 사망자 중 화장자 수'].max() * 1.2)
ax2.set_ylim(0, 110)

# 수치 표시 (2004년 포인트)
start_year_data = df[df['연도'] == 2004].iloc[0]
ax2.text(start_year_data['연도'], start_year_data['화장률'] + 3, f"{start_year_data['화장률']}%", 
         color=color_rate, fontweight='bold', ha='center')

# 수치 표시 (마지막 연도 포인트)
last_year = df.iloc[-1]
ax2.text(last_year['연도'], last_year['화장률'] + 3, f"{last_year['화장률']}%", 
         color=color_rate, fontweight='bold', ha='center')

# 제목 및 범례
plt.title('대한민국 화장률 및 화장자 수 추이 (2004-2024)', fontsize=16, pad=30, fontweight='bold')

# X축 범위 및 틱 설정 (2025 표시 제거)
ax1.set_xlim(2003.2, 2024.8)
ax1.set_xticks(range(2004, 2025, 1))

fig.tight_layout()
fig.subplots_adjust(top=0.88) # 제목과 그래프 사이 여백 추가

# 5. 결과 저장
output_path = os.path.join(base_dir, "../../images/cremation_trend.png")
plt.savefig(output_path, dpi=300)
print(f"그래프가 생성되었습니다: {output_path}")

# plt.show()
