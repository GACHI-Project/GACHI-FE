import { View, Image } from 'react-native';
import SelectionCard from '../common/SelectionCard';
import styles from '../../styles/register/language';
import { LanguageType, LanguageOption } from '../../types/language';
import KRFlag from '../../../assets/flags/KR.png';
import USFlag from '../../../assets/flags/US.png';
import VNFlag from '../../../assets/flags/VN.png';
import CNFlag from '../../../assets/flags/CN.png';

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { type: 'ko', name: '한국어', label: 'Korean', flag: KRFlag },
  { type: 'en', name: 'English', label: '영어', flag: USFlag },
  { type: 'vi', name: 'Tiếng Việt', label: '베트남어', flag: VNFlag },
  { type: 'zh', name: '中文', label: '중국어', flag: CNFlag },
];

interface LanguageSelectorProps {
  selected: LanguageType;
  onSelect: (lang: LanguageType) => void;
}

const LanguageSelector = ({ selected, onSelect }: LanguageSelectorProps) => (
  <View style={styles.cardList}>
    {LANGUAGE_OPTIONS.map((option) => (
      <SelectionCard
        key={option.type}
        name={option.name}
        label={option.label}
        leftElement={
          <View style={styles.flagWrapper}>
            <Image source={option.flag} style={styles.flagImage} />
          </View>
        }
        selected={selected === option.type}
        onPress={() => onSelect(option.type)}
        size="lg"
      />
    ))}
  </View>
);

export default LanguageSelector;
