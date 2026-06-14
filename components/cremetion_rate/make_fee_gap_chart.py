import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import os

# 1. 한글 폰트 설정 (MacOS 기준 AppleGothic)
def set_korean_font():
    font_path = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"
    if os.path.exists(font_path):
        font_name = fm.FontProperties(fname=font_path).get_name()
        plt.rc('font', family=font_name)
    else:
        plt.rc('font', family='sans-serif')
    plt.rcParams['axes.unicode_minus'] = False

set_korean_font()

# 2. 데이터 정의 (etc/cremation-fee-gap/index.html 기반)
labels = ['전국 평균', '수도권 평균']
inside_fees = [100300, 122857]   # 관내 주민
outside_fees = [655117, 985714]  # 관외 주민

# 3. 그래프 생성
fig, ax = plt.subplots(figsize=(10, 7))

x = range(len(labels))
width = 0.35

# 막대 그래프 그리기
rects1 = ax.bar([p - width/2 for p in x], inside_fees, width, label='관내 주민', color='#d9d9d9')
rects2 = ax.bar([p + width/2 for p in x], outside_fees, width, label='관외 주민', color='#c02d2d')

# 텍스트 라벨 추가 (막대 위에 금액 표시)
def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax.annotate(f'{int(height/10000)}만 원',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 5),  # 3포인트 위로
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=11, fontweight='bold')

autolabel(rects1)
autolabel(rects2)

# 스타일 설정
ax.set_ylabel('평균 화장 비용 (원)', color='#444444', fontweight='bold')
ax.set_title('화장장 관내·관외 이용 비용 격차 비교', fontsize=17, pad=30, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=13, fontweight='bold')
ax.legend(frameon=False, loc='upper left', prop={'weight': 'bold', 'size': 11})

# 배경 및 그리드 정리
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.yaxis.grid(True, linestyle='--', alpha=0.3)
ax.set_facecolor('white')
fig.patch.set_facecolor('white')

# Y축 범위 상단 여백 추가
ax.set_ylim(0, 1200000)
ax.get_yaxis().set_major_formatter(plt.FuncFormatter(lambda x, p: format(int(x), ',')))

plt.tight_layout()

# 4. 결과 저장
base_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(base_dir, "../../images/fee_gap_chart.png")
plt.savefig(output_path, dpi=300)
print(f"그래프가 생성되었습니다: {output_path}")

# plt.show()
