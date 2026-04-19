import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';

const PrivacyScreen = () => {
  const router = useRouter();

  const privacyText = `가치(GACHI) 개인정보 처리방침

시행일자: 2026년 4월 15일

가치(GACHI)(이하 “서비스”)는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 서비스는 이용자의 개인정보를 어떤 항목으로, 어떤 목적으로 수집하고 이용하는지, 어떻게 보호하고 관리하는지 아래와 같이 안내합니다.

1. 수집하는 개인정보 항목
서비스는 회원가입, 본인확인, 서비스 제공 및 운영 과정에서 다음과 같은 개인정보를 수집할 수 있습니다.

1) 회원가입 시 수집 항목
• 이름, 아이디, 전화번호, 이메일 주소, 비밀번호

2) 서비스 이용 과정에서 추가로 수집할 수 있는 항목
• 자녀 이름, 자녀 학년 또는 학급 정보, 자녀 학교명
• 회원이 직접 입력한 기타 자녀 관련 정보
• 가정통신문 이미지, 문서 파일 또는 그 안에 포함된 텍스트 정보
• 문의 내용 및 고객지원 과정에서 제공한 정보

3) 서비스 이용 과정에서 자동으로 생성·수집될 수 있는 정보
• 접속 일시, 서비스 이용 기록, 기기 정보, 앱 버전 정보, 오류 로그 및 진단 정보

2. 개인정보의 수집 및 이용 목적
서비스는 수집한 개인정보를 다음의 목적을 위해 이용합니다.
• 회원가입 의사 확인 및 회원 식별
• 로그인 및 계정 관리
• 중복 가입 확인 및 부정 이용 방지
• 가정통신문 번역, 요약, 설명, 행동 가이드 등 핵심 기능 제공
• 자녀 정보 및 학교 정보에 기반한 맞춤형 서비스 제공
• 일정 안내, 알림, 저장 기능 등 부가 서비스 제공
• 서비스 품질 향상, 오류 분석, 기능 개선 및 운영 관리
• 문의 응대, 공지 전달 및 분쟁 처리
• 관련 법령상 의무 이행

3. 개인정보의 보유 및 이용기간
서비스는 개인정보의 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 다음의 경우에는 아래 기간 동안 보관할 수 있습니다.
• 회원 탈퇴 시, 부정 가입 및 서비스 오남용 방지를 위한 최소한의 계정 식별 정보: 탈퇴 후 30일
• 관계 법령에 따라 보존이 필요한 정보: 해당 법령에서 정한 기간
• 자녀 정보 및 학교 정보는 회원이 서비스 이용을 위하여 입력한 정보로서, 회원 탈퇴 또는 회원이 직접 삭제하기 전까지 보관될 수 있습니다.
• 업로드한 가정통신문, 분석 결과, 요약 결과 등은 서비스 제공 및 회원 편의 제공을 위하여 저장될 수 있으며, 회원 탈퇴 또는 회원의 삭제 요청 시 지체 없이 삭제하거나 법령상 필요한 경우 분리 보관합니다.

4. 개인정보의 제3자 제공
서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만 다음 각 호의 경우에는 예외로 합니다.
• 이용자가 사전에 별도로 동의한 경우
• 법령에 특별한 규정이 있거나 수사기관 등 국가기관의 적법한 요청이 있는 경우
• 이용자의 생명, 신체, 재산의 보호를 위하여 긴급히 필요한 경우로서 법령이 허용하는 경우

5. 개인정보 처리의 위탁
서비스는 원활한 서비스 제공을 위하여 필요한 경우 개인정보 처리 업무의 일부를 외부 전문업체에 위탁할 수 있습니다. 
• 클라우드 서버 및 데이터 저장소 운영
• 이메일 인증코드 발송
• 알림 메시지 또는 푸시 발송
• 로그 분석 및 장애 모니터링
※ 실제 서비스 출시 시에는 수탁업체명, 위탁업무 내용을 확정하여 본 방침에 반영합니다.

6. 개인정보의 파기 절차 및 방법
서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 된 경우 지체 없이 해당 정보를 파기합니다.
• 전자적 파일 형태의 개인정보는 복구 또는 재생이 불가능한 기술적 방법을 사용하여 삭제합니다.
• 종이 문서에 기록된 개인정보는 분쇄 또는 소각 등의 방법으로 파기합니다.

7. 이용자의 권리와 행사 방법
• 이용자는 언제든지 자신의 개인정보를 조회, 수정 또는 삭제할 수 있습니다.
• 이용자는 언제든지 회원탈퇴를 통하여 개인정보 처리에 대한 동의를 철회할 수 있습니다.
• 이용자는 서비스에 대하여 개인정보 처리와 관련한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다.

8. 개인정보의 안전성 확보조치
서비스는 이용자의 개인정보를 안전하게 관리하기 위하여 다음과 같은 조치를 시행합니다.
• 비밀번호 등 중요 정보의 암호화 저장
• 개인정보 접근 권한의 최소화
• 보안 취약점 점검 및 시스템 접근 통제
• 해킹, 악성코드, 무단 접근 등에 대한 기술적 보호조치
• 접속기록 관리 및 내부 관리계획 수립

9. 아동 관련 정보 처리에 관한 사항
• 서비스는 회원이 입력하는 자녀 관련 정보를 맞춤형 서비스 제공을 위한 범위 내에서만 수집·이용합니다.
• 서비스는 자녀 관련 정보가 민감하게 다뤄져야 함을 인식하고, 서비스 제공에 필요한 최소한의 정보만 수집하는 것을 원칙으로 합니다.
• 서비스는 자녀의 주민등록번호, 여권번호, 건강정보 등 민감하거나 과도한 개인정보의 입력을 요구하지 않습니다.
• 회원은 자녀 정보를 입력할 경우 해당 정보 제공에 대한 적법한 권한과 책임을 가집니다.

10. 업로드 문서 및 분석 데이터에 관한 사항
• 서비스는 회원이 업로드한 가정통신문 이미지, 문서 파일 및 그로부터 추출된 텍스트를 번역, 요약, 설명, 행동 가이드 생성 등 서비스 제공 목적 범위 내에서 처리할 수 있습니다.
• 업로드된 문서에 포함된 정보는 회원이 요청한 기능 수행, 결과 제공, 오류 개선 및 서비스 품질 향상을 위하여 저장·분석될 수 있습니다.
• 회원은 업로드 전 문서의 민감한 내용 및 개인정보 포함 여부를 확인하여야 하며, 제3자의 권리를 침해하지 않는 자료만 업로드하여야 합니다.
• 서비스는 법령 위반 또는 제3자 권리 침해 우려가 있는 문서에 대하여 저장 제한, 삭제 또는 이용 제한 조치를 취할 수 있습니다.

11. 개인정보 보호책임자 및 문의처
서비스는 개인정보 관련 문의, 불만처리 및 피해구제를 위하여 아래와 같은 문의 창구를 운영합니다.
• 서비스명: 가치(GACHI)
• 개인정보 보호 문의: privacy@gachi.app
• 일반 문의: support@gachi.app

12. 개인정보 처리방침의 변경
본 개인정보 처리방침은 관련 법령, 서비스 정책 또는 운영 방식의 변경에 따라 수정될 수 있습니다. 개정하는 경우 서비스 내 공지사항 또는 별도 화면을 통해 안내합니다.

부칙
본 개인정보 처리방침은 2026년 4월 15일부터 시행합니다.`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>개인정보 처리방침</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.body}>{privacyText}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>동의하고 계속하기</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PrivacyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  body: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text.white,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
