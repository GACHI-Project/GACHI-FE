import { View, Text, TouchableOpacity } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import styles from '../../styles/home/recentDocs';

interface DocItem {
  id: string;
  title: string;
  childName: string;
  grade: string;
  rawDate: string;
}

interface DocGroup {
  date: string;
  rawDate: string;
  items: DocItem[];
}

const RECENT_DOCS: DocGroup[] = [
  {
    date: '3월 20일',
    rawDate: '2025-03-20',
    items: [
      {
        id: '1',
        title: '학부모 상담 안내문',
        childName: '김둘째',
        grade: '초등학교 1학년',
        rawDate: '2025-03-20',
      },
    ],
  },
  {
    date: '3월 18일',
    rawDate: '2025-03-18',
    items: [
      {
        id: '2',
        title: '학부모 상담 안내문',
        childName: '김둘째',
        grade: '초등학교 1학년',
        rawDate: '2025-03-18',
      },
      {
        id: '3',
        title: '학부모 상담 안내문',
        childName: '김둘째',
        grade: '초등학교 1학년',
        rawDate: '2025-03-18',
      },
    ],
  },
];

const RecentDocs = () => (
  <View style={styles.section}>
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>최근 가정통신문</Text>
      {/* TODO: 전체 문서 목록 화면으로 이동 예정 */}
      <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
        <Text style={styles.moreText}>전체보기</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.timeline}>
      {RECENT_DOCS.map((group) => (
        <View key={group.rawDate} style={styles.group}>
          <View style={styles.dateRow}>
            <View style={styles.dateDot} />
            <Text style={styles.dateText}>{group.date}</Text>
          </View>
          <View style={styles.timelineBody}>
            <View style={styles.lineColumn}>
              <View style={styles.line} />
            </View>
            <View style={styles.cardsArea}>
              {group.items.map((doc) => (
                // TODO: 문서 상세 화면으로 이동 예정 router.push(`/(tabs)/documents/${doc.id}`)
                <TouchableOpacity
                  key={doc.id}
                  style={styles.docCard}
                  activeOpacity={0.8}
                  onPress={() => {}}
                >
                  <View style={styles.docIconBox}>
                    <AntDesign
                      name="file-done"
                      size={25}
                      color={colors.text.white}
                      style={styles.docIcon}
                    />
                  </View>
                  <View style={styles.docTexts}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docMeta}>
                      {doc.childName} · {doc.grade}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.gray[200]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
);

export default RecentDocs;
