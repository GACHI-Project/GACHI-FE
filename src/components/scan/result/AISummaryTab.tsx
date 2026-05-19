import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import SummaryCard from './SummaryCard';
import {
  getNewsletterSummary,
  getNewsletterChecklist,
  NewsletterApiError,
} from '../../../api/newsletter';
import type { NewsletterSummaryResult, ChecklistItem } from '../../../api/newsletter';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface Props {
  newsletterId?: number;
}

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

const mapSummaryError = (e: unknown): string => {
  if (e instanceof NewsletterApiError) {
    if (e.code === 'NL4092') return '아직 분석 중인 가정통신문이에요.';
    if (e.code === 'NL4221') return '분석에 실패한 가정통신문이에요.';
    if (e.code === 'NL4041') return '가정통신문을 찾을 수 없어요.';
    if (e.code === 'NL4031') return '접근 권한이 없어요.';
  }
  return '요약을 불러오는 데 실패했어요.';
};

export default function AISummaryTab({ newsletterId }: Props) {
  const [summary, setSummary] = useState<NewsletterSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [todos, setTodos] = useState<ChecklistItem[]>([]);
  const [todoLoading, setTodoLoading] = useState(true);
  const [todoError, setTodoError] = useState<string | null>(null);

  useEffect(() => {
    if (!newsletterId) {
      setSummaryError('가정통신문 정보를 찾을 수 없어요.');
      setSummaryLoading(false);
      setTodoError('가정통신문 정보를 찾을 수 없어요.');
      setTodoLoading(false);
      return;
    }

    let cancelled = false;

    getNewsletterSummary(newsletterId)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((e) => { if (!cancelled) setSummaryError(mapSummaryError(e)); })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });

    getNewsletterChecklist(newsletterId, 'TODO')
      .then((data) => { if (!cancelled) setTodos(data); })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setTodoError('가정통신문을 찾을 수 없어요.');
        } else {
          setTodoError('할 일 목록을 불러오는 데 실패했어요.');
        }
      })
      .finally(() => { if (!cancelled) setTodoLoading(false); });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  return (
    <View style={styles.list}>
      <SummaryCard icon="bulb-outline" iconBg={colors.primary[400]} title="AI 요약">
        {summaryLoading ? (
          <ActivityIndicator size="small" color={colors.primary[400]} />
        ) : summaryError ? (
          <Text style={styles.errorText}>{summaryError}</Text>
        ) : summary ? (
          <>
            <Text style={styles.summaryTitle}>{summary.title}</Text>
            <Text style={styles.body}>{summary.summary}</Text>
          </>
        ) : null}
      </SummaryCard>

      <SummaryCard icon="alarm-outline" iconBg={colors.secondary[600]} title="오늘 할 일">
        {todoLoading ? (
          <ActivityIndicator size="small" color={colors.primary[400]} />
        ) : todoError ? (
          <Text style={styles.errorText}>{todoError}</Text>
        ) : todos.length === 0 ? (
          <Text style={styles.errorText}>등록된 할 일이 없어요.</Text>
        ) : (
          <View style={styles.todoList}>
            {todos.map((item) => (
              <View key={item.checklistId} style={styles.todoItem}>
                <View style={styles.bullet} />
                <Text style={styles.todoText}>
                  {item.targetDateLabel && (
                    <Text style={styles.todoWhen}>{item.targetDateLabel}</Text>
                  )}
                  {item.targetDateLabel ? ' — ' : ''}
                  {item.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </SummaryCard>

      <SummaryCard icon="earth-outline" iconBg={colors.primary[400]} title="문화 맥락 안내">
        <View style={styles.qnaList}>
          {QNA_ITEMS.map((item) => (
            <View key={item.q} style={styles.qnaItem}>
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
  summaryTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
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
