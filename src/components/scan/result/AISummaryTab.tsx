import { View, Text, StyleSheet } from 'react-native';
import SummaryCard from './SummaryCard';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

const TODO_ITEMS = [
  { when: '지금 바로', desc: '동의서에 서명 후 내일 가방에 넣어두기' },
  { when: '내일', desc: '담임 선생님께 동의서 직접 제출' },
  { when: '5월 21일', desc: '도시락, 체육복, 물병 준비' },
];

const QNA_ITEMS = [
  {
    q: '동의서를 왜 직접 제출해야 하나요?',
    a: '한국 초등학교는 교외 활동 시 ',
    aHighlight: '보호자 서명 원본',
    aTail: '이 법적으로 필요해요. 카카오톡이나 앱 메시지로 대체가 안 돼요.',
  },
  {
    q: '늦게 내면 어떻게 되나요?',
    a: '마감일이 지나면 ',
    aHighlight: '현장학습 참가가 불가',
    aTail: '할 수 있어요. 늦으면 바로 담임 선생님께 직접 연락하세요.',
  },
];

export default function AISummaryTab() {
  return (
    <View style={styles.list}>
      <SummaryCard icon="bulb-outline" iconBg={colors.primary[400]} title="AI 요약">
        <Text style={styles.body}>
          {'첫째 반이 '}
          <Text style={styles.highlight}>5월 22일 목요일</Text>
          {'에 '}
          <Text style={styles.highlight}>국립민속박물관과 경복궁</Text>
          {
            '으로 봄 현장학습을 가요. 전일 체험학습이라 학교 점심 급식이 없으니 도시락을 꼭 챙겨야 해요.'
          }
        </Text>
        <Text style={styles.body}>
          {'가장 중요한 건 '}
          <Text style={styles.highlight}>동의서를 오늘(5월 15일)까지</Text>
          {' 담임 선생님께 직접 제출하는 것이에요.'}
        </Text>
      </SummaryCard>

      <SummaryCard icon="alarm-outline" iconBg={colors.secondary[600]} title="오늘 할 일">
        <View style={styles.todoList}>
          {TODO_ITEMS.map((item, i) => (
            <View key={String(i)} style={styles.todoItem}>
              <View style={styles.bullet} />
              <Text style={styles.todoText}>
                <Text style={styles.todoWhen}>{item.when}</Text>
                {' — '}
                {item.desc}
              </Text>
            </View>
          ))}
        </View>
      </SummaryCard>

      <SummaryCard icon="earth-outline" iconBg={colors.primary[400]} title="문화 맥락 안내">
        <View style={styles.qnaList}>
          {QNA_ITEMS.map((item, i) => (
            <View key={String(i)} style={styles.qnaItem}>
              <View style={styles.qnaRow}>
                <Text style={styles.qLabel}>Q.</Text>
                <Text style={styles.qText}>{item.q}</Text>
              </View>
              <View style={styles.qnaRow}>
                <Text style={styles.aLabel}>A.</Text>
                <Text style={styles.aText}>
                  {item.a}
                  <Text style={styles.aHighlight}>{item.aHighlight}</Text>
                  {item.aTail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </SummaryCard>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  highlight: {
    fontFamily: fonts.semiBold,
    color: colors.primary[500],
  },
  todoList: {
    gap: 10,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: colors.secondary[200],
    borderWidth: 1,
    backgroundColor: colors.secondary[100],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary[600],
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  todoWhen: {
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  qnaList: {
    gap: 16,
  },
  qnaItem: {
    gap: 6,
  },
  qnaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  qLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary[500],
    width: 18,
  },
  aLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text.secondary,
    width: 18,
  },
  qText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  aText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  aHighlight: {
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
});
